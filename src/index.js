import express from "express";
import http from "http";
import commentaryRouter from "./routes/commentary.route.js";
import matchesRouter from "./routes/matches.route.js";
import { attachWebSocketServer } from "./ws/server.js";

const PORT = process.env.PORT || 8000;
const HOST = "0.0.0.0";

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

app.use("/matches", matchesRouter);
app.use("/matches/:id/commentary", commentaryRouter);

attachWebSocketServer(server);

server.listen(PORT, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log("Server is running on %s", baseUrl);
  console.log(
    "WebSocket Server is running on %s/ws",
    baseUrl.replace("http", "ws"),
  );
});
