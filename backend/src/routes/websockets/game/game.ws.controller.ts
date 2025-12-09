import type { FastifyRequest } from 'fastify'
import { WebSocket } from 'ws';
import type { GameConfig, GameSession, PlayerConnection } from './game.types.js';
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
			player!.input.up = message.action === 'up';
			player!.input.down = message.action === 'down';
		}
	});

	if (gameSession.players.size! == 2) {
		notifyGameStarted(gameSession);
	}

	const gameLoop = setInterval(() => {
		if (gameSession.players.size! == 2) {
			calculateGame(gameSession);
			broadcastGameState(gameSession);
		}
	}, 3000)

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
				y: 25,				// to set with correct value
				userId: userId
			},
			paddleB: {
				y: 25,				// to set with correct value
				userId: undefined
			},
			ball: {
				x: 50,				// to set with correct value
				y: 25				// to set with correct value
			},
			score: {
				playerA: 0,
				playerB: 0
			},
			status: 'waiting'
		},
		gameConfig: {
			arenaheight: 50,
			arenawidth: 100,
			paddleheight: 20,
			paddlespeed: 5,
			ballspeed: 5,
			scoreToWin: 5				// to set with correct value
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

function broadcastGameState(gameSession: GameSession): void {
	const paddleA = gameSession.gameState.paddleA;
	const paddleB = gameSession.gameState.paddleB;

	const playerA = gameSession.players.get(paddleA.userId );
	// const playerB = gameSession.players.get(paddleB.userId!);

	const leftPaddle = playerA?.position === 'left' ? paddleA : paddleB;
	const rightPaddle = playerA?.position === 'right' ? paddleA : paddleB;
	console.log(`📻 Broadcast ______ left = ${leftPaddle} ________ paddleB = ${rightPaddle}`);

	gameSession.players.forEach((player) => {
		if (player.socket.readyState === WebSocket.OPEN) {
			player.socket.send(JSON.stringify({
				type: 'update_game',
				left: `${leftPaddle}`,
				right: `${rightPaddle}`
			}));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${player.socket.readyState}`);
		}
	})
}

function calculateGame(gameSession: GameSession): void {
	const paddleA = gameSession.gameState.paddleA;
	const paddleB = gameSession.gameState.paddleB;
	if (!paddleA.userId || !paddleB.userId) {
		console.log('❌ missing player 1');
		return;
	}

	const playerA = gameSession.players.get(paddleA.userId );
	const playerB = gameSession.players.get(paddleB.userId!);
	if (!playerA || !playerB) {
		console.log('❌ missing player 2');
		return;
	}
	gameSession.gameState.paddleA.y = calculatePaddle(playerA, gameSession.gameState.paddleA.y, gameSession.gameConfig);
	gameSession.gameState.paddleB.y = calculatePaddle(playerA, gameSession.gameState.paddleB.y, gameSession.gameConfig);
	console.log(`🧮 Calculate______paddleA = ${gameSession.gameState.paddleA.y} ________ paddleB = ${gameSession.gameState.paddleB.y}`);
}

function calculatePaddle(player: PlayerConnection, paddlePosition: number, config: GameConfig): number {
	const speed = config.paddlespeed;
	const pHeight = config.paddleheight;
	const aHeight = config.arenaheight;
	if (player.input.up){
		if (paddlePosition - speed < pHeight / 2)
			return (pHeight / 2);
		return (paddlePosition -= speed);
	}
	if (player.input.down) {
		if (paddlePosition + speed > aHeight - (pHeight / 2))
			return (aHeight - (pHeight / 2));
		return (paddlePosition += speed);
	}
	return paddlePosition;
}

// function playerAction(gameSession: GameSession, userId: string, action: 'up' | 'down' | 'stop'): void {
// 	const player = gameSession.players.get(userId);
// 	if (!player) {
// 		console.log('❌ player not found');
// 		return;
// 	}
// 	console.log(`🖐️ User ${userId} send ${action}`)
// 	// const gameState = gameSession.gameState;
// 	if (action === 'up') {
// 		player.input.up = true;
// 		player.input.down = false;
// 	}
// 	else if (action === 'down') {
// 		player.input.down = true;
// 		player.input.up = false;
// 	}
// 	else if (action === 'stop'){
// 		player.input.down = false;
// 		player.input.up = false;
// 	}
// }

export const GameWsController = {
	gameHandler,
	// playerAction
};