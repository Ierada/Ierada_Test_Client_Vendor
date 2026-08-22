import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getUserToken } from "../utils/userIdentifier";

const apiBase = import.meta.env.VITE_API_URL || "";
const socketUrl = apiBase.replace(/\/api\/?$/, "");

export function useSupportSocket(ticketId, onMessage) {
  const callback = useRef(onMessage);
  callback.current = onMessage;

  useEffect(() => {
    if (!ticketId || !socketUrl) return;
    const token = getUserToken("vendor");
    if (!token) return;
    const socket = io(`${socketUrl}/support`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socket.on("connect", () => {
      socket.emit("support:join", { ticket_id: ticketId });
    });
    socket.on("support:new_message", () => callback.current());
    socket.on("support:ticket_updated", () => callback.current());
    return () => {
      socket.disconnect();
    };
  }, [ticketId]);
}
