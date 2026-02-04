import { sleep, getRandom } from "./game.algo.utils.js";
import type { GameSession, GameConfig, GameState, PlayerConnection } from "./game.types.js";
import { gameWsNotification } from "./game.ws.notification.js";


function initBall(gameSession: GameSession): void {
	gameSession.gameState.ball.x = gameSession.gameConfig.arenawidth / 2;;
	gameSession.gameState.ball.y = gameSession.gameConfig.arenaheight / 2;;
	gameSession.gameState.ball.velocityX = 0;
	gameSession.gameState.ball.velocityY = 0;
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

	// Wait before serving
	await sleep(2000);


	// Random direction
	gameSession.gameState.nextservice === 'playerA' ? ball.velocityX = 1 : ball.velocityX = -1;
	ball.velocityY = getRandom(-1, 1);
	
	// Normalize to constant speed
	const speed = config.ballspeed;
	const currentSpeed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
	ball.velocityX = (ball.velocityX / currentSpeed) * speed;
	ball.velocityY = (ball.velocityY / currentSpeed) * speed;

}

function calculateWallCollision(ball: GameState['ball'], config: GameConfig) {
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
}

function calculLeftPaddleCollision(ball: GameState['ball'], leftPaddle: {y: number}, config: GameConfig) {
			
	// Calculate relative hit position on paddle (0 to 1, where 0.5 is center)
	const relativeHitY = (ball.y - leftPaddle.y) / config.paddleheight;
	
	// Adjust velocityY based on where ball hit the paddle
	// Hit at center (0.5) = no Y change, hit at edges = max Y change
	const yInfluence = (relativeHitY - 0.5) * 2; // Range from -1 to 1
	ball.velocityY = yInfluence * Math.abs(ball.velocityX);
	
	// Reverse X direction
	ball.velocityX = -ball.velocityX;
	
	// Normalize to maintain constant speed
	const speed = config.ballspeed;
	const currentSpeed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
	ball.velocityX = (ball.velocityX / currentSpeed) * speed;
	ball.velocityY = (ball.velocityY / currentSpeed) * speed;
}

function calculRightPaddleCollision(ball: GameState['ball'], rightPaddle: {y: number}, config: GameConfig) {
			
	// Calculate relative hit position on paddle (0 to 1, where 0.5 is center)
	const relativeHitY = (ball.y - rightPaddle.y) / config.paddleheight;
	
	// Adjust velocityY based on where ball hit the paddle
	// Hit at center (0.5) = no Y change, hit at edges = max Y change
	const yInfluence = (relativeHitY - 0.5) * 2; // Range from -1 to 1
	ball.velocityY = yInfluence * Math.abs(ball.velocityX);
	
	// Reverse X direction
	ball.velocityX = -ball.velocityX;
	
	// Normalize to maintain constant speed
	const speed = config.ballspeed;
	const currentSpeed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
	ball.velocityX = (ball.velocityX / currentSpeed) * speed;
	ball.velocityY = (ball.velocityY / currentSpeed) * speed;
}

function calculatePaddleCollision(gameSession: GameSession, config: GameConfig, ball: GameState['ball']) {
	const gap = config.ballsize / 2 + config.paddlewidth; // = paddle width + half of ball size
	const paddleA = gameSession.gameState.paddleA;
	const paddleB = gameSession.gameState.paddleB;

	// Identify left / right player
	const playerA = gameSession.players.get(paddleA.userId );
	const leftPaddle = playerA?.position === 'left' ? paddleA : paddleB;
	const rightPaddle = playerA?.position === 'right' ? paddleA : paddleB;

	// Left paddle collision
	if (ball.x <= gap && ball.velocityX < 0) { // Ball x collision on left side and moving left
		if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + config.paddleheight) { // Ball y is within paddle range
			calculLeftPaddleCollision(ball, leftPaddle, config)
			return;
		}
	}
	
	// Right paddle collision
	if (ball.x >= config.arenawidth - gap  && ball.velocityX > 0) { // Ball x collision on right side and moving right
		if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + config.paddleheight) { // Ball y is within paddle range
			calculRightPaddleCollision(ball, rightPaddle, config);
			return;
		}
	}
}

function setScore(gameSession: GameSession, playerObj: PlayerConnection, playerName: 'playerA' | 'playerB') {
	gameSession.gameState.score[playerName]++;
	if (playerObj) {
		playerObj.score++;
	}
	if (playerName === 'playerA')
		gameSession.gameState.nextservice = 'playerB';
	else
		gameSession.gameState.nextservice = 'playerA';
}

function wonGame(gameSession: GameSession, config: GameConfig): boolean {
	if (gameSession.gameState.score.playerA >= config.scoreToWin || gameSession.gameState.score.playerB >= config.scoreToWin) {
		// Only notify if we haven't already
		if (!gameSession.winnerNotified) {
			// Set status to finished FIRST to stop the game loop immediately
			gameSession.gameState.status = 'finished';
			gameSession.winnerNotified = true;
			
			initBall(gameSession);
			gameWsNotification.notifyFinishingGame(gameSession, 'WON');
			// console.log('🏆 Winner notified, game session marked as finished');
		}
		
		return true;
	}
	return false;
}

function calculateScored(gameSession: GameSession, config: GameConfig, ball: GameState['ball']) {
	const playerAObj = gameSession.players.get(gameSession.gameState.paddleA.userId);
	const playerBObj = gameSession.players.get(gameSession.gameState.paddleB.userId!);

	// Goal scored - left side
	if (ball.x <= config.ballsize / 2) {
		if (gameSession.gameState.paddleA.side === 'right')
			setScore(gameSession, playerAObj!, 'playerA');
		else 
			setScore(gameSession, playerBObj!, 'playerB');

		if (wonGame(gameSession, config))
			return;

		// console.log(`💥 BALL OUT LEFT : ballX=${ball.x} | ballY=${ball.y}`)
		service(gameSession);
		return;
	}
	
	// Goal scored - right side
	if (ball.x >= config.arenawidth - config.ballsize / 2) {
		if (gameSession.gameState.paddleA.side === 'left') 
			setScore(gameSession, playerAObj!, 'playerA');
		else
			setScore(gameSession, playerBObj!, 'playerB');

		if (wonGame(gameSession, config))
			return;
			
		// console.log(`💥 BALL OUT RIGHT : ballX=${ball.x} | ballY=${ball.y}`)
		service(gameSession);
		return;
	}
}

export const ballAlgo = {
	calculateWallCollision,
	calculatePaddleCollision,
	calculateScored,
	service
}