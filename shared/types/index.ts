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

export interface Token {
  id: string;
  expiresAt: string;
}

export interface DB {
  users: User[];
  channels: Channel[];
  messages: Message[];
  tokens: Token[];
}
