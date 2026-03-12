import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./server.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.set("io", io);

// socket check
io.on("connection", (socket) => {
  socket.on("join:user", ({ userId }) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
  });
  console.log("✅ socket connected:", socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ API+Socket running on ${PORT}`));
