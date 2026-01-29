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

	let gameSession = gameSessions.get(gameId);

	// Check if player is already connected with an ACTIVE socket
	if (gameSession && gameSession.players.has(userId)) {
		const existingPlayer = gameSession.players.get(userId)!;	
		// If the existing socket is still OPEN, this is a duplicate connection attempt
		if (existingPlayer.socket.readyState === WebSocket.OPEN) {
			gameWsNotification.notifyPlayerAlreadyInGame(socket, gameId);
			return;
		}
	}

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
			
			// Store disconnect timer for this specific player with start timestamp
			const startTime = Date.now();
			const timer = setTimeout(async () => {
				console.log(`⏰ Disconnect timeout expired for player ${userId}`);
				const currentSession = gameSessions.get(gameId);
				if (currentSession && currentSession.disconnectTimers.has(userId)) {
					// Check if ANY player is still connected
					const hasConnectedPlayer = Array.from(currentSession.players.values()).some(
						player => player.socket.readyState === WebSocket.OPEN
					);
					
					if (hasConnectedPlayer) {
						// Someone is still connected, let frontend handle it
						console.log(`📤 Notifying connected players about abandonment`);
						gameWsNotification.notifyAbandonnedGame(currentSession, userId);
					} else {
						// Nobody connected, backend must finish the game
						console.log(`🔒 No players connected, backend finishing abandoned game`);
						try {
							await gameService.finishGame(request.server.prisma, gameId, 'ABANDONED');
							console.log(`✅ Game ${gameId} marked as ABANDONED in database`);
						} catch (error) {
							console.error(`❌ Failed to abandon game ${gameId}:`, error);
						}
						// Clean up the session
						cleanupGameSession(gameId, currentSession);
					}
				}
			}, 30000);
			
			session.disconnectTimers.set(userId, { timer, startTime });
		} else {
			// Game not in playing state, just remove player
			session.players.delete(userId);
			console.log(`🗑️ Player ${userId} removed from game session`);
			
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
			ballsize: 4,
			scoreToWin: scoreToWin
		},
		gameLoop: null,
		winnerNotified: false,
		isPaused: false,
		pauseTimer: null,
		pausedByUserId: null,
		disconnectTimers: new Map(), // Initialize the Map
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
	const disconnectInfo = gameSession.disconnectTimers.get(userId);
	
	if (disconnectInfo) {
		console.log(`🔄 Player ${userId} reconnected! Clearing disconnect timeout`);
		
		// Clear this player's disconnect timeout
		clearTimeout(disconnectInfo.timer);
		gameSession.disconnectTimers.delete(userId);
		
		// Update the socket for this player
		const player = gameSession.players.get(userId);
		if (player) {
			player.socket = socket;
		}
		
		// Only unpause if ALL players are back (no more disconnect timers)
		if (gameSession.disconnectTimers.size === 0) {
			gameSession.isPaused = false;
			gameWsNotification.notifyPlayerReconnected(gameSession, userId);
		} else {
			console.log(`⏳ Waiting for other players to reconnect (${gameSession.disconnectTimers.size} still disconnected)`);
			
			// For each still-disconnected player, calculate remaining time and notify
			gameSession.disconnectTimers.forEach((info, disconnectedUserId) => {
				const elapsed = (Date.now() - info.startTime) / 1000; // seconds
				const remaining = Math.max(0, 30 - elapsed); // 30s timeout
				
				// Send notification to the reconnected player about this disconnected player
				if (socket.readyState === WebSocket.OPEN) {
					socket.send(JSON.stringify({
						type: 'player-disconnected',
						disconnectedUserId,
						timeoutSeconds: Math.ceil(remaining)
					}));
				}
			});
		}
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

	// Clear all disconnect timers
	gameSession.disconnectTimers.forEach((info, userId) => {
		console.log(`⏹️ Clearing disconnect timer for player ${userId}`);
		clearTimeout(info.timer);
	});
	gameSession.disconnectTimers.clear();
	
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