import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';
import type { GameSession, PlayerConnection } from './game.types.js';
import { gameAlgo } from './game.algo.js';
import { ballAlgo } from './game.algo.ball.js';
import { sleep } from './game.algo.utils.js';
import { gameService } from '../../game/game.service.js';

// =====================
// Websocket Handlers for Game
// =====================

const gameSessions = new Map<string, GameSession>();

async function gameHandler(socket: WebSocket, request: FastifyRequest<{Params: {gameId: string, userId: string}}>) {
	const gameId = request.params.gameId;
	const userId = request.params.userId;

	console.log(`➡️ User ${userId} connected to game ${gameId}`);

	let gameSession = gameSessions.get(gameId);

	if (!gameSession) {
		gameSession = createGameSession(gameId, userId, socket);
		gameSessions.set(gameId, gameSession);
	}

	if (gameSession.players.size! < 2 && !gameSession.players.has(userId))
		addNewPlayer(gameSession, userId, socket);

	socket.on('message', (data: Buffer) => {
		const message = JSON.parse(data.toString());
		if (message.type === 'input') {
			const player = gameSession.players.get(userId);
			if (message.action === 'up') {
				player!.input.up = true;
				player!.input.down = false;
			} else if (message.action === 'down') {
				player!.input.up = false;
				player!.input.down = true;
			} else if (message.action === 'stop') {
				player!.input.up = false;
				player!.input.down = false;
			}
		} if (message.type === 'pause') {
			if (message.action === 'stop') {
				gameSession.isPaused = true;
				notifyPause(gameSession, socket, true);
			}
			if (message.action === 'start') {
				gameSession.isPaused = false;
				notifyPause(gameSession, socket, false);
			}
		} if (message.type === 'quit') {
			clearInterval(gameSession.gameLoop);
			notifyAbandonnedGame(gameSession, message.looser);
		}
	});

	socket.on('close', () => {
		if (gameSession.gameLoop)
			clearInterval(gameSession.gameLoop);
		gameSession.players.delete(userId);
		console.log(`Player ${userId} disconnected from game : ${gameId}`);
		// TO DO : handle differently depending on is player is creator or not
	});

	if (gameSession.players.size! == 2) {
		gameSession.gameState.status = 'playing';
		notifyGameStarted(gameSession, gameId);
		
		// Start the game loop immediately
		if (!gameSession.gameLoop) {
			console.log('🎮 Starting game loop...');
			gameSession.gameLoop = setInterval(() => {
				// Check if game is finished FIRST, before processing
				if (gameSession.gameState.status === 'finished') {
					console.log('🏁 Game finished, stopping game loop');
					clearInterval(gameSession.gameLoop!);
					gameSession.gameLoop = null;
					return; // Exit immediately, don't process this frame
				}
				
				// Only process if we have 2 players
				if (gameSession.players.size === 2) {
					gameAlgo.calculateGame(gameSession);
					broadcastGameState(gameSession);
				}
			}, 1000 / 60);
			console.log('✅ Game loop started successfully');
		}
		
		// Start the service (will set ball velocity after countdown)
		console.log('⏳ Waiting 3 seconds before service...');
		await sleep(3000);
		console.log('🎾 Starting service...');
		await ballAlgo.service(gameSession);
		console.log('✅ Service completed, ball should be moving');
	}
}

function createGameSession(gameId: string, userId: string, socket: WebSocket): GameSession{
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
			paddlespeed: 1,
			ballspeed: 1,
			ballsize: 5,
			scoreToWin: 11
		},
		gameLoop: null,
		winnerNotified: false,
		isPaused: false
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

function notifyGameStarted(gameSession: GameSession, gameId: string): void {
	console.log('🚀 All players are connected, game starts!');
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'start-game',
				message: "Your game is about to start",
				gameId,
				position: player.position
			}));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

export function notifyService(gameSession: GameSession): void {
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'service',
				message: "Service countdown"
			}));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

export function notifyPause(gameSession: GameSession, socket: WebSocket, status: boolean): void {
	gameSession.players.forEach((player) => {
		if (player.socket !== socket) {
			if (player.socket.readyState === WebSocket.OPEN) {
				player.socket.send(JSON.stringify({
					type: 'pause',
					status,

				}));
			} else {
				console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
			}
		}
	})
}

export function notifyWonGame(gameSession: GameSession): void {
	console.log('🚀 Game has a winner!');
	
	// Prepare both players' info (without socket)
	const playersInfo = Array.from(gameSession.players.values()).map(player => ({
		userId: player.userId,
		isCreator: player.isCreator,
		position: player.position,
		score: player.score
	}));
	
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'won-game',
				iswinner: player.score >= gameSession.gameConfig.scoreToWin,
				currentPlayer: {
					userId: player.userId,
					isCreator: player.isCreator,
					position: player.position,
					score: player.score
				},
				players: playersInfo
			}));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

export function notifyAbandonnedGame(gameSession: GameSession, looserId: string): void {
	
	console.log('👎 Someone gave up the game!');
	
	// Prepare both players' info (without socket)
	const playersInfo = Array.from(gameSession.players.values()).map(player => ({
		userId: player.userId,
		isCreator: player.isCreator,
		position: player.position,
		score: player.score
	}));
	
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'abandoned-game',
				iswinner: looserId !== player.userId,
				currentPlayer: {
					userId: player.userId,
					isCreator: player.isCreator,
					position: player.position,
					score: player.score
				},
				players: playersInfo
			}));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}



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
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}


export const GameWsController = {
	gameHandler,
};