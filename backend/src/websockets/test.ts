import type { FastifyRequest } from 'fastify'
import type { WebSocket } from 'ws';

async function testHandler(socket: WebSocket, request: FastifyRequest) {
	console.log('Client connected');
    
    socket.on('message', (message: Buffer) => {
        try {
            const messageStr = message.toString();
            console.log('Received message:', messageStr);
            
            socket.send(`Server received: ${messageStr}`);
        } catch (error) {
            console.error('Error processing message:', error);
            socket.send('Error processing your message');
        }
    });
    
    socket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    
    socket.on('close', () => {
        console.log('Client disconnected');
    });
}

export const webSocketController = {
	testHandler
};