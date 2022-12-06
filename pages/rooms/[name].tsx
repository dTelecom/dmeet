import { useToast } from '@chakra-ui/react';
import { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ActiveRoom from '../../components/ActiveRoom';
import PreJoin from '../../components/PreJoin';
import { SessionProps } from '../../lib/types';

interface RoomProps {
  roomName: string;
}

const RoomPage = ({ roomName }: RoomProps) => {
  const [sessionProps, setSessionProps] = useState<SessionProps>();
  const [numParticipants, setNumParticipants] = useState<number>(0);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch('https://meet.dmeet.org/api/room/info/'+roomName,{method: "POST"})
      .then((res) => res.json())
      .then((data: TokenResult) => {
        setNumParticipants(data.numParticipants);
      });
  }, []);

  useEffect(() => {
    if (!roomName.match(/\w{4}\-\w{4}/)) {
      toast({
        title: 'Invalid room',
        duration: 2000,
        onCloseComplete: () => {
          router.push('/');
        },
      });
    }
  }, [roomName, toast, router]);

  if (sessionProps) {
    return (
      <ActiveRoom
        {...sessionProps}
      />
    );
  } else {
    return (
      <PreJoin
        startSession={setSessionProps}
        roomName={roomName}
        numParticipants={numParticipants}
      />
    );
  }
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {

  const roomName = context.params?.name;

  if (typeof roomName !== 'string') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const props: RoomProps = {
    roomName,
  };

  return {
    props,
  };
};

export default RoomPage;
