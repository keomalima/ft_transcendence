import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';
import type { GameSession, PlayerConnection } from './game.types.js';
import { gameAlgo } from './game.algo.js';
// import { gameLoop } from './game.session.js';

// =====================
// Websocket Handlers for Game
// =====================

// Game session mapping gameId(string) with gameSession(interface)
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
		}
	});

	if (gameSession.players.size! == 2) {
		notifyGameStarted(gameSession);
	}

	gameAlgo.service(gameSession);

	const gameLoop = setInterval(() => {
		if (gameSession.players.size! == 2) {
			gameAlgo.calculateGame(gameSession);
			broadcastGameState(gameSession, socket);
		}
	}, 1000 / 60)

	socket.on('close', () => {
		clearInterval(gameLoop);
		gameSession.players.delete(userId);
		console.log(`Player ${userId} disconnected from game : ${gameId}`);
		// TO DO : handle differently depending on is player is creator or not
	});
}

function createGameSession(gameId: string, userId: string, socket: WebSocket): GameSession{
	const newGame: GameSession = {
		gameId: gameId,
		players: new Map(),
		gameState: {
			paddleA: {
				y: (100 / 2) - ((100 / 5) / 2),
				userId: userId
			},
			paddleB: {
				y: (100 / 2) - ((100 / 5) / 2),
				userId: undefined
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
			status: 'waiting'
		},
		gameConfig: {
			arenaheight: 100,
			arenawidth: 200,
			paddleheight: 100 / 5,
			paddlespeed: 1,
			ballspeed: 1,
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
		}
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
		}
	}
	gameSession.players.set(userId, newPlayer);
	gameSession.gameState.paddleB.userId = userId;
}

function notifyGameStarted(gameSession: GameSession): void {
	console.log('🚀 All players are connected, game starts!');
	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'start_game',
				message: "Your game is about to start"
			}));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

function broadcastGameState(gameSession: GameSession, socket: WebSocket): void {
	const paddleA = gameSession.gameState.paddleA;
	const paddleB = gameSession.gameState.paddleB;

	const playerA = gameSession.players.get(paddleA.userId );

	const leftPaddle = playerA?.position === 'left' ? paddleA.y : paddleB.y;
	const rightPaddle = playerA?.position === 'right' ? paddleA.y : paddleB.y;
	// console.log(`📻 Broadcast ______ left = ${leftPaddle} ________ paddleB = ${rightPaddle}`);

	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'update_game',
				left: `${leftPaddle}`,
				right: `${rightPaddle}`,
				ballX: `${gameSession.gameState.ball.x}`,
				ballY: `${gameSession.gameState.ball.y}`,
			}));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}


export const GameWsController = {
	gameHandler,
};