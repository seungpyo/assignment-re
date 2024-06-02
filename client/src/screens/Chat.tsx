import { Channel, User } from "@seungpyo.hong/netpro-hw";
import { useEffect, useState } from "react";
import ParticipantsList from "../molecules/ParticipantsList";
import ChannelList from "../molecules/ChannelList";
import { useWebSocket } from "src/context/wsContext";

interface ChatScreenProps {
  me: User;
  onLogout: () => void;
}

const ChatScreen = ({ me, onLogout }: ChatScreenProps) => {
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const { registerWSCallback } = useWebSocket();
  useEffect(() => {
    registerWSCallback("join", (message) => {
      const joinedUser: User = JSON.parse(message.data);
      console.log("user join message", joinedUser);
      setCurrentChannel((prev) => {
        if (!prev) {
          return null;
        }
        if (prev.id !== message.channelId) {
          return prev;
        }
        return {
          ...prev,
          participants: [...prev.participants, joinedUser],
        };
      });
    });
    registerWSCallback("leave", (message) => {
      const leftUser: User = JSON.parse(message.data);
      setCurrentChannel((prev) => {
        if (!prev) {
          return null;
        }
        if (prev.id !== message.channelId) {
          return prev;
        }
        return {
          ...prev,
          participants: prev.participants.filter(
            (participant) => participant.id !== leftUser.id
          ),
        };
      });
    });
    registerWSCallback("text", (message) => {
      setCurrentChannel((prev) => {
        if (!prev) {
          return null;
        }
        if (prev.id !== message.channelId) {
          return prev;
        }
        return {
          ...prev,
          messages: [...prev.messages, JSON.parse(message.data)],
        };
      });
    });
  }, [registerWSCallback]);
  return (
    <div>
      <h1>Chat</h1>
      <div style={styles.chatScreenBody}>
        <ChannelList
          me={me}
          currentChannel={currentChannel}
          onChannelSelect={(channel) => setCurrentChannel(channel)}
        />
        <ParticipantsList channel={currentChannel} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatScreenBody: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
};

export default ChatScreen;
