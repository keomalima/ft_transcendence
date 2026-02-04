import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';

// =====================
// Websocket Handler for Dashboard
// =====================

const dashboardConnections = new Map<string, WebSocket>();

// Connection handler
async function dashboardHandler(socket: WebSocket, request: FastifyRequest<{Params: {userId: string}}>) {
	const userId = request.params.userId;

	dashboardConnections.set(userId, socket);

	const pingInterval = setInterval(() => {
	if (socket.readyState === WebSocket.OPEN) {
		socket.ping();
	}
	}, 30000);

	socket.on('close', () => {
	clearInterval(pingInterval);
	dashboardConnections.delete(userId);
	});
}

// Broadcast to specific user
function notifyUser(user: {requesterId: string, userId: string, avatarUrl: string , displayName: string, isOnline: boolean}, message: any) {
	const socket = dashboardConnections.get(user.requesterId);
	if (socket?.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify({
			type: message,
			data: user
		}));
	}
}

export const DashboardWsController = {
	dashboardHandler,
	notifyUser,
};