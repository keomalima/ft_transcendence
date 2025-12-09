import type { GameSession, PlayerConnection, GameConfig } from "./game.types.js";

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
	
	// Calculate paddle positions
	gameSession.gameState.paddleA.y = calculatePaddle(playerA, gameSession.gameState.paddleA.y, gameSession.gameConfig);
	gameSession.gameState.paddleB.y = calculatePaddle(playerB, gameSession.gameState.paddleB.y, gameSession.gameConfig);
	
	// Calculate ball position and collisions
	calculateBall(gameSession);
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

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBall(gameSession: GameSession) {
	const config = gameSession.gameConfig;
	const ball = gameSession.gameState.ball;
	const paddleA = gameSession.gameState.paddleA;
	const paddleB = gameSession.gameState.paddleB;
	
	// Update ball position based on velocity
	ball.x += ball.velocityX;
	ball.y += ball.velocityY;
	
	// Top wall collision
	if (ball.y <= config.ballsize / 2) {
		ball.y = config.ballsize / 2 + 0.1;
		ball.velocityY = -ball.velocityY; // Bounce
	}
	
	// Bottom wall collision
	if (ball.y >= config.arenaheight - config.ballsize / 2) {
		ball.y = config.arenaheight - config.ballsize / 2 - 0.1;
		ball.velocityY = -ball.velocityY; // Bounce
	}

	// Identify left / right player
	const playerA = gameSession.players.get(paddleA.userId );
	const leftPaddle = playerA?.position === 'left' ? paddleA : paddleB;
	const rightPaddle = playerA?.position === 'right' ? paddleA : paddleB;
	const gap = config.ballsize / 2 + config.paddlewidth; // = paddle width + half of ball size

	// Left paddle collision
	if (ball.x <= gap && ball.velocityX < 0) { // Ball x collision on left side and moving left
		if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + config.paddleheight) { // Ball y is within paddle range
			ball.velocityX = -ball.velocityX; // Bounce
			ball.x = gap + 0.1;
		}
	}
	
	// Right paddle collision
	if (ball.x >= config.arenawidth - gap  && ball.velocityX > 0) { // Ball x collision on right side and moving right
		if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + config.paddleheight) { // Ball y is within paddle range
			console.log(`🏓 BALL : ballX=${ball.x} | ballY=${ball.y}`)
			console.log(`🏓 PADDLE : paddleY=${rightPaddle.y}`)
			ball.velocityX = -ball.velocityX; // Bounce
			ball.x = config.arenawidth - gap - 0.1; // Push ball away from paddle
		}
	}
	
	// Goal scored - left side
	if (ball.x <= 0) {
		if (gameSession.gameState.paddleA.side === 'left')
			gameSession.gameState.score.playerA++;
		else
			gameSession.gameState.score.playerB++;
		console.log(`💥 BALL OUT LEFT : ballX=${ball.x} | ballY=${ball.y}`)
		service(gameSession);
		return;
	}
	
	// Goal scored - right side
	if (ball.x >= config.arenawidth) {
		if (gameSession.gameState.paddleA.side === 'right')
			gameSession.gameState.score.playerA++;
		else
			gameSession.gameState.score.playerB++;
		console.log(`💥 BALL OUT RIGHT : ballX=${ball.x} | ballY=${ball.y}`)
		service(gameSession); // Reset ball
		return;
	}
}

function getRandom(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

function service(gameSession: GameSession) {
	const config = gameSession.gameConfig;
	const ball = gameSession.gameState.ball;

	// Reset ball to center
	ball.x = config.arenawidth / 2;
	ball.y = config.arenaheight / 2;
	
	// Random velocity direction
	const speed = config.ballspeed;
	
	// Random direction
	ball.velocityX = (Math.random() > 0.5 ? 1 : -1);
	ball.velocityY = getRandom(-1, 1);
	
	// Normalize to constant speed
	const currentSpeed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
	ball.velocityX = (ball.velocityX / currentSpeed) * speed;
	ball.velocityY = (ball.velocityY / currentSpeed) * speed;

	// console.log(`🏓 service : velocityX=${ball.velocityX} | velocityY=${ball.velocityY}`);
}

export const gameAlgo = {
	service,
	calculateGame,
	calculateBall
}

// function calculateBall(gameSession: GameSession) {
// 	const config = gameSession.gameConfig;
// 	const ball = gameSession.gameState.ball;
// 	const paddleA = gameSession.gameState.paddleA;
// 	const paddleB = gameSession.gameState.paddleB;
	
// 	// Update ball position based on velocity
// 	ball.x += ball.velocityX;
// 	ball.y += ball.velocityY;
	
// 	// Top wall collision
// 	if (ball.y <= 0) {
// 		ball.y = 0;
// 		ball.velocityY = -ball.velocityY; // Bounce
// 	}
	
// 	// Bottom wall collision
// 	if (ball.y >= config.arenaheight) {
// 		ball.y = config.arenaheight;
// 		ball.velocityY = -ball.velocityY; // Bounce
// 	}
	
// 	// Left paddle collision (paddleA)
// 	const playerA = gameSession.players.get(paddleA.userId);
// 	if (playerA && playerA.position === 'left') {
// 		// Ball is on left side and moving left
// 		if (ball.x <= 10 && ball.velocityX < 0) { // 10 = paddle x position + paddle width
// 			// Check if ball Y is within paddle range
// 			if (ball.y >= paddleA.y && ball.y <= paddleA.y + config.paddleheight) {
// 				ball.velocityX = -ball.velocityX; // Bounce
// 				ball.x = 10; // Prevent ball from going through
// 			}
// 		}
// 	}
	
// 	// Right paddle collision (paddleB)
// 	const playerB = gameSession.players.get(paddleB.userId!);
// 	if (playerB && playerB.position === 'right') {
// 		// Ball is on right side and moving right
// 		if (ball.x >= config.arenawidth - 10 && ball.velocityX > 0) { // 10 = paddle x position
// 			// Check if ball Y is within paddle range
// 			if (ball.y >= paddleB.y && ball.y <= paddleB.y + config.paddleheight) {
// 				ball.velocityX = -ball.velocityX; // Bounce
// 				ball.x = config.arenawidth - 10; // Prevent ball from going through
// 			}
// 		}
// 	}
	
// 	// Goal scored - left side
// 	if (ball.x < 0) {
// 		gameSession.gameState.score.playerB++;
// 		service(gameSession); // Reset ball
// 		return;
// 	}
	
// 	// Goal scored - right side
// 	if (ball.x > config.arenawidth) {
// 		gameSession.gameState.score.playerA++;
// 		service(gameSession); // Reset ball
// 		return;
// 	}
// }