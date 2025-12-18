import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';
import type { GameSession, PlayerConnection } from './game.types.js';
import { gameAlgo } from './game.algo.js';
import { ballAlgo } from './game.algo.ball.js';
import { sleep } from './game.algo.utils.js';
import { gameService } from '../../game/game.service.js';
import { gameWsNotification } from './game.ws.notification.js';

// =====================
// Websocket Handlers for Game
// =====================

const gameSessions = new Map<string, GameSession>();

async function gameHandler(socket: WebSocket, request: FastifyRequest<{Params: {gameId: string, userId: string, scoreToWin: string}}>) {
	const gameId = request.params.gameId;
	const userId = request.params.userId;
	const scoreToWin = request.params.scoreToWin;

	console.log(`➡️ User ${userId} connected to game ${gameId}`);

	let gameSession = gameSessions.get(gameId);

	if (!gameSession) {
		gameSession = createGameSession(gameId, userId, parseInt(scoreToWin), socket);
		gameSessions.set(gameId, gameSession);
	}

	checkForReconnection(gameSession, userId, socket);

	socket.on('message', (data: Buffer) => {
		const message = JSON.parse(data.toString());
		if (message.type === 'input') {
			const player = gameSession.players.get(userId);
			if (!player) {
				console.log(`⚠️ Player ${userId} not found in game session`);
				return;
			}
			if (message.action === 'up') {
				player.input.up = true;
				player.input.down = false;
			} else if (message.action === 'down') {
				player.input.up = false;
				player.input.down = true;
			} else if (message.action === 'stop') {
				player.input.up = false;
				player.input.down = false;
			}
		} if (message.type === 'position') {
			// Direct position control for touch devices
			const player = gameSession.players.get(userId);
			if (!player) {
				console.log(`⚠️ Player ${userId} not found in game session`);
				return;
			}
			// message.position is expected to be a percentage (0-100)
			if (typeof message.position === 'number' && message.position >= 0 && message.position <= 100) {
				// Update the paddle position directly in game state
				if (gameSession.gameState.paddleA.userId === userId) {
					gameSession.gameState.paddleA.y = message.position;
				} else if (gameSession.gameState.paddleB.userId === userId) {
					gameSession.gameState.paddleB.y = message.position;
				}
			}
		} if (message.type === 'pause') {
			if (message.action === 'stop') {
				gameSession.isPaused = true;
				gameSession.pausedByUserId = message.pausedby;
				gameSession.pauseTimer = setTimeout(() => gameWsNotification.notifyAbandonnedGame(gameSession, gameSession.pausedByUserId!), 10000);
				gameWsNotification.notifyPause(gameSession, userId, true);
			}
			if (message.action === 'resume') {
				gameSession.isPaused = false;
				if (gameSession.pauseTimer) {
					clearTimeout(gameSession.pauseTimer);
					gameSession.pauseTimer = null;
				}
				gameWsNotification.notifyPause(gameSession, userId, false);
			}
		} if (message.type === 'quit') {
			if (gameSession.gameLoop) {
				clearInterval(gameSession.gameLoop!);
				gameSession.gameLoop = null;
			}
			gameWsNotification.notifyAbandonnedGame(gameSession, message.looser);
		}
	});

	socket.on('close', () => {
		console.log(`👋 Player ${userId} disconnected from game : ${gameId}`);
		
		const session = gameSessions.get(gameId);
		if (!session) {
			console.log(`⚠️ Game session ${gameId} already cleaned up`);
			return;
		}
		
		if (session.gameState.status === 'playing') {
			console.log(`⏱️ Starting disconnect timeout for player ${userId}`);
			
			session.isPaused = true;
			gameWsNotification.notifyPlayerDisconnected(session, userId);
			session.disconnectedUserId = userId;
			session.disconnectTimer = setTimeout(() => {
				console.log(`⏰ Disconnect timeout expired for player ${userId}`);
				const currentSession = gameSessions.get(gameId);
				if (currentSession && currentSession.disconnectedUserId === userId) {
					gameWsNotification.notifyAbandonnedGame(currentSession, userId);
				}
			}, 30000);
		} else {
			// Game not in playing state, just remove player
			session.players.delete(userId);
			console.log(`�️ Player ${userId} removed from game session`);
			
			// If no players left, clean up the session
			if (session.players.size === 0) {
				console.log(`🧹 No players left, cleaning up game session ${gameId}`);
				cleanupGameSession(gameId, session);
			}
		}
	});

	runGame(gameSession, gameId);
}

function createGameSession(gameId: string, userId: string, scoreToWin: number, socket: WebSocket): GameSession{
	const arenaWidth = 200;
	const arenaHeight = 100;
	const paddleWidth = arenaWidth * (2/100);
	const paddleHeight = arenaHeight * (1/5);

	const newGame: GameSession = {
		gameId: gameId,
		players: new Map(),
		gameState: {
			paddleA: {
				y: (arenaHeight / 2) - (paddleHeight / 2),
				userId: userId,
				side: 'left'
			},
			paddleB: {
				y: (arenaHeight / 2) - (paddleHeight / 2),
				userId: undefined,
				side: 'right'
			},
			ball: {
				x: 200 / 2,
				y: 100 / 2,
				velocityX: 0,
				velocityY: 0
			},
			score: {
				playerA: 0,
				playerB: 0
			},
			status: 'waiting',
			nextservice: 'playerA'
		},
		gameConfig: {
			arenaheight: arenaHeight, // = 100
			arenawidth: arenaWidth, // = 200
			paddleheight: paddleHeight, // = 20
			paddlewidth: paddleWidth, // = 4
			paddlespeed: 2,
			ballspeed: 2,
			ballsize: 5,
			scoreToWin: scoreToWin
		},
		gameLoop: null,
		winnerNotified: false,
		isPaused: false,
		pauseTimer: null,
		pausedByUserId: null,
		disconnectTimer: null,
		disconnectedUserId: null,
		abandonedNotified: false
	};

	const firstPlayer: PlayerConnection = {
		socket: socket,
		userId: userId,
		isCreator: true,
		position: 'left',
		input: {
			up: false,
			down: false
		},
		score: 0
	};

	newGame.players.set(userId, firstPlayer);

	return (newGame!);
}

function addNewPlayer(gameSession: GameSession, userId: string, socket: WebSocket): void {
	const newPlayer: PlayerConnection = {
		socket: socket,
		userId: userId,
		isCreator: false,
		position: 'right',
		input: {
			up: false,
			down: false
		},
		score: 0
	}
	gameSession.players.set(userId, newPlayer);
	gameSession.gameState.paddleB.userId = userId;
}

function checkForReconnection(gameSession: GameSession, userId: string, socket: WebSocket) {
	if (gameSession.disconnectedUserId === userId && gameSession.disconnectTimer) {
		console.log(`🔄 Player ${userId} reconnected! Clearing disconnect timeout`);
		
		// Clear the disconnect timeout
		clearTimeout(gameSession.disconnectTimer);
		gameSession.disconnectTimer = null;
		gameSession.disconnectedUserId = null;
		
		// Update the socket for this player
		const player = gameSession.players.get(userId);
		if (player) {
			player.socket = socket;
		}
		
		// Resume the game
		gameSession.isPaused = false;
		
		// Notify other players
		gameWsNotification.notifyPlayerReconnected(gameSession, userId);
	} else if (gameSession.players.size < 2 && !gameSession.players.has(userId)) {
		addNewPlayer(gameSession, userId, socket);
	}
}

async function runGame(gameSession: GameSession, gameId: string){
	if (gameSession.players.size === 2) {
		// Only send start notification if this is the first time 2 players connect
		// (not a reconnection after disconnect)
		if (gameSession.gameState.status === 'waiting') {
			gameSession.gameState.status = 'playing';
			gameWsNotification.notifyGameStarted(gameSession, gameId);
		}
		
		if (!gameSession.gameLoop) {
			console.log('🎮 Starting game loop...');
			gameSession.gameLoop = setInterval(() => {
				if (gameSession.gameState.status === 'finished') {
					console.log('🏁 Game finished, stopping game loop');
					if (gameSession.gameLoop) {
						clearInterval(gameSession.gameLoop!);
						gameSession.gameLoop = null;
					}
					return;
				}
				
				if (gameSession.players.size === 2) {
					gameAlgo.calculateGame(gameSession);
					gameWsNotification.broadcastGameState(gameSession);
				}
			}, 1000 / 60);
		}
		await sleep(3000);
		await ballAlgo.service(gameSession);
	}
}

// ======== CLEANUP GAME SESSION ============
export function cleanupGameSession(gameId: string, gameSession: GameSession): void {
	console.log(`🧹 Cleaning up game session: ${gameId}`);
	
	if (gameSession.gameLoop) {
		clearInterval(gameSession.gameLoop);
		gameSession.gameLoop = null;
	}

	if (gameSession.pauseTimer) {
		clearTimeout(gameSession.pauseTimer);
		gameSession.pauseTimer = null;
	}

	if (gameSession.disconnectTimer) {
		clearTimeout(gameSession.disconnectTimer);
		gameSession.disconnectTimer = null;
	}
	
	// Close all WebSocket connections
	gameSession.players.forEach((player, userId) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			console.log(`👋 Closing WebSocket for player ${userId}`);
			player.socket.close(1000, 'Game finished');
		}
	});
	gameSession.players.clear();
	gameSessions.delete(gameId);
	console.log(`🧹 Game session ${gameId} cleaned up successfully`);
}


export const GameWsController = {
	gameHandler,
};