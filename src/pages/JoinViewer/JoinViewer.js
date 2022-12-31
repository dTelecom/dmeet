import React, {useState} from 'react';
import {Header} from '../../components/Header/Header';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import ParticipantsBadge from '../../components/ParticipantsBadge/ParticipantsBadge';
import {Flex} from '@chakra-ui/react';
import styles from './JoinViewer.module.scss';
import Footer from '../../components/Footer/Footer';
import {Container} from '../../components/Container/Container';
import Input from '../../components/Input/Input';
import {FaceIcon} from '../../assets';
import {useBreakpoints} from '../../hooks/useBreakpoints';
import {ethers} from 'ethers';
import {ButtonWithWalletConnect} from '../../components/ButtonWithWalletConnect/ButtonWithWalletConnect';
import {contractConfig} from '../../const/contractConfig';
import {polygon} from 'wagmi/chains';
import {useContractWrite, usePrepareContractWrite, useWaitForTransaction} from 'wagmi';

export const JoinViewer = () => {
  const {isMobile} = useBreakpoints();
  const navigate = useNavigate();
  const location = useLocation();
  const {sid} = useParams();
  const [room] = useState(location.state?.room);
  const [name, setName] = useState('');

  if (!room) {
    navigate('/');
  }

  const paymentNeeded = room.viewerPrice !== '0';

  const {config: contractBuyWriteConfig} = usePrepareContractWrite({
    ...contractConfig,
    functionName: 'buyMembership',
    chainId: polygon.id,
    args: [5],
    overrides: {
      value: ethers.utils.parseEther(room.viewerPrice),
    },
  });

  const {
    data: buyData,
    write: buyMembership,
    isLoading: isBuyLoading,
    isSuccess: isBuyStarted,
    error: buyError,
  } = useContractWrite(contractBuyWriteConfig);

  const {
    data: txBuyData,
    isSuccess: txBuySuccess,
    error: txBuyError,
  } = useWaitForTransaction({
    hash: buyData?.hash,
    onSuccess(data) {
      console.log(data);
      navigate('/call/' + sid, {state: {name, noPublish: true, e2ee: room.e2ee}});
    },
  });

  const onJoin = () => {
    // TODO: pay?
    if (paymentNeeded) {
      console.log(buyMembership);
      buyMembership();
    } else {
      navigate('/call/' + sid, {state: {name, noPublish: true, e2ee: room.e2ee}});
    }
  };

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
            {room.hostName}{(isMobile ? '\n' : ' ') + 'invites you'}
          </h1>

          <Flex
            my={isMobile ? 24 : 40}
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

          <Flex mb={12}>
            <span className={styles.subtitle}>Join as a viewer:</span>
          </Flex>

          <div className={styles.button}>
            <ButtonWithWalletConnect
              onClick={onJoin}
              text={paymentNeeded ? ethers.utils.formatEther(room.viewerPrice) + ' MATIC' : 'Free'}
              disabled={!name}
              needWallet={paymentNeeded}
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
  );
};