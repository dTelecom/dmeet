import { Box, Button, Text } from '@chakra-ui/react';
import styles from './Home.module.css';
import {useNavigate} from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const startMeeting = () => {
    navigate(`/rooms/${generateRoomId()}`);
  };

  return (
    <Box className={styles.container} bg="cld.bg1" minH="100vh">
      <main>
        <Text textStyle={['h3', 'h3', 'h2']} color="marketing.lk-white" mb={['2rem', null]}>
          LiveKit Meet
        </Text>
        <Button
          onClick={startMeeting}
          variant="primary"
          py="0.75rem"
          px="2rem"
          _hover={{ backgroundColor: '#4963B0' }}
        >
          Start Meeting
        </Button>
      </main>
    </Box>
  );
};

export default Home;

function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`;
}

function randomString(length: number): string {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
