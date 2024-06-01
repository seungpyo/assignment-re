import { Channel, errorOf, Protocol, User } from "@seungpyo.hong/netpro-hw";
import { useEffect, useState } from "react";
import { ApiClient } from "./apiClient";

interface ChatScreenProps {
  me: User;
  onLogout: () => void;
}

const ChatScreen = ({ me, onLogout }: ChatScreenProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showChannelNameInput, setShowChannelNameInput] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  useEffect(() => {
    console.log("Getting channels");
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
      <div>
        <h2>Channels</h2>
        <button onClick={() => setShowChannelNameInput(true)}>
          Create Channel
        </button>
        {showChannelNameInput ? (
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
                setShowChannelNameInput(false);
              }}
            >
              Create
            </button>
          </div>
        ) : null}
        <ul>
          {channels.map((channel) => (
            <li key={channel.id}>{channel.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChatScreen;
