// No token in Request interfaces, as it is passed in headers

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserPassword extends User {
  password: string;
}

export interface Channel {
  id: string;
  name: string;
  participants: User[];
  messages: Message[];
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  createdAt: string;
}

export interface AuthToken {
  id: string;
  userId: string;
  expiresAt: string;
}

export interface DB {
  users: UserPassword[];
  channels: Channel[];
  messages: Message[];
  tokens: AuthToken[];
}

export namespace Protocol {
  export interface LoginRequest {
    name: string;
    password: string;
  }

  export interface LoginResponse {
    user: User;
    token: string;
  }

  export interface LogoutResponse {
    success: boolean;
  }

  export interface SignUpRequest {
    name: string;
    email: string;
    password: string;
  }

  export interface SignUpResponse {
    success: boolean;
  }

  export interface GetChannelsResponse {
    channels: Channel[];
  }

  export interface GetMessagesRequest {
    channelId: string;
  }

  export interface GetMessagesResponse {
    messages: Message[];
  }

  export interface SendMessageRequest {
    channelId: string;
    content: string;
  }

  export interface SendMessageResponse {
    message: Message;
  }

  export interface ErrorResponse {
    statusCode: number;
    message: string;
  }

  export interface CreateChannelRequest {
    name: string;
    creator: User;
  }

  export interface CreateChannelResponse {
    newChannel: Channel;
  }
  export interface JoinChannelResponse {
    channel: Channel;
  }

  export interface GetParticipantsRequest {
    channelId: string;
  }

  export interface GetParticipantsResponse {
    participants: User[];
  }

  export type WSMessageType =
    | "join"
    | "leave"
    | "text"
    | "voice"
    | "video"
    | "video-offer"
    | "video-answer"
    | "new-ice-candidate";
  export interface WSMessage {
    senderId: string;
    channelId: string;
    type: WSMessageType;
    data: string;
  }
  export interface WSMessageWithTarget extends Protocol.WSMessage {
    target?: string;
  }
}
