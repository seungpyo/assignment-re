export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Channel {
  id: string;
  name: string;
  participants: User[];
  messages: Message[];
}

export interface Message {
  sender: User;
  content: string;
  createdAt: string;
}

export interface AuthToken {
  id: string;
  expiresAt: string;
}

export interface DB {
  users: User[];
  channels: Channel[];
  messages: Message[];
  tokens: AuthToken[];
}

export namespace Protocol {
  export interface LoginRequest {
    id: string;
    password: string;
  }

  export interface LoginResponse {
    token: string;
  }

  export interface LogoutRequest {
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

  export interface GetChannelsRequest {
    token: string;
  }

  export interface GetChannelsResponse {
    channels: Channel[];
  }

  export interface GetMessagesRequest {
    token: string;
    channelId: string;
  }

  export interface GetMessagesResponse {
    messages: Message[];
  }

  export interface SendMessageRequest {
    token: string;
    channelId: string;
    content: string;
  }

  export interface SendMessageResponse {
    success: boolean;
  }

  export interface ErrorResponse {
    statusCode: number;
    message: string;
  }
}
