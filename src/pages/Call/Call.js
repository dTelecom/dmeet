import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Header} from '../../components/Header/Header';
import styles from './Call.module.scss'
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {Container} from '../../components/Container/Container';
import {Box, Flex} from '@chakra-ui/react';
import VideoControls from '../../components/VideoControls/VideoControls';
import Footer from '../../components/Footer/Footer';
import classNames from 'classnames';
import ParticipantsBadge from '../../components/ParticipantsBadge/ParticipantsBadge';
import {ChainIcon, WhiteTickIcon} from '../../assets';
import CopyToClipboard from 'react-copy-to-clipboard/src';
import Video from '../../components/Video/Video';
import {PackedGrid} from 'react-packed-grid';
import {useBreakpoints} from '../../hooks/useBreakpoints';
import {useMediaConstraints} from '../../hooks/useMediaConstraints';
import {makeId} from './utils';
import {IonSFUJSONRPCSignal} from 'js-sdk/lib/signal/json-rpc-impl';
import {LocalStream} from 'js-sdk/lib/stream';
import Client from 'js-sdk/lib/client';
import * as e2ee from './e2ee'
import axios from 'axios';

const useE2ee = true;

const config = {
  encodedInsertableStreams: true,
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

const Call = () => {
  const {isMobile} = useBreakpoints();
  const navigate = useNavigate()
  const [devices, setDevices] = useState([])
  const {sid: urlSid} = useParams()
  const location = useLocation()
  const clientLocal = useRef()
  const signalLocal = useRef()
  const [sid] = useState(urlSid || undefined)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [lastRemote, setLastRemote] = useState(0)
  const {
    constraints,
    onDeviceChange,
    onMediaToggle,
    audioEnabled,
    videoEnabled,
    selectedAudioId,
    selectedVideoId,
    defaultConstraints
  } = useMediaConstraints(location.state?.callState, location.state?.audioEnabled, location.state?.videoEnabled);
  const localMedia = useRef()
  const timer = useRef()
  const streams = useRef({})
  const [mediaState, setMediaState] = useState({})
  const localUid = useRef()
  const localKey = useRef()

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  function onCopy() {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  const name = (location.state?.name || (Math.random() + 1).toString(36).substring(7)) + (!sid ? ' (Host)' : '');

  const started = useRef(false)

  const hangup = useCallback(() => {
    if (clientLocal.current) {
      clientLocal.current.signal.call('end', {})
      clientLocal.current.close();
      clientLocal.current = null
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    void loadMedia()

    return () => {
      hangup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendState = useCallback(() => {
    if (signalLocal.current?.socket.readyState === 1) {
      console.log('[sendState]', 'audio enabled: ' + audioEnabled, 'video enabled: ' + videoEnabled)

      signalLocal.current.notify('muteEvent', {
        muted: !audioEnabled, kind: 'audio'
      })

      signalLocal.current.notify('muteEvent', {
        muted: !videoEnabled, kind: 'video'
      })
    }
  }, [audioEnabled, videoEnabled])

  useEffect(() => {
    sendState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, videoEnabled, lastRemote]);

  const onLeave = useCallback(({participant}) => {
    console.log('[onLeave]', participant)
    try {
      // remove participant
      setParticipants(prev => prev.filter(p => p.uid !== participant.uid))

      // remove stream
      if (streams.current[participant.streamID]) {
        delete streams.current[participant.streamID]
      }

      // remove media state
      if (mediaState[participant.uid]) {
        setMediaState(prev => {
          const newState = {...prev}
          delete newState[participant.uid]
          return newState
        })
      }
    } catch (err) {
      console.error(err)
    }
  }, [mediaState])

  const publish = useCallback(async () => {
    LocalStream.getUserMedia({
      resolution: 'vga',
      audio: true,
      video: constraints.video || defaultConstraints.video,
      // codec: params.has('codec') ? params.get('codec') : 'vp8',
      codec: 'vp8',
      sendEmptyOnMute: false,
    }).then(async (media) => {
      loadDevices()
      localMedia.current = media
      if (constraints.audio?.exact) {
        media.switchDevice('audio', constraints.audio?.exact)
      }

      if (constraints.video?.exact) {
        media.switchDevice('video', constraints.video.exact)
      }

      await clientLocal.current.publish(media)

      if (useE2ee) {
        e2ee.setKey(new TextEncoder().encode(localKey.current))
        clientLocal.current.transports[0].pc.getSenders().forEach(e2ee.setupSenderTransform);
        clientLocal.current.transports[1].pc.addEventListener('track', (e)=>{
          e2ee.setupReceiverTransform(e.receiver);
        });
      }

      streams.current[media.id] = media
      setMediaState(prev => ({
        ...prev, [localUid.current]: {
          audio: audioEnabled,
          video: videoEnabled
        }
      }))

      onJoin({
        participant: {
          uid: localUid.current,
          streamID: media.id,
          name,
          sid
        }
      })
      setLoading(false)
    })
      .catch(console.error);
  }, [audioEnabled, constraints.audio?.exact, constraints.video, defaultConstraints.video, name, sid, videoEnabled])

  const start = useCallback(async () => {
    try {
      let url = 'https://meet.dmeet.org/api/room/create';
      let data = {name: name};
      if (sid !== undefined) {
        data.sid = sid
        url = 'https://meet.dmeet.org/api/room/join';
      } else {
        data.title = `${name} room`
        data.callID = makeId(16)
      }
      const response = await axios.post(url, data);
      const randomServer = response.data.url;
      const parsedSID = response.data.sid;
      localUid.current = response.data.uid;
      localKey.current = response.data.key;

      console.log(`Created: `, response.data);
      console.log(`Join: `, parsedSID, localUid.current);

      setInviteLink(window.location.origin + '/join/' + parsedSID)

      const _signalLocal = new IonSFUJSONRPCSignal(randomServer);
      signalLocal.current = _signalLocal

      const _clientLocal = new Client(_signalLocal, config)
      clientLocal.current = _clientLocal

      _clientLocal.onerrnegotiate = () => {
        hangup()
      };

      _clientLocal.ontrack = (track, stream) => {
        console.log('[got track]', track, 'for stream', stream);

        // If the stream is not there in the streams map.
        if (!streams.current[stream.id]) {
          streams.current[stream.id] = stream
          setMediaState(prev => ({
            ...prev
          }))
        }

        stream.onremovetrack = () => {
          console.log('[onremovetrack]', stream.id)
        };
      };

      _signalLocal.onopen = async () => {
        clientLocal.current.join(response.data.token, response.data.signature);
        sendState()
        void publish()
      }
      _signalLocal.on_notify('onJoin', onJoin);
      _signalLocal.on_notify('onLeave', onLeave);
      _signalLocal.on_notify('onStream', onStream);
      _signalLocal.on_notify('participants', onParticipantsEvent)
      _signalLocal.on_notify('muteEvent', onMuteEvent);
    } catch (errors) {
      console.error(errors);
    }
  }, [hangup, name, onLeave, publish, sendState, sid])

  const loadMedia = useCallback(async () => {
    // HACK: dev use effect fires twice
    if (started.current === true) return
    started.current = true

    await start()
  }, [start])

  const loadDevices = () => {
    navigator.mediaDevices.enumerateDevices()
      .then((devices) => {
        setDevices(devices)
      })
      .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
      });
  }

  const onJoin = ({participant}) => {
    console.log('[onJoin]', participant)
    if (participant.uid !== localUid.current) {
      setParticipants(prev => {
        const newParticipants = [...prev];
        if (!newParticipants.some(p => p.uid === participant.uid)) {
          return [...prev, participant]
        }
        return newParticipants
      })
      setLastRemote(Date.now())
    }
  }

  const onParticipantsEvent = (participants) => {
    console.log('[onParticipantsEvent]', participants)
    if (!participants) return
    setParticipants(Object.values(participants))
      setLastRemote(Date.now())
  }

  const onStream = ({participant}) => {
    console.log('[onStream]', participant)

    setParticipants(prev => {
      if (!prev.some(p => p.uid === participant.uid)) {
        return [...prev, participant]
      }

      return [...prev].map(p => {
        if (p.uid === participant.uid) {
          return {...p, streamID: participant.streamID}
        }

        return p
      });
    })

    if (participant.uid !== localUid.current) {
      setLastRemote(Date.now())
    }
  }

  const onMuteEvent = ({participant, payload}) => {
    console.log('[onMuteEvent]', participant, payload)

    setMediaState(prev => {
      let state = {audio: false, video: false}
      if (prev[participant.uid]) {
        state = prev[participant.uid]
      }

      state[payload.kind] = !payload.muted

      return {
        ...prev, [participant.uid]: state
      }
    })
  }

  const onDeviceSelect = useCallback((type, deviceId) => {
    if (!localMedia.current) return

    localMedia.current.switchDevice(type, deviceId)
    onDeviceChange(type, deviceId)
  }, [onDeviceChange])

  const toggleMedia = useCallback((type) => {
    if (!!constraints[type]) {
      localMedia.current.mute(type)
    } else {
      localMedia.current.unmute(type)
    }
    onMediaToggle(type)
    setMediaState(prev => ({
      ...prev,
      [localUid.current]: {...prev[localUid.current], [type]: !prev[localUid.current][type]}
    }))
  }, [constraints, onMediaToggle])

  return (
    <Box
      className={styles.container}
    >
      <Header>
        <Flex
          className={styles.headerControls}
          gap={'16px'}
        >
          <ParticipantsBadge count={participants?.length}/>
          <CopyToClipboard
            onCopy={onCopy}
            text={inviteLink}
          >
            <button className={styles.inviteButton}>
              <img
                src={copied ? WhiteTickIcon : ChainIcon}
                alt={'copy icon'}
              />
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </CopyToClipboard>
        </Flex>
      </Header>

      <Container
        containerClass={styles.callContainer}
        contentClass={styles.callContentContainer}
      >

        {isMobile ? (
          <Flex
            minHeight={'calc(100% - 72px)'}
            flexDirection={'row'}
            flexWrap={'wrap'}
            gap={'8px'}
            overflowY={participants.length === 1 ? 'initial' : 'auto'}
            justifyContent={'space-between'}
          >
            {participants?.map((participant, index) => (
              <Box
                key={participant.streamID}
                maxHeight={participants.length === 1 ? 'auto' : 'calc((100vh - 72px - 48px - 88px) / 2)'}
                width={participants.length === 1 ? '100%' : 'calc(50% - 8px)'}
                style={{
                  aspectRatio: 480 / 640
                }}
              >
                <Video
                  key={participant.streamID + index}
                  participant={participant}
                  stream={streams.current[participant.streamID]}
                  isCurrentUser={participant.uid === localUid.current}
                  name={participant.name}
                  mediaState={mediaState[participant.uid]}
                />
              </Box>
            ))}
          </Flex>
        ) : (
          <PackedGrid
            className={classNames(styles.videoContainer)}
            boxAspectRatio={656 / 496}
          >
            {participants?.map((participant, index) => (
                <Video
                  key={participant.streamID + index}
                  participant={participant}
                  stream={streams.current[participant.streamID]}
                  isCurrentUser={participant.uid === localUid.current}
                  name={participant.name}
                  mediaState={mediaState[participant.uid]}
                />
              )
            )}
          </PackedGrid>
        )}


        {!loading && (
          <div className={styles.videoControls}>
            <VideoControls
              devices={devices}
              onHangUp={hangup}
              videoEnabled={videoEnabled}
              audioEnabled={audioEnabled}
              onDeviceChange={onDeviceSelect}
              selectedAudioId={selectedAudioId}
              selectedVideoId={selectedVideoId}
              toggleAudio={() => toggleMedia('audio')}
              toggleVideo={() => toggleMedia('video')}
              participantsCount={participants.length}
              isCall
            />
          </div>
        )}

      </Container>
      <Footer/>
    </Box>
  )
}

export default Call