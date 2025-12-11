import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';
import type { GameSession, PlayerConnection } from './game.types.js';
import { gameAlgo } from './game.algo.js';
import { ballAlgo } from './game.algo.ball.js';
import { sleep } from './game.algo.utils.js';
// import { gameLoop } from './game.session.js';

// =====================
// Websocket Handlers for Game
// =====================

// Game session mapping gameId(string) with gameSession(interface)
const gameSessions = new Map<string, GameSession>();
let gameLoop: NodeJS.Timeout | null = null;

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

	console.log(`🎮 PLAYERS IN GAME:`, Array.from(gameSession.players.entries()).map(([id, p]) => `${id} -> ${p.position} (paddleA=${gameSession.gameState.paddleA.userId}, paddleB=${gameSession.gameState.paddleB.userId})`));

	socket.on('message', (data: Buffer) => {
		const message = JSON.parse(data.toString());
		if (message.type === 'input') {
			const player = gameSession.players.get(userId);
			// console.log(`🎮 INPUT: userId=${userId}, action=${message.action}, position=${player?.position}`);
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
		}
	});

	if (gameSession.players.size! == 2) {
		gameSession.gameState.status = 'playing';
		notifyGameStarted(gameSession, gameId);
		await sleep(3000);
		ballAlgo.service(gameSession);
	}

	gameLoop = setInterval(() => {
		if (gameSession.gameState.status === 'finished') {
			clearInterval(gameLoop!);
			gameLoop = null;
		}
		if (gameSession.players.size! == 2) {
			gameAlgo.calculateGame(gameSession);
			broadcastGameState(gameSession);
		}
	}, 1000 / 60)

	socket.on('close', () => {
		if (gameLoop)
			clearInterval(gameLoop);
		gameSession.players.delete(userId);
		console.log(`Player ${userId} disconnected from game : ${gameId}`);
		// TO DO : handle differently depending on is player is creator or not
	});
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
			ballspeed: 0.8,
			ballsize: 5,
			scoreToWin: 5
		}
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

export function notifyWonGame(gameSession: GameSession): void {
	console.log('🚀 Game has a winner!');
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'won-game',
				iswinner: player.score >= gameSession.gameConfig.scoreToWin,
				playerinfo: {
					userId: player.userId,
					isCreator: player.isCreator,
					position: player.position,
					score: player.score
				}
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