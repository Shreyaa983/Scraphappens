import { io } from "socket.io-client";
import { API_BASE_URL } from "../../api";

const SOCKET_URL = API_BASE_URL; // Use the same base URL as standard API

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = (token) => {
  if (!socket.connected) {
    if (token) {
      socket.auth = { token };
    } else {
      socket.auth = {};
    }
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
