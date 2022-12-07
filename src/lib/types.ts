import { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';

export interface SessionProps {
  roomName: string;
  identity: string;
  audioTrack?: LocalAudioTrack;
  videoTrack?: LocalVideoTrack;
}

export interface TokenResult {
  url: string;
  token: string;
  numParticipants: number;
}
