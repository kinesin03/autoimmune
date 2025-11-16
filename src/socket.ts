import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3055 });

console.log('✅ WebSocket server running on port 3055');

wss.on('connection', (ws) => {
  console.log('🎉 -> connected');
});
