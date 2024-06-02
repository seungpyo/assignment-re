import { Message } from "@seungpyo.hong/netpro-hw";

interface MessageBubbleProps {
  message: Message;
  mine: boolean;
}

const MessageBubble = ({ message, mine }: MessageBubbleProps) => {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: mine ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: mine ? "flex-end" : "flex-start",
            padding: 8,
            borderRadius: 8,
          }}
        >
          <h3 style={{ color: "white" }}>{message.sender.name}</h3>
          <div
            style={{
              ...styles.messageBubble,
              backgroundColor: mine ? "green" : "blue",
              alignItems: mine ? "flex-end" : "flex-start",
              width: "fit-content",
              maxWidth: "70%",
              height: "fit-content",
              paddingTop: 2,
              paddingBottom: 2,
              paddingLeft: 16,
              paddingRight: 16,
            }}
          >
            <p style={{ color: "white" }}>{message.content}</p>
          </div>
          <p
            style={{
              color: "white",
              fontSize: 12,
              textAlign: mine ? "right" : "left",
            }}
          >
            {message.createdAt}
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  messageBubble: {
    display: "flex",
    flexDirection: "column",
    // alignItems: "center",
    // padding: 8,
    // margin: 12,
    borderRadius: 8,
  },
};

export default MessageBubble;
