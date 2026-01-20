import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';
import type { gameService } from '../../game/game.service.js';

// =====================
// Websocket Handlers for Tournament
// =====================

type GameWithUsers = Awaited<ReturnType<typeof gameService.findGameById>>;
type IdentifiedSocket = WebSocket & { userId: string };
const tournamentBracket = new Map<string, Set<IdentifiedSocket>>();

async function tournamentBracketHandler(socket: WebSocket, request: FastifyRequest<{Params: {tournamentId: string, userId: string}}>) {
	const tournamentId = request.params.tournamentId;
	const userId = request.params.userId;
	const identifiedSocket = socket as IdentifiedSocket;
    identifiedSocket.userId = userId;

	identifiedSocket.userId = userId;

	if (!tournamentBracket.has(tournamentId)) {
		tournamentBracket.set(tournamentId, new Set());
	}
	tournamentBracket.get(tournamentId)!.add(identifiedSocket);

	const pingInterval = setInterval(() => {
		if (socket.readyState === WebSocket.OPEN) {
			socket.ping();
		}
	}, 30000);

	socket.on('close', () => {
		clearInterval(pingInterval);
		tournamentBracket.get(tournamentId)?.delete(identifiedSocket);
		console.log(`Player disconnected from tournament room: ${tournamentId}`);
	})
}

function notifyGameReadiness(tournamentId: string, playersId:{user: string, opponent: string}, type: string, data: GameWithUsers) {
	const sockets = tournamentBracket.get(tournamentId);
	if (!sockets) return;

	console.log('User id', playersId.user, 'Opponent Id', playersId.opponent);
	const targetUserIds = [playersId.user, playersId.opponent];
    
    sockets.forEach(socket => {
        if (targetUserIds.includes(socket.userId) && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type,
                data
            }));
        }
    });
}

function notifyTournamentFinished(tournamentId: string, userId: string) {

	const sockets = tournamentBracket.get(tournamentId);
	
	if (!sockets) {
		console.log(`❌ No sockets found for game room: ${tournamentId}`);
		return;
	}
	
	sockets.forEach(sock => {
		const socketUserId = (sock as any).userId;
		
		if (socketUserId != userId) {
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

function broadcasToRoom(tournamentId: string, message: any) {
	const sockets = tournamentBracket.get(tournamentId);
	if (sockets) {
		sockets.forEach(socket => {
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify(message));
			}
		})
	}
}

export const TournamentWsController = {
	broadcasToRoom,
	tournamentBracketHandler,
	notifyGameReadiness
};