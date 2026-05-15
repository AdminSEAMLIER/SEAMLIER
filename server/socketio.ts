import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("join_conversation", (conversationId: string) => {
      if (typeof conversationId === "string") {
        socket.join(conversationId);
      }
    });
    socket.on("leave_conversation", (conversationId: string) => {
      if (typeof conversationId === "string") {
        socket.leave(conversationId);
      }
    });
    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
