import { User, errorOf, Protocol, Channel } from "@seungpyo.hong/netpro-hw";
import { useState, useEffect } from "react";
import { ApiClient } from "src/apiClient";

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

const styles: { [key: string]: React.CSSProperties } = {
  channelUserList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

export default ParticipantsList;
