import { Message, User } from "@seungpyo.hong/netpro-hw";
import MessageBubble from "src/atoms/MessageBubble";

interface MessageListProps {
  me: User;
  messages: Message[];
}

const MessageList = ({ me, messages }: MessageListProps) => {
  console.log("MessageList rendering with messages:", messages);

  if (messages.length === 0) {
    return <div>No messages</div>;
  }
  return (
    <div
      style={{
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          mine={message.sender.id === (me?.id ?? "1")}
        />
      ))}
    </div>
  );
};

export default MessageList;
