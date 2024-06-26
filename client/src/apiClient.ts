import { Channel, Protocol } from "@seungpyo.hong/netpro-hw/dist/types";
import { apiUrl } from "./constants";
let token: string | null = null;
export namespace ApiClient {
  export const setToken = (newToken: string) => {
    token = newToken;
  };
  export const getToken = () => token;
  export const login = async ({
    name,
    password,
  }: Protocol.LoginRequest): Promise<
    Protocol.LoginResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, password }),
    });
    return response.json();
  };
  export const logout = async (): Promise<
    Protocol.LogoutResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    return response.json();
  };
  export const signUp = async ({
    name,
    email,
    password,
  }: Protocol.SignUpRequest): Promise<
    Protocol.SignUpResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  };

  export const getChannels = async (): Promise<
    Protocol.GetChannelsResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/channels`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  };

  export const createChannel = async ({
    name,
    creator,
  }: Protocol.CreateChannelRequest): Promise<
    Protocol.CreateChannelResponse | Protocol.ErrorResponse
  > => {
    const response = await fetch(`${apiUrl}/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, creator }),
    });
    return response.json();
  };

  export const updateChannel = async (
    channelId: string,
    delta: Partial<Channel>
  ): Promise<{} | Protocol.ErrorResponse> => {
    const response = await fetch(`${apiUrl}/channels/${channelId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(delta),
    });
    return response.json();
  };

  export const joinChannel = async ({ channelId }: { channelId: string }) => {
    const response = await fetch(`${apiUrl}/channels/${channelId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  };

  export const getParticipants = async ({
    channelId,
  }: Protocol.GetParticipantsRequest) => {
    const response = await fetch(
      `${apiUrl}/participants?channelId=${channelId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.json();
  };

  export const getMessages = async ({
    channelId,
  }: Protocol.GetMessagesRequest) => {
    const response = await fetch(`${apiUrl}/channels/${channelId}/messages`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json() as Promise<Protocol.GetMessagesResponse>;
  };

  export const sendMessage = async ({
    channelId,
    content,
  }: Protocol.SendMessageRequest) => {
    const response = await fetch(`${apiUrl}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channelId, content }),
    });
    return response.json() as Promise<Protocol.SendMessageResponse>;
  };
}
