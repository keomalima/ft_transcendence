import type { GameSession, PlayerConnection, GameConfig } from "./game.types.js";
import { ballAlgo } from "./game.algo.ball.js";


function calculateGame(gameSession: GameSession): void {
	if (gameSession.isPaused === true)
		return;

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
	
	// Calculate ball position and collisions
	calculateBall(gameSession);

	// Calculate paddle positions
	gameSession.gameState.paddleA.y = calculatePaddle(playerA, gameSession.gameState.paddleA.y, gameSession.gameConfig);
	gameSession.gameState.paddleB.y = calculatePaddle(playerB, gameSession.gameState.paddleB.y, gameSession.gameConfig);
}

function calculatePaddle(player: PlayerConnection, paddlePosition: number, config: GameConfig): number {
	const speed = config.paddlespeed;
	const pHeight = config.paddleheight;
	const aHeight = config.arenaheight;
	
	if (player.input.up) {
		if (paddlePosition - speed < 0)
			return 0;
		return paddlePosition - speed;
	}
	if (player.input.down) {
		if (paddlePosition + pHeight + speed > aHeight)
			return aHeight - pHeight;
		return paddlePosition + speed;
	}
	return paddlePosition;
}

function calculateBall(gameSession: GameSession) {
	const config = gameSession.gameConfig;
	const ball = gameSession.gameState.ball;
	
	// Update ball position based on velocity
	ball.x += ball.velocityX;
	ball.y += ball.velocityY;
	
	ballAlgo.calculateWallCollision(ball, config);

	ballAlgo.calculatePaddleCollision(gameSession, config, ball);

	ballAlgo.calculateScored(gameSession, config, ball);

}

export const gameAlgo = {
	calculateGame,
	calculateBall
}

