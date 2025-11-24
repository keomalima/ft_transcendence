import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';

const gameRooms = new Map<string, Set<WebSocket>>();

async function waitingRoomHandler(socket: WebSocket, request: FastifyRequest<{Params: {gameId: string}}>) {
	const gameId = request.params.gameId;

	if (!gameRooms.has(gameId)) {
		gameRooms.set(gameId, new Set());
	}
	gameRooms.get(gameId)!.add(socket);

	const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.ping();
        }
    }, 30000);

	socket.on('message', (message: Buffer) => {
		const data = JSON.parse(message.toString());

		if (data.type === 'player_joined') {
			broadcasToRoom(gameId, {
				type: 'room_update',
				players: data.players,
				message: 'New player joined'
			})
		}
	})

	socket.on('close', () => {
		clearInterval(pingInterval);
		gameRooms.get(gameId)?.delete(socket);
		console.log(`Player disconnected from game room: ${gameId}`);
	})
}

export function broadcasToRoom(gameId: string, message: any) {
	const sockets = gameRooms.get(gameId);
	if (sockets) {
		sockets.forEach(socket => {
			socket.send(JSON.stringify(message));
		})
	}
}

export const webSocketGameController = {
	waitingRoomHandler
};