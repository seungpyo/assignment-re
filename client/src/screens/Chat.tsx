import { Channel, User } from "@seungpyo.hong/netpro-hw";
import { useEffect, useState } from "react";
import ParticipantsList from "../molecules/ParticipantsList";
import ChannelList from "../molecules/ChannelList";
import { useWebSocket } from "src/context/wsContext";
import MessageList from "src/molecules/MessageList";
import { ApiClient } from "src/apiClient";

interface ChatScreenProps {
  me: User;
  onLogout: () => void;
}

const ChatScreen = ({ me, onLogout }: ChatScreenProps) => {
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { registerWSCallback } = useWebSocket();
  useEffect(() => {
    registerWSCallback("join", (message) => {
      const joinedUser: User = JSON.parse(message.data);
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
          onChannelSelect={async (channel) => {
            const { messages } = await ApiClient.getMessages({
              channelId: channel.id,
            });
            setCurrentChannel({ ...channel, messages });
          }}
        />
        {currentChannel ? (
          <div>
            <MessageList messages={currentChannel.messages ?? []} />
            <input
              type="text"
              placeholder="Message"
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              onClick={async () => {
                if (isSending) {
                  return;
                }
                setIsSending(true);
                const { message } = await ApiClient.sendMessage({
                  channelId: currentChannel.id,
                  content: inputMessage,
                });
                setIsSending(false);
                setInputMessage("");
                setCurrentChannel((prev) => {
                  if (!prev) {
                    return null;
                  }
                  const messages = prev.messages ?? [];
                  return {
                    ...prev,
                    messages: [
                      ...messages.filter((m) => m.id !== message.id),
                      message,
                    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
                  };
                });
              }}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        ) : null}
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
