import { useState, useEffect, useRef } from 'react';
import ParticipantsList from '../molecules/ParticipantsList';
import ChannelList from '../molecules/ChannelList';
import { useWebSocket } from '../context/wsContext';
import MessageList from 'src/molecules/MessageList';
import { ApiClient } from 'src/apiClient';
import VideoChat from '../molecules/VideoChat';
import { Channel, User, Protocol } from "@seungpyo.hong/netpro-hw";

interface ChatScreenProps {
  me: User;
  onLogout: () => void;
}

const dummyChannel: Channel = {
  id: "1",
  name: "Dummy Channel",
  participants: [],
  messages: (() => {
    const messages = [];
    for (let i = 0; i < 100; i++) {
      messages.push({
        id: i.toString(),
        sender: {
          id: i % 2 === 0 ? "1" : "2",
          name: i % 2 === 0 ? "A" : "B",
        },
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      });
    }
    return messages;
  })(),
};

interface WSMessageWithTarget extends Protocol.WSMessage {
  target?: string;
}

const ChatScreen = ({ me, onLogout }: ChatScreenProps) => {
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { registerWSCallback, ws } = useWebSocket();

  useEffect(() => {
    if (!ws) {
      console.error('WebSocket is null');
      return;
    }

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Reconnect logic can be added here if necessary
    };

    console.log('Registering WebSocket callbacks');
    registerWSCallback('video-offer' as Protocol.WSMessageType, handleVideoOffer as any);
    registerWSCallback('video-answer' as Protocol.WSMessageType, handleVideoAnswer as any);
    registerWSCallback('new-ice-candidate' as Protocol.WSMessageType, handleNewICECandidate as any);
    registerWSCallback('leave' as Protocol.WSMessageType, handleLeave as any);
    registerWSCallback('new-message' as Protocol.WSMessageType, handleNewMessage as any);

  }, [ws]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleNewMessage = (msg: Protocol.WSMessage) => {
    const message = msg as WSMessageWithTarget;
    if (message.channelId === currentChannel?.id) {
      setCurrentChannel(prevChannel => {
        if (!prevChannel) return prevChannel;
        return {
          ...prevChannel,
          messages: [...prevChannel.messages, JSON.parse(message.data)]
        };
      });
    }
  };

  const startVideoCall = async () => {
    console.log("Starting video call...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    console.log("Local stream set.");

    const pc = new RTCPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    console.log("Tracks added to RTCPeerConnection.");

    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        if (ws) {
          ws.send(JSON.stringify({
            senderId: me.id,
            channelId: currentChannel?.id || '',
            type: 'new-ice-candidate' as Protocol.WSMessageType,
            data: JSON.stringify(event.candidate),
            target: currentChannel?.id || ''
          }));
        } else {
          console.error('WebSocket is not available for ICE candidate');
        }
      }
    };

    pc.ontrack = event => {
      console.log("Received remote track:", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    setPeerConnection(pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Sending SDP offer:", offer);
    if (ws) {
      ws.send(JSON.stringify({
        senderId: me.id,
        channelId: currentChannel?.id || '',
        type: 'video-offer' as Protocol.WSMessageType,
        data: JSON.stringify(offer),
        target: currentChannel?.id || ''
      }));
    } else {
      console.error('WebSocket is not available for SDP offer');
    }
  };

  const handleVideoOffer = async (msg: Protocol.WSMessage) => {
    console.log("Received SDP offer:", msg.data);
    const message = msg as WSMessageWithTarget;
    if (!message.target || message.target !== me.id) return;

    const pc = new RTCPeerConnection();
    setPeerConnection(pc);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    console.log("Tracks added to RTCPeerConnection.");

    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        if (ws) {
          ws.send(JSON.stringify({
            senderId: me.id,
            channelId: message.channelId,
            type: 'new-ice-candidate' as Protocol.WSMessageType,
            data: JSON.stringify(event.candidate),
            target: message.senderId
          }));
        } else {
          console.error('WebSocket is not available for ICE candidate');
        }
      }
    };

    pc.ontrack = event => {
      console.log("Received remote track:", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.data)));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log("Sending SDP answer:", answer);
    if (ws) {
      ws.send(JSON.stringify({
        senderId: me.id,
        channelId: message.channelId,
        type: 'video-answer' as Protocol.WSMessageType,
        data: JSON.stringify(answer),
        target: message.senderId
      }));
    } else {
      console.error('WebSocket is not available for SDP answer');
    }
  };

  const handleVideoAnswer = async (msg: Protocol.WSMessage) => {
    console.log("Received SDP answer:", msg.data);
    const message = msg as WSMessageWithTarget;
    if (!message.target || message.target !== me.id) return;

    const pc = peerConnection!;
    const desc = new RTCSessionDescription(JSON.parse(message.data));
    await pc.setRemoteDescription(desc);
  };

  const handleNewICECandidate = async (msg: Protocol.WSMessage) => {
    console.log("Received new ICE candidate:", msg.data);
    const message = msg as WSMessageWithTarget;
    if (!message.target || message.target !== me.id) return;

    const pc = peerConnection!;
    const candidate = new RTCIceCandidate(JSON.parse(message.data));
    await pc.addIceCandidate(candidate);
  };

  const disconnectCall = () => {
    console.log("Disconnecting call...");
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }

      if (ws) {
        ws.send(JSON.stringify({
          senderId: me.id,
          channelId: currentChannel?.id || '',
          type: 'leave' as Protocol.WSMessageType,
          data: '',
          target: currentChannel?.id || ''
        }));
      } else {
        console.error('WebSocket is not available for sending leave message');
      }
    }
  };

  const handleLeave = (msg: Protocol.WSMessage) => {
    console.log("Received leave message:", msg.data);
    const message = msg as WSMessageWithTarget;
    if (!message.target || message.target !== me.id) return;

    disconnectCall();
  };

  useEffect(() => {
    if (!currentChannel) {
      setCurrentChannel(dummyChannel);
    }
  }, [currentChannel]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ChannelList
        me={me}
        currentChannel={currentChannel}
        onChannelSelect={setCurrentChannel}
      />
      <div style={styles.chatScreenBody}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
            <button>Voice</button>
            <button onClick={startVideoCall}>Video</button>
            <button onClick={disconnectCall}>Disconnect</button>
          </div>
          <div style={{ height: 'calc(100vh - 80px)', overflowY: 'scroll' }}>
            <MessageList me={me} messages={currentChannel?.messages ?? []} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
            <input
              style={{ width: '100%', height: 40, padding: 8, borderRadius: 8 }}
              type="text"
              placeholder="Message"
              onChange={(e) => setInputMessage(e.target.value)}
              value={inputMessage}
            />
            <button
              style={{ padding: 8, borderRadius: 8, height: 40 }}
              onClick={async () => {
                if (isSending) {
                  return;
                }
                setIsSending(true);
                const { message } = await ApiClient.sendMessage({
                  channelId: currentChannel!.id,
                  content: inputMessage,
                });
                setIsSending(false);
                setInputMessage('');
              }}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
        <ParticipantsList channel={currentChannel} />
      </div>
      <VideoChat localStream={localStream} remoteStream={remoteStream} localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatScreenBody: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
};

export default ChatScreen;
