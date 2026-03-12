import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join:group", ({ groupId }) => {
      if (!groupId) return;
      socket.join(`group:${groupId}`);
    });

    socket.on("join:booking", ({ bookingId }) => {
      if (!bookingId) return;
      socket.join(`booking:${bookingId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}
