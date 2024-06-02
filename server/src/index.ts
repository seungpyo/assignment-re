import express from "express";
import { createServer } from "http";
import WebSocket, { Server } from "ws";
import path from "path";
import { readDB, writeDB } from "./utils";
import {
  uuid,
  DB,
  Protocol,
  AuthToken,
  Channel,
  Message,
  User,
} from "@seungpyo.hong/netpro-hw";
import { couldStartTrivia } from "typescript";

interface WSInfo {
  ws: WebSocket;
  wsTokenId: string;
  channelId: string | null;
}

const app = express();
const server = createServer(app);
const wss = new Server({ server });
const wsInfos: WSInfo[] = [];

app.use(express.static(path.resolve(__dirname, "../../client/build")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.locals.db = (readDB() ?? {
    users: [],
    channels: [],
    messages: [],
    tokens: [],
  }) as DB;
  next();
});
app.use((req, res, next) => {
  if (req.path === "/login" || req.path === "/signup") {
    return next();
  }
  const authorization = req.headers.authorization;
  const token = authorization?.replace("Bearer ", "");
  const db: DB = res.locals.db;
  const match = db.tokens.find((t) => t.id === token);
  if (!match) {
    const e: Protocol.ErrorResponse = {
      statusCode: 401,
      message: "Unauthorized",
    };
    return res.status(401).json(e);
  }
  if (new Date(match.expiresAt) < new Date()) {
    const e: Protocol.ErrorResponse = {
      statusCode: 401,
      message: "Token expired",
    };
    return res.status(401).json(e);
  }
  res.locals.userId = match.userId;
  next();
});

wss.on("connection", (ws, req) => {
  const urlSearchParams = new URLSearchParams(req.url?.split("?")[1]);
  const wsTokenId = urlSearchParams.get("wsTokenId");
  if (!wsTokenId) {
    console.error("No wsToken in query params");
    ws.close(4001, "No wsToken in query params");
    return;
  }
  const db: DB = readDB() ?? {
    users: [],
    channels: [],
    messages: [],
    tokens: [],
  };
  const wsToken = db.tokens.find((t) => t.id === wsTokenId);
  if (!wsToken) {
    console.error("No matching wsToken found");
    ws.close(4002, "No matching wsToken found");
    return;
  }
  if (new Date(wsToken.expiresAt) < new Date()) {
    console.error("wsToken expired");
    ws.close(4002, "Expired");
    return;
  }
  wsInfos.push({
    ws,
    wsTokenId,
    channelId: null,
  });

  ws.on("message", (data) => {
    const wsMessage: Protocol.WSMessage = JSON.parse(data.toString());
    if (wsMessage.type === "join") {
      const wsInfo = wsInfos.find((w) => w.ws === ws);
      if (!wsInfo) {
        console.error("No wsInfo found for ws");
        return;
      }
      wsInfo.channelId = wsMessage.channelId;
    } else if (wsMessage.type === "leave") {
      const wsInfo = wsInfos.find((w) => w.ws === ws);
      if (!wsInfo) {
        console.error("No wsInfo found for ws");
        return;
      }
      wsInfo.channelId = null;
    }
    const others = wsInfos.filter((w) => w.ws !== ws && w.ws.readyState === 1);
    others.forEach((dst) => {
      dst.ws.send(JSON.stringify(wsMessage));
    });
  });
});

app.post("/login", (req, res) => {
  const { name, password } = req.body as Protocol.LoginRequest;
  const db: DB = res.locals.db;
  const match = db.users.find(
    (user) => user.name === name && user.password === password
  );
  if (!match) {
    const e: Protocol.ErrorResponse = {
      statusCode: 401,
      message: "Invalid credentials",
    };
    return res.status(401).json(e);
  }
  const token: AuthToken = {
    id: uuid(),
    userId: match.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  };
  db.tokens.push(token);
  writeDB(db);
  const r: Protocol.LoginResponse = {
    user: {
      id: match.id,
      name: match.name,
      email: match.email,
    },
    token: token.id,
  };
  res.json(r);
});

app.post("/logout", (req, res) => {
  const db: DB = res.locals.db;
  const index = db.tokens.findIndex((t) => t.userId === res.locals.userId);
  if (index === -1) {
    const e: Protocol.ErrorResponse = {
      statusCode: 401,
      message: "Invalid token",
    };
    return res.status(401).json(e);
  }
  db.tokens.splice(index, 1);
  res.json();
});

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body as Protocol.SignUpRequest;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const db: DB = res.locals.db;
  const match = db.users.find((user) => user.email === email);
  if (match) {
    const e: Protocol.ErrorResponse = {
      statusCode: 409,
      message: "Email already in use",
    };
    return res.status(409).json(e);
  }
  const user = { id: uuid(), name, email, password };
  db.users.push(user);
  writeDB(db);
  const r: Protocol.SignUpResponse = { success: true };
  res.json(r);
});

app.get("/channels", (req, res) => {
  const db: DB = res.locals.db;
  const r: Protocol.GetChannelsResponse = { channels: db.channels };
  res.json(r);
});

