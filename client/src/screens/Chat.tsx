import { useState, useEffect, useRef, useCallback } from "react";
import ParticipantsList from "../molecules/ParticipantsList";
import ChannelList from "../molecules/ChannelList";
import { useWebSocket } from "../context/wsContext";
import MessageList from "src/molecules/MessageList";
import { ApiClient } from "src/apiClient";
import VideoChat from "../molecules/VideoChat";
import { Channel, User, Protocol } from "@seungpyo.hong/netpro-hw";

interface ChatScreenProps {
  me: User;
  onLogout: () => void;
}

const ChatScreen = ({ me, onLogout }: ChatScreenProps) => {
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { registerWSCallback, ws } = useWebSocket();

  const handleNewMessage = useCallback(
    (msg: Protocol.WSMessage) => {
      console.log("Received new message:", msg);
      const message = msg as Protocol.WSMessageWithTarget;
      console.log("currentChannel?.id:", currentChannel?.id);
      console.log("message.channelId:", message.channelId);
      if (!currentChannel) {
        console.error("Current channel is null");
        return;
      }
      if (message.channelId === currentChannel?.id) {
        setCurrentChannel((prevChannel) => {
          if (!prevChannel) return prevChannel;
          const newMessages = [
            ...prevChannel.messages,
            JSON.parse(message.data),
          ];
          console.log("Updating messages in the state", newMessages);
          const newChannel = {
            ...prevChannel,
            messages: newMessages,
          };
          console.log("newChannel:", newChannel);
          return newChannel;
        });
      }
    },
    [currentChannel]
  );
  
  const peerConnections = new Map<string, RTCPeerConnection>();

  const createPeerConnection = (senderId: string): RTCPeerConnection => {
    console.log(`Creating new RTCPeerConnection for senderId: ${senderId}`);
    const pc = new RTCPeerConnection();
    peerConnections.set(senderId, pc);
    return pc;
  };
  
  const getPeerConnection = (senderId: string): RTCPeerConnection | undefined => {
    const pc = peerConnections.get(senderId);
    console.log(`Retrieving RTCPeerConnection for senderId: ${senderId}:`, pc);
    return pc;
  };
  
  const deletePeerConnection = (senderId: string) => {
    const pc = peerConnections.get(senderId);
    if (pc) {
      pc.close();
      peerConnections.delete(senderId);
      console.log(`Deleted RTCPeerConnection for senderId: ${senderId}`);
    }
  };  

  const iceCandidatesBuffer = new Map();
  
  const handleVideoOffer = useCallback(
    async (msg: Protocol.WSMessage) => {
      console.log("Received SDP offer:", msg.data);
      const message = msg as Protocol.WSMessageWithTarget;
      if (!message.target || message.target !== currentChannel?.id) return;
  
      const pc = createPeerConnection(message.senderId);
      console.log("handleVideoOffer: Created new RTCPeerConnection:", pc);
  
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      console.log("Tracks added to RTCPeerConnection.");
  
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate:", event.candidate);
          if (ws) {
            ws.send(
              JSON.stringify({
                senderId: me.id,
                channelId: message.channelId,
                type: "new-ice-candidate" as Protocol.WSMessageType,
                data: JSON.stringify(event.candidate),
                target: message.senderId,
              })
            );
          } else {
            console.error("WebSocket is not available for ICE candidate");
          }
        }
      };
  
      pc.ontrack = (event) => {
        console.log("Received remote track:", event.streams[0]);
        setRemoteStream(event.streams[0]);
      };
  
      await pc.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(message.data))
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("Sending SDP answer:", answer);
      if (ws) {
        ws.send(
          JSON.stringify({
            senderId: me.id,
            channelId: message.channelId,
            type: "video-answer" as Protocol.WSMessageType,
            data: JSON.stringify(answer),
            target: message.senderId,
          })
        );
      } else {
        console.error("WebSocket is not available for SDP answer");
      }
    },
    [currentChannel?.id, me.id, ws]
  );      
  
  const handleVideoAnswer = useCallback(
    async (msg: Protocol.WSMessage) => {
      //console.log("Received SDP answer:", msg.data);
      const message = msg as Protocol.WSMessageWithTarget;
      const pc = getPeerConnection(message.senderId);
      if (!pc) {
        console.error("peerConnection is null for senderId:", message.senderId);
        return;
      }
  
      const desc = new RTCSessionDescription(JSON.parse(message.data));
      await pc.setRemoteDescription(desc);
    },
    [ws]
  );      
  
  const handleNewICECandidate = useCallback(
    async (msg: Protocol.WSMessageWithTarget) => {
      if (msg.target !== currentChannel?.id) return;
      console.log("Received new ICE candidate:", msg.data);
  
      const pc = getPeerConnection(msg.senderId);
      if (!pc) {
        console.error("peerConnection is null for senderId:", msg.senderId);
        return;
      }
  
      try {
        const candidateData = JSON.parse(msg.data);
        console.log("Parsed ICE candidate data:", candidateData);
  
        if (!candidateData.sdpMid || candidateData.sdpMLineIndex == null) {
          console.error("ICE candidate missing sdpMid or sdpMLineIndex:", candidateData);
          return;
        }
  
        const candidate = new RTCIceCandidate(candidateData);
        console.log("Adding ICE candidate:", candidate);
  
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(candidate);
          console.log("ICE candidate added:", candidate);
        } else {
          console.log("Buffering ICE candidate until remote description is set:", candidate);
          const bufferedCandidates = iceCandidatesBuffer.get(msg.senderId) || [];
          bufferedCandidates.push(candidate);
          iceCandidatesBuffer.set(msg.senderId, bufferedCandidates);
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    },
    [currentChannel?.id]
  );        

  const disconnectCall = useCallback(() => {
    console.log("Disconnecting call...");
    peerConnections.forEach((pc, peerId) => {
      pc.close();
      peerConnections.delete(peerId);
    });
  
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
  
    if (ws && currentChannel) {
      ws.send(
        JSON.stringify({
          senderId: me.id,
          channelId: currentChannel.id,
          type: "leave" as Protocol.WSMessageType,
          data: "",
          target: currentChannel.id,
        })
      );
    } else {
      console.error("WebSocket or currentChannel is not available for sending leave message");
    }
  }, [currentChannel, localStream, me.id, remoteStream, ws]);
  
  const handleLeave = useCallback(
    (msg: Protocol.WSMessage) => {
      console.log("Received leave message:", msg.data);
      const message = msg as Protocol.WSMessageWithTarget;
      if (!message.target || message.target !== me.id) return;
  
      disconnectCall();
    },
    [disconnectCall, me.id]
  );
  

  useEffect(() => {
    console.log("watchdog->currentChannel:", currentChannel);
  }, [currentChannel]);
  
  useEffect(() => {
    if (!ws) {
      console.error("WebSocket is null");
      return;
    }
  
    ws.onopen = () => {
      console.log("WebSocket connection established");
    };
  
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  
    ws.onclose = (event) => {
      console.log("WebSocket connection closed");
      console.log("reason: ", event.reason);
      // Reconnect logic can be added here if necessary
    };
  
    console.log("Registering WebSocket callbacks");
    registerWSCallback(
      "video-offer" as Protocol.WSMessageType,
      handleVideoOffer as any
    );
    registerWSCallback(
      "video-answer" as Protocol.WSMessageType,
      handleVideoAnswer as any
    );
    registerWSCallback(
      "new-ice-candidate" as Protocol.WSMessageType,
      handleNewICECandidate as any
    );
    registerWSCallback("leave" as Protocol.WSMessageType, handleLeave as any);
    registerWSCallback(
      "text" as Protocol.WSMessageType,
      handleNewMessage as any
    );
  }, [
    handleLeave,
    handleNewICECandidate,
    handleNewMessage,
    handleVideoAnswer,
    handleVideoOffer,
    registerWSCallback,
    ws,
  ]);    

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote stream...");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startVideoCall = async () => {
    console.log("Starting video call...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);
    console.log("Local stream set.");
  
    const pc = createPeerConnection(me.id);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    console.log("Tracks added to RTCPeerConnection.");
  
    pc.onicecandidate = (event) => {
      console.log("pc.onicecandidate: event=", event);
      if (event.candidate) {
        if (ws) {
          ws.send(
            JSON.stringify({
              senderId: me.id,
              channelId: currentChannel?.id || "",
              type: "new-ice-candidate" as Protocol.WSMessageType,
              data: JSON.stringify(event.candidate),
              target: currentChannel?.id || "",
            })
          );
        } else {
          console.error("WebSocket is not available for ICE candidate");
        }
      }
    };
  
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.streams[0]);
      setRemoteStream(event.streams[0]);
    };
  
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Sending SDP offer:", offer);
    if (ws) {
      ws.send(
        JSON.stringify({
          senderId: me.id,
          channelId: currentChannel?.id || "",
          type: "video-offer" as Protocol.WSMessageType,
          data: JSON.stringify(offer),
          target: currentChannel?.id || "",
        })
      );
    } else {
      console.error("WebSocket is not available for SDP offer");
    }
  };    

  // useEffect(() => {
  //   if (!currentChannel) {
  //     setCurrentChannel(dummyChannel);
  //   }
  // }, [currentChannel]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <ChannelList
        me={me}
        currentChannel={currentChannel}
        onChannelSelect={(c) => {
          console.log("Channel selected in ChannelListItem", c);
          setCurrentChannel(c);
        }}
      />
      <div style={styles.chatScreenBody}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 8,
            }}
          >
            <button>Voice</button>
            <button onClick={startVideoCall}>Video</button>
            <button onClick={disconnectCall}>Disconnect</button>
          </div>
          <div style={{ height: "calc(100vh - 80px)", overflowY: "scroll" }}>
            <MessageList
              me={me}
              messages={currentChannel?.messages ?? []}
              key={currentChannel?.messages.length}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 8,
            }}
          >
            <input
              style={{ width: "100%", height: 40, padding: 8, borderRadius: 8 }}
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
                setInputMessage("");
              }}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
        <ParticipantsList channel={currentChannel} />
      </div>
      <VideoChat
        localStream={localStream}
        remoteStream={remoteStream}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatScreenBody: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
};

export default ChatScreen;
