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
      console.log("WebSocketProvider: received message", message);
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
    <div
      style={{
        backgroundColor: "#282828",
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",

        // overflow: "hidden",
      }}
    >
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
        <div
          style={{
            width: "100%",
            // height: "100%",
          }}
        >
          <div
            style={{
              height: "calc(100vh - 80px)",
              overflowY: "scroll",
            }}
          >
            <MessageList me={me} messages={currentChannel?.messages ?? []} />
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
              style={{
                width: "100%",
                height: 40,
                padding: 8,
                borderRadius: 8,
              }}
              type="text"
              placeholder="Message"
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              style={{
                padding: 8,
                borderRadius: 8,
                height: 40,
              }}
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
              }}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
        <ParticipantsList channel={currentChannel} />
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatScreenBody: {
    alignItems: "flex-end",
    // alignContent: "space-between",
    justifyContent: "space-between",
    display: "flex",
    flex: 1,
    flexDirection: "row",
  },
};

export default ChatScreen;
