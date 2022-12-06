import { Box, useToast } from '@chakra-ui/react';
import { DisplayContext, DisplayOptions, LiveKitRoom } from '@livekit/react-components';
import { Room, RoomEvent, VideoPresets } from 'livekit-client';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import 'react-aspect-ratio/aspect-ratio.css';
import tinykeys from 'tinykeys';
import { SessionProps, TokenResult } from '../lib/types';
import Controls from './Controls';
import DebugOverlay from './DebugOverlay';

const ActiveRoom = ({
  roomName,
  identity,
  audioTrack,
  videoTrack,
}: SessionProps) => {
  const [tokenResult, setTokenResult] = useState<TokenResult>();
  const [room, setRoom] = useState<Room>();
  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    stageLayout: 'grid',
  });
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // cleanup
    return () => {
      audioTrack?.stop();
      videoTrack?.stop();
    };
  }, []);

  const onLeave = () => {
    router.push('/');
  };

  const onConnected = useCallback(
    (room: Room) => {
      setRoom(room);
      /* @ts-ignore */
      window.currentRoom = room;
      if (audioTrack) {
        room.localParticipant.publishTrack(audioTrack);
      }
      if (videoTrack) {
        room.localParticipant.publishTrack(videoTrack);
      }
      room.on(RoomEvent.Disconnected, (reason) => {
        toast({
          title: 'Disconnected',
          description: `You've been disconnected from the room`,
          duration: 4000,
          onCloseComplete: () => {
            onLeave();
          },
        });
      });
    },
    [audioTrack, videoTrack],
  );

  useEffect(() => {
    const params: { [key: string]: string } = {
      roomName,
      identity,
    };
    fetch('https://meet.dmeet.org/api/room/token/'+roomName+"/"+identity,{method: "POST"})
      .then((res) => res.json())
      .then((data: TokenResult) => {
        setTokenResult(data);
      });
  }, []);

  useEffect(() => {
    if (window) {
      let unsubscribe = tinykeys(window, {
        'Shift+S': () => {
          displayOptions.showStats = displayOptions.showStats ? false : true;
          setDisplayOptions(displayOptions);
        },
      });
      return () => {
        unsubscribe();
      };
    }
  }, [displayOptions]);

  if (!tokenResult) {
    return <Box bg="cld.bg1" minH="100vh"></Box>;
  }

  let rtcConfig: RTCConfiguration | undefined;

  return (
    <DisplayContext.Provider value={displayOptions}>
      <Box bg="cld.bg1" height="100vh" padding="0.5rem">
        <LiveKitRoom
          url={tokenResult.url}
          token={tokenResult.token}
          onConnected={onConnected}
          roomOptions={{
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
              resolution: VideoPresets.h720.resolution,
            },
            publishDefaults: {
              screenShareSimulcastLayers: [],
            },
          }}
          connectOptions={{
            rtcConfig,
          }}
          controlRenderer={Controls}
          onLeave={onLeave}
        />
        {room && <DebugOverlay room={room} />}
      </Box>
    </DisplayContext.Provider>
  );
};

export default ActiveRoom;
