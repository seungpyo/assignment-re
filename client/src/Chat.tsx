import { Channel, errorOf, Protocol, User } from "@seungpyo.hong/netpro-hw";
import { useEffect, useState } from "react";
import { ApiClient } from "./apiClient";

interface ChatScreenProps {
  me: User;
  onLogout: () => void;
}

const ChatScreen = ({ me, onLogout }: ChatScreenProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
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
    <div>
      <h1>Chat</h1>
      <div style={styles.chatScreenBody}>
        <ChannelList
          me={me}
          channels={channels}
          onChannelCreate={(newChannel) =>
            setChannels([...channels, newChannel])
          }
          currentChannel={currentChannel}
          onChannelSelect={(channel) => setCurrentChannel(channel)}
        />
        <ParticipantsList channel={currentChannel} />
      </div>
    </div>
  );
};

interface ChannelUserListProps {
  channel: Channel | null;
}

const ParticipantsList = ({ channel }: ChannelUserListProps) => {
  const [participants, setParticipants] = useState<User[]>(
    channel?.participants ?? []
  );
  useEffect(() => {
    if (!channel) {
      return;
    }
    ApiClient.getParticipants({ channelId: channel.id }).then((response) => {
      if (errorOf(response)) {
        alert(errorOf(response)?.message);
        return;
      }
      setParticipants(
        (response as Protocol.GetParticipantsResponse).participants
      );
    });
  }, [channel]);
  return (
    <div style={styles.channelUserList}>
      <h2>Participants</h2>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>{participant.name}</li>
        ))}
      </ul>
    </div>
  );
};

interface ChannelListProps {
  me: User;
  channels: Channel[];
  onChannelCreate: (channel: Channel) => void;
  currentChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
}

const ChannelList = ({
  me,
  channels,
  onChannelCreate,
  currentChannel,
  onChannelSelect,
}: ChannelListProps) => {
  const [showChannelCreateDialog, setShowChannelCreateDialog] = useState(false);
  const [showChannelJoinDialog, setShowChannelJoinDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [joinChannelId, setJoinChannelId] = useState("");
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
              onChannelCreate(newChannel);
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
              if (errorOf(res)) {
                alert(errorOf(res)?.message);
                return;
              }
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
  chatScreenBody: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  channelList: {
    backgroundColor: "lightgreen",
    borderColor: "green",
    borderWidth: 1,
  },
};

export default ChatScreen;