app.post("/channels", (req, res) => {
  const { name, creator } = req.body as Protocol.CreateChannelRequest;
  if (!name) {
    const e: Protocol.ErrorResponse = {
      statusCode: 400,
      message: "Missing required field: name",
    };
    return res.status(400).json(e);
  }
  if (!creator) {
    const e: Protocol.ErrorResponse = {
      statusCode: 400,
      message: "Missing required field: creator",
    };
    return res.status(400).json(e);
  }

  const db: DB = res.locals.db;
  const newChannel: Channel = {
    id: uuid(),
    name,
    participants: [creator],
    messages: [],
  };
  db.channels.push(newChannel);
  writeDB(db);
  const r: Protocol.CreateChannelResponse = { newChannel };
  res.json(r);
});

app.put("/channels/:channelId", (req, res) => {
  const { channelId } = req.params;
  const { userId } = res.locals;
  const db: DB = res.locals.db;
  const channel = db.channels.find((c) => c.id === channelId);
  if (!channel) {
    const e: Protocol.ErrorResponse = {
      statusCode: 404,
      message: "Channel not found",
    };
    return res.status(404).json(e);
  }
  if (!channel.participants.some((p) => p.id === userId)) {
    const e: Protocol.ErrorResponse = {
      statusCode: 403,
      message: "Forbidden",
    };
    return res.status(403).json(e);
  }
  const delta: Partial<Channel> = req.body;
  Object.assign(channel, delta);
  writeDB(db);
  res.json({});
});

app.get("/participants", (req, res) => {
  const { channelId } = req.query;
  if (!channelId) {
    const e: Protocol.ErrorResponse = {
      statusCode: 400,
      message: "Missing required field: channelId",
    };
    return res.status(400).json(e);
  }
  const db: DB = res.locals.db;
  const channel = db.channels.find((c) => c.id === channelId);
  if (!channel) {
    const e: Protocol.ErrorResponse = {
      statusCode: 404,
      message: "Channel not found",
    };
    return res.status(404).json(e);
  }
  if (!channel.participants.some((p) => p.id === res.locals.userId)) {
    const e: Protocol.ErrorResponse = {
      statusCode: 403,
      message: "Forbidden",
    };
    return res.status(403).json(e);
  }
  const r: Protocol.GetParticipantsResponse = {
    participants: channel.participants,
  };
  res.json(r);
});

app.post("/channels/:channelId/join", (req, res) => {
  const { channelId } = req.params;
  const { userId } = res.locals;
  const db: DB = res.locals.db;
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    const e: Protocol.ErrorResponse = {
      statusCode: 404,
      message: "User not found",
    };
    return res.status(404).json(e);
  }
  const channel = db.channels.find((c) => c.id === channelId);
  if (!channel) {
    const e: Protocol.ErrorResponse = {
      statusCode: 404,
      message: "Channel not found",
    };
    return res.status(404).json(e);
  }
  if (channel.participants.some((p) => p.id === res.locals.userId)) {
    const e: Protocol.ErrorResponse = {
      statusCode: 409,
      message: "Already in channel",
    };
    return res.status(409).json(e);
  }
  channel.participants.push(user);
  writeDB(db);
  res.json({ channel });
});

app.get("/channels/:channelId/messages", (req, res) => {
  const { channelId } = req.params;
  const db: DB = res.locals.db;
  const channel = db.channels.find((c) => c.id === channelId);
  if (!channel) {
    const e: Protocol.ErrorResponse = {
      statusCode: 404,
      message: "Channel not found",
    };
    return res.status(404).json(e);
  }
  if (!channel.participants.some((p) => p.id === res.locals.userId)) {
    const e: Protocol.ErrorResponse = {
      statusCode: 403,
      message: "Forbidden",
    };
    return res.status(403).json(e);
  }
  const r: Protocol.GetMessagesResponse = { messages: channel.messages };
  res.json(r);
});

app.post("/channels/:channelId/messages", (req, res) => {
  const { channelId } = req.params;
  const { content } = req.body as Protocol.SendMessageRequest;
  const db: DB = res.locals.db;
  const channel = db.channels.find((c) => c.id === channelId);
  if (!channel) {
    const e: Protocol.ErrorResponse = {
      statusCode: 404,
      message: "Channel not found",
    };
    return res.status(404).json(e);
  }
  if (!channel.participants.some((p) => p.id === res.locals.userId)) {
    const e: Protocol.ErrorResponse = {
      statusCode: 403,
      message: "Forbidden",
    };
    return res.status(403).json(e);
  }
  const sender = db.users.find((u) => u.id === res.locals.userId);
  if (!sender) {
    const e: Protocol.ErrorResponse = {
      statusCode: 404,
      message: "User not found",
    };
    return res.status(404).json(e);
  }
  const message: Message = {
    id: uuid(),
    sender,
    content,
    createdAt: new Date().toISOString(),
  };
  channel.messages.push(message);
  writeDB(db);
  const r: Protocol.SendMessageResponse = { message };
  res.json(r);
  const webSocketsToSendTo =
    wsInfos.filter((w) => w.channelId === channelId).map((w) => w.ws) ?? [];
  webSocketsToSendTo.forEach((ws) => {
    ws.send(
      JSON.stringify({
        senderId: sender.id,
        channelId,
        type: "text",
        data: JSON.stringify(message),
      })
    );
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../../client/build", "index.html"));
});

app.get("*", (req, res) => {
  const e: Protocol.ErrorResponse = {
    statusCode: 404,
    message: `Not found: ${req.path}`,
  };
  res.status(404).send(e);
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}, URL: http://localhost:${PORT}`)
);
