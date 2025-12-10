import type { GameSession, PlayerConnection, GameConfig } from "./game.types.js";
import { notifyFinishGame, notifyService } from "./game.ws.controller.js";

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

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function calculLeftPaddleCollision(gameSession: GameSession, leftPaddle: {y: number}) {
	const ball = gameSession.gameState.ball;
	console.log(`🏓 BALL HIT LEFT : ballX=${ball.x} | ballY=${ball.y}`)
			
	// Calculate relative hit position on paddle (0 to 1, where 0.5 is center)
	const relativeHitY = (ball.y - leftPaddle.y) / gameSession.gameConfig.paddleheight;
	
	// Adjust velocityY based on where ball hit the paddle
	// Hit at center (0.5) = no Y change, hit at edges = max Y change
	const yInfluence = (relativeHitY - 0.5) * 2; // Range from -1 to 1
	ball.velocityY = yInfluence * Math.abs(ball.velocityX);
	
	// Reverse X direction
	ball.velocityX = -ball.velocityX;
	
	// Normalize to maintain constant speed
	const speed = gameSession.gameConfig.ballspeed;
	const currentSpeed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
	ball.velocityX = (ball.velocityX / currentSpeed) * speed;
	ball.velocityY = (ball.velocityY / currentSpeed) * speed;
}

function calculRightPaddleCollision(gameSession: GameSession, rightPaddle: {y: number}) {
	const ball = gameSession.gameState.ball;
	console.log(`🏓 BALL HIT RIGHT : ballX=${ball.x} | ballY=${ball.y}`)
			
	// Calculate relative hit position on paddle (0 to 1, where 0.5 is center)
	const relativeHitY = (ball.y - rightPaddle.y) / gameSession.gameConfig.paddleheight;
	
	// Adjust velocityY based on where ball hit the paddle
	// Hit at center (0.5) = no Y change, hit at edges = max Y change
	const yInfluence = (relativeHitY - 0.5) * 2; // Range from -1 to 1
	ball.velocityY = yInfluence * Math.abs(ball.velocityX);
	
	// Reverse X direction
	ball.velocityX = -ball.velocityX;
	
	// Normalize to maintain constant speed
	const speed = gameSession.gameConfig.ballspeed;
	const currentSpeed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
	ball.velocityX = (ball.velocityX / currentSpeed) * speed;
	ball.velocityY = (ball.velocityY / currentSpeed) * speed;
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
			calculLeftPaddleCollision(gameSession, leftPaddle)
			return;
		}
	}
	
	// Right paddle collision
	if (ball.x >= config.arenawidth - gap  && ball.velocityX > 0) { // Ball x collision on right side and moving right
		if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + config.paddleheight) { // Ball y is within paddle range
			calculRightPaddleCollision(gameSession, rightPaddle);
			return;
		}
	}
	
	// Goal scored - left side
	if (ball.x <= config.ballsize / 2) {
		if (gameSession.gameState.paddleA.side === 'left') {
			gameSession.gameState.score.playerA++;
			const playerAObj = gameSession.players.get(gameSession.gameState.paddleA.userId);
			if (playerAObj) {
				playerAObj.score++;
			}
			gameSession.gameState.nextservice = 'playerA';
		}
		else {
			gameSession.gameState.score.playerB++;
			const playerBObj = gameSession.players.get(gameSession.gameState.paddleB.userId!);
			if (playerBObj) {
				playerBObj.score++;
			}
			gameSession.gameState.nextservice = 'playerB';
		}
		if (gameSession.gameState.score.playerA >= config.scoreToWin || gameSession.gameState.score.playerB >= config.scoreToWin) {
			if (gameSession.gameState.score.playerA >= config.scoreToWin) {
				notifyFinishGame(gameSession, gameSession.players.get(gameSession.gameState.paddleA.userId)!);
			} else
				notifyFinishGame(gameSession, gameSession.players.get(gameSession.gameState.paddleB.userId!)!);
			gameSession.gameState.ball.x = 0;
			gameSession.gameState.ball.y = 0;
			gameSession.gameState.ball.velocityX = 0;
			gameSession.gameState.ball.velocityY = 0;
			return;
		}
		// console.log(`💥 BALL OUT LEFT : ballX=${ball.x} | ballY=${ball.y}`)
		service(gameSession);
		return;
	}
	
	// Goal scored - right side
	if (ball.x >= config.arenawidth - config.ballsize / 2) {
		if (gameSession.gameState.paddleA.side === 'right') {
			gameSession.gameState.score.playerA++;
			const playerAObj = gameSession.players.get(gameSession.gameState.paddleA.userId);
			if (playerAObj) {
				playerAObj.score++;
			}
			gameSession.gameState.nextservice = 'playerA';
		}
		else {
			gameSession.gameState.score.playerB++;
			const playerBObj = gameSession.players.get(gameSession.gameState.paddleB.userId!);
			if (playerBObj) {
				playerBObj.score++;
			}
			gameSession.gameState.nextservice = 'playerB';
		}
		if (gameSession.gameState.score.playerA >= config.scoreToWin || gameSession.gameState.score.playerB >= config.scoreToWin) {
			if (gameSession.gameState.score.playerA >= config.scoreToWin || gameSession.gameState.score.playerB >= config.scoreToWin) {
				if (gameSession.gameState.score.playerA >= config.scoreToWin) {
					notifyFinishGame(gameSession, gameSession.players.get(gameSession.gameState.paddleA.userId)!);
				} else
					notifyFinishGame(gameSession, gameSession.players.get(gameSession.gameState.paddleB.userId!)!);
				gameSession.gameState.ball.x = 0;
				gameSession.gameState.ball.y = 0;
				gameSession.gameState.ball.velocityX = 0;
				gameSession.gameState.ball.velocityY = 0;
				return;
			}
			return;
		}
		// console.log(`💥 BALL OUT RIGHT : ballX=${ball.x} | ballY=${ball.y}`)
		service(gameSession);
		return;
	}
}

function getRandom(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

async function service(gameSession: GameSession) {
	const config = gameSession.gameConfig;
	const ball = gameSession.gameState.ball;

	// Stop the ball immediately
	ball.velocityX = 0;
	ball.velocityY = 0;

	// Reset ball to center
	ball.x = config.arenawidth / 2;
	ball.y = config.arenaheight / 2;

	console.log(`🥎 ball centered : x=${ball.x} | y=${ball.y}`);

	notifyService(gameSession);

	// Wait before serving
	await sleep(4000);


	// Random direction
	gameSession.gameState.nextservice === 'playerA' ? ball.velocityX = 1 : ball.velocityX = -1;
	ball.velocityY = getRandom(-1, 1);
	
	// Normalize to constant speed
	const speed = config.ballspeed;
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

