import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

export const socket = io(URL, {
    autoConnect: false
});

export const connectSocket = (token) => {
    if (token) {
        socket.auth = { token };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    socket.disconnect();
};
