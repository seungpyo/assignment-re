const WebSocket = require('ws');
const express = require('express');
const { createServer } = require('http');
const app = express();
app.get("/", (req, res) => {
  res.send("Hello World");
});
const port = 5000;
// const wss = new WebSocket.Server({ port: 5000 });
// const wss = new WebSocket.Server({ port:port+1 });
const server = createServer(app);
const wss = new WebSocket.Server({ server});

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    ws.send('Hello from the server!');
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server is listening on port 5000');
app.listen(port, () => console.log(`Server is listening on port ${port}`));
