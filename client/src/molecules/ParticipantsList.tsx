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
      <h2 style={{ color: "white" }}>Participants</h2>
      {participants.map((participant) => (
        <h4 key={participant.id}>{participant.name}</h4>
      ))}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  channelUserList: {
    backgroundColor: "#484848",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 320,
    height: "100%",
  },
};

export default ParticipantsList;
