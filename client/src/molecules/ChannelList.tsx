import { Channel, errorOf, Protocol, User } from "@seungpyo.hong/netpro-hw";
import { useEffect, useState } from "react";
import { ApiClient } from "src/apiClient";
import { useWebSocket } from "src/context/wsContext";

interface ChannelListProps {
  me: User;
  currentChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
}

const ChannelList = ({
  me,
  currentChannel,
  onChannelSelect,
}: ChannelListProps) => {
  const { ws } = useWebSocket();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showChannelCreateDialog, setShowChannelCreateDialog] = useState(false);
  const [showChannelJoinDialog, setShowChannelJoinDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [joinChannelId, setJoinChannelId] = useState("");

  useEffect(() => {
    ApiClient.getChannels().then((response) => {
      if (errorOf(response)) {
        alert(errorOf(response)?.message);
        return;
      }
      setChannels((response as Protocol.GetChannelsResponse).channels);
    });
  }, []);

  return (
    <div style={styles.channelList}>
      <h2>Channels</h2>
      <button onClick={() => setShowChannelCreateDialog(true)}>
        Create Channel
      </button>
      {showChannelCreateDialog ? (
        <div>
          <input
            type="text"
            placeholder="Channel name"
            onChange={(e) => setNewChannelName(e.target.value)}
          />
          <button
            onClick={async () => {
              const res = await ApiClient.createChannel({
                name: newChannelName,
                creator: me,
              });
              if (errorOf(res)) {
                alert(errorOf(res)?.message);
                return;
              }
              const { newChannel } = res as Protocol.CreateChannelResponse;
              setChannels([...channels, newChannel]);
              setShowChannelCreateDialog(false);
            }}
          >
            Create
          </button>
        </div>
      ) : null}
      <button onClick={() => setShowChannelJoinDialog(true)}>
        Join Channel
      </button>
      {showChannelJoinDialog ? (
        <div>
          <input
            type="text"
            placeholder="Channel ID"
            onChange={(e) => setJoinChannelId(e.target.value)}
          />
          <button
            onClick={async () => {
              const res = await ApiClient.joinChannel({
                channelId: joinChannelId,
              });
              const msg: Protocol.WSMessage = {
                senderId: me.id,
                channelId: joinChannelId,
                type: "join",
                data: JSON.stringify(me),
              };
              ws.send(JSON.stringify(msg));
              console.log("join channel response", res);
              if (errorOf(res)) {
                alert(errorOf(res)?.message);
                return;
              }
              const { channel } = res as Protocol.JoinChannelResponse;
              console.log("joined channel", channel);
              console.log("prev channels", channels);
              setChannels([...channels, channel]);
              onChannelSelect(channel);
              setShowChannelJoinDialog(false);
            }}
          >
            Join
          </button>
        </div>
      ) : null}
      <ul>
        {channels.map((channel) => (
          <li
            key={channel.id}
            style={{
              borderColor: currentChannel === channel ? "blue" : "black",
              borderWidth: 1,
            }}
            onClick={() => onChannelSelect(channel)}
          >
            <h3>{channel.name}</h3>
            <h6>{channel.id}</h6>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  channelList: {
    backgroundColor: "lightgreen",
    borderColor: "green",
    borderWidth: 1,
  },
};

export default ChannelList;