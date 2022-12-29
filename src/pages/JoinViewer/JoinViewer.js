import React, {useState} from 'react';
import {Header} from '../../components/Header/Header';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import ParticipantsBadge from '../../components/ParticipantsBadge/ParticipantsBadge';
import {Flex} from '@chakra-ui/react';
import styles from './JoinModeSelect.module.scss';
import Footer from '../../components/Footer/Footer';
import {Container} from '../../components/Container/Container';
import Input from '../../components/Input/Input';
import {FaceIcon} from '../../assets';
import {Button} from '../../components/Button/Button';
import {utils} from 'near-api-js';

export const JoinViewer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {sid} = useParams()
  const [room] = useState(location.state?.room)
  const [name, setName] = useState('')

  if (!room) {
    navigate('/')
    return null
  }

  const onJoin = () => {
    // TODO: pay?
    navigate('/call/' + sid, {name, noPublish: true});
  }

  return (
    <>
      <Header
        centered
        title={room?.title}
      >
        <Flex
          h={40}
          alignItems={'center'}
        >
          <span className={styles.smallText}>at the room:</span>&nbsp;<ParticipantsBadge count={room?.count}/>
        </Flex>
      </Header>

      <Container>
        <Flex
          mt={80}
          flexDirection={'column'}
          alignItems={'center'}
        >
          <h1 className={styles.title}>
            {room.hostName} invites you
          </h1>

          <Flex
            my={40}
            gap={'30px'}
            width={'100%'}
            maxWidth={'420px'}
            alignItems={'stretch'}
          >
            <Input
              value={name}
              onChange={setName}
              label={'Enter your name'}
              icon={FaceIcon}
              placeholder={'John'}
              containerStyle={{
                width: '100%',
                textAlign: 'center',
              }}
            />
          </Flex>

          <div className={styles.button}>
            <Button
              text={room.viewerPrice !== '' ? utils.format.formatNearAmount(room.viewerPrice) + ' NEAR' : 'Free'}
              onClick={onJoin}
            />
          </div>

          <p className={styles.smallGreyText}>
            End-to-end encryption is enabled,<br/>
            we recommend using the Google Chrome browser.
          </p>
        </Flex>
      </Container>

      <Footer/>
    </>
  )
}