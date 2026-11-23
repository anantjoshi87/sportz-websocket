import { WebSocket, WebSocketServer } from "ws";

let wss;

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server) {
  wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    console.log("WebSocket client connected; clients:", wss.clients.size);
    sendJson(socket, { message: "Welcome to the WebSocket server!" });
    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    if (!wss) return;
    for (const socket of wss.clients) {
      if (socket.isAlive === false) {
        console.log("Terminating dead WebSocket client");
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, 30000);

  wss.on("close", () => clearInterval(interval));
}

export function broadcastMatchCreated(match) {
  if (!wss) {
    console.error("WebSocket server is not initialized");
    return;
  }
  console.log("Broadcasting matchCreated; clients:", wss.clients.size);
  broadcast(wss, { event: "matchCreated", data: match });
}
