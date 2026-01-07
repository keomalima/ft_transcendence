import type { FastifyRequest } from 'fastify'
import { checkServerIdentity } from 'tls';
import { WebSocket } from 'ws';

// =====================
// Websocket Handlers for Waitning Room
// =====================

const gameRooms = new Map<string, Set<WebSocket>>();

async function waitingRoomHandler(socket: WebSocket, request: FastifyRequest<{Params: {gameId: string, userId: string}}>) {
	const gameId = request.params.gameId;
	const userId = request.params.userId;
	const identifiedSocket = socket as WebSocket & { userId?: string};

	identifiedSocket.userId = userId;

	if (!gameRooms.has(gameId)) {
		gameRooms.set(gameId, new Set());
	}
	gameRooms.get(gameId)!.add(identifiedSocket);

	const pingInterval = setInterval(() => {
		if (socket.readyState === WebSocket.OPEN) {
			console.log('Ping sent');
			socket.ping();
		}
	}, 30000);

	socket.on('close', () => {
		clearInterval(pingInterval);
		gameRooms.get(gameId)?.delete(identifiedSocket);
		console.log(`Player disconnected from game room: ${gameId}`);
	})
}

function broadcasToRoom(gameId: string, message: any) {
	const sockets = gameRooms.get(gameId);
	console.log('----trying to broadcast message for gameId room----', gameId);
	if (sockets) {
		sockets.forEach(socket => {
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify(message));
			}
		})
	}
}

function notifyPlayerRemoved(gameId: string, playerId: string) {

	const sockets = gameRooms.get(gameId);
	
	if (!sockets) {
		console.log(`❌ No sockets found for game room: ${gameId}`);
		return;
	}
	
	sockets.forEach(sock => {
		const socketUserId = (sock as any).userId;
		
		if (socketUserId === playerId) {
			console.log(`✅ MATCH! Notifying user ${playerId}`);
			if (sock.readyState === WebSocket.OPEN) {
				sock.send(JSON.stringify({
					type: 'player_remove',
					message: "You've been removed from the game"
				}));
			} else {
				console.log(`❌ Socket is NOT open. ReadyState: ${sock.readyState}`);
			}
		}
	});
}

function notifyGameClosed(gameId: string, userId: string) {

	const sockets = gameRooms.get(gameId);
	
	if (!sockets) {
		console.log(`❌ No sockets found for game room: ${gameId}`);
		return;
	}
	
	sockets.forEach(sock => {
		const socketUserId = (sock as any).userId;
		
		if (socketUserId != userId) {
			console.log(`✅ MATCH! Notifying user ${socketUserId} that game is closed`);
			if (sock.readyState === WebSocket.OPEN) {
				sock.send(JSON.stringify({
					type: 'game_closed',
					message: "The game has been deleted"
				}));
			} else {
				console.log(`❌ Socket is NOT open. ReadyState: ${sock.readyState}`);
			}
		}
	});
}

export const WaintingRoomWsController = {
	broadcasToRoom,
	waitingRoomHandler,
	notifyPlayerRemoved,
	notifyGameClosed
};