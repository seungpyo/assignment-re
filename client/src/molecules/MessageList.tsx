import { Message } from "@seungpyo.hong/netpro-hw";

interface MessageListProps {
  messages: Message[];
}
const MessageList = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return <div>No messages</div>;
  }
  return (
    <div style={styles.messageList}>
      <h2>Messages</h2>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>
            <div style={styles.messageBubble}>
              <h2>{message.sender.name}</h2>
              <p>{message.content}</p>
              <p>{message.createdAt}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  messageList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  messageBubble: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 10,
    margin: 10,
    borderRadius: 10,
    border: "1px solid black",
  },
};

export default MessageList;
