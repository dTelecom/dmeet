import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import ActiveRoom from '../../components/ActiveRoom';
import PreJoin from '../../components/PreJoin';
import {SessionProps, TokenResult} from '../../lib/types';
import {Navigate, useNavigate, useParams} from "react-router-dom";

const Room = () => {
  const {roomName} = useParams();
  const [sessionProps, setSessionProps] = useState<SessionProps>();
  const [numParticipants, setNumParticipants] = useState<number>(0);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://meet.dmeet.org/api/room/info/'+roomName,{method: "POST"})
      .then((res) => res.json())
      .then((data: TokenResult) => {
        setNumParticipants(data.numParticipants);
      });
  }, []);

  useEffect(() => {
    if (!roomName?.match(/\w{4}\-\w{4}/)) {
      toast({
        title: 'Invalid room',
        duration: 2000,
        onCloseComplete: () => {
          navigate('/');
        },
      });
    }
  }, [roomName, toast]);

  if (!roomName) {
    return <Navigate to={'/'} />
  }

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

export default Room;
