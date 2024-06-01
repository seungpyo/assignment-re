import express from "express";
import { createServer } from "http";
import { Server } from "ws";
import path from "path";

const app = express();
const server = createServer(app);
const wss = new Server({ server });

app.use(express.static(path.resolve(__dirname, "../../client/build")));

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("message", (message) => {
    console.log("received: %s", message);
    ws.send(`You said: ${message}`);
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../../client/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
