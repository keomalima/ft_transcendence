import { WebSocket } from 'ws';
import type { GameSession } from "./game.types.js";
import { cleanupGameSession } from "./game.ws.controller.js";

function broadcastGameState(gameSession: GameSession): void {
	const paddleA = gameSession.gameState.paddleA;
	const paddleB = gameSession.gameState.paddleB;

	const left = {
		userid: paddleA.userId,
		paddleposition: paddleA.y,
		score: gameSession.gameState.score.playerA,
	}

	const right = {
		userid: paddleB.userId,
		paddleposition: paddleB.y,
		score: gameSession.gameState.score.playerB,
	}

	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'update_game',
				left: left,
				right: right,
				ballX: gameSession.gameState.ball.x,
				ballY: gameSession.gameState.ball.y
			}));
		} else {
			// console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

function notifyPlayerAlreadyInGame(socket: WebSocket, gameId: string): void {
	// console.log('🙊 This player is already in game!');

	if (socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify({
			type: 'already-in-game',
			message: "You are already in game",
			gameId,
		}));
	} else {
		// console.log(`❌ Socket is NOT open. ReadyState: ${socket.readyState}`);
	}

}

function notifyGameStarted(gameSession: GameSession, gameId: string): void {
	// console.log('🚀 All players are connected, game starts!');
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'start-game',
				message: "Your game is about to start",
				gameId,
				position: player.position
			}));
		} else {
			// console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

function notifyService(gameSession: GameSession): void {
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'service',
				message: "Service countdown"
			}));
		} else {
			// console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

function notifyPlayerDisconnected(gameSession: GameSession, disconnectedUserId: string, timeoutSeconds: number = 30): void {
	// console.log(`📢 Notifying remaining players that ${disconnectedUserId} disconnected`);
	gameSession.players.forEach((player) => {
		if (player.userId !== disconnectedUserId && player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'player-disconnected',
				disconnectedUserId,
				timeoutSeconds
			}));
		}
	});
}

function notifyPlayerReconnected(gameSession: GameSession, reconnectedUserId: string): void {
	// console.log(`📢 Notifying players that ${reconnectedUserId} reconnected`);
	gameSession.players.forEach((player) => {
		if (player.userId !== reconnectedUserId && player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'player-reconnected',
				reconnectedUserId
			}));
		}
	});
}

function notifyPause(gameSession: GameSession, pausingUserId: string, status: boolean): void {
	gameSession.players.forEach((player) => {
		if (player.userId !== pausingUserId) {
			// console.log(`📢 Sending pause notification to player ${player.userId}`);
			if (player.socket.readyState === WebSocket.OPEN) {
				player.socket.send(JSON.stringify({
					type: 'pause',
					status,

				}));
			} else {
				// console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
			}
		} else {
			// console.log(`⏭️ Skipping pause notification for player ${player.userId} (they initiated the pause)`);
		}
	})
}

function notifyWonGame(gameSession: GameSession): void {
	// console.log('🚀 Game has a winner!');
	
	// Prepare both players' info (without socket)
	const playersInfo = Array.from(gameSession.players.values()).map(player => ({
		userId: player.userId,
		isCreator: player.isCreator,
		position: player.position,
		score: player.score
	}));

	let winnerId: string | null = null;
	gameSession.players.forEach((player) => {
		if (player.score >= gameSession.gameConfig.scoreToWin) {
			winnerId = player.userId;
			return;
		}
	})
	
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'won-game',
				iswinner: player.score >= gameSession.gameConfig.scoreToWin,
				winnerId,
				currentPlayer: {
					userId: player.userId,
					isCreator: player.isCreator,
					position: player.position,
					score: player.score
				},
				players: playersInfo
			}));
		} else {
			// console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	});
	
	setTimeout(() => {
		cleanupGameSession(gameSession.gameId, gameSession);
	}, 2000);
}

function notifyAbandonnedGame(gameSession: GameSession, looserId: string): void {
	
	if (gameSession.abandonedNotified) {
		// console.log('⏭️ Game already abandoned, skipping notification');
		return;
	}
	
	gameSession.abandonedNotified = true;
	// console.log('👎 Someone gave up the game!');
	
	const playersInfo = Array.from(gameSession.players.values()).map(player => ({
		userId: player.userId,
		isCreator: player.isCreator,
		position: player.position,
		score: player.score
	}));

	let winnerId: string | null = null;
	gameSession.players.forEach((player) => {
		if (player.userId !== looserId) {
			winnerId = player.userId;
			return;
		}
	})

	if (!winnerId) {
		// console.log(`🚨 winnerId undefined`);
		return;
	}
	
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'abandoned-game',
				iswinner: looserId !== player.userId,
				winnerId,
				currentPlayer: {
					userId: player.userId,
					isCreator: player.isCreator,
					position: player.position,
					score: player.score
				},
				players: playersInfo
			}));
		} else {
			// console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	});
	setTimeout(() => {
		cleanupGameSession(gameSession.gameId, gameSession);
	}, 2000);
}

export const gameWsNotification = {
	broadcastGameState,
	notifyPlayerAlreadyInGame,
	notifyGameStarted,
	notifyService,
	notifyPlayerDisconnected,
	notifyPlayerReconnected,
	notifyPause,
	notifyWonGame,
	notifyAbandonnedGame
}