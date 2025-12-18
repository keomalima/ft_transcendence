import { getGameValue } from "./getGameValue.js";
import type { LocalGameData, MapKeys } from "../pages/LocalGame.js";

function calculatePaddle(game: LocalGameData, mapKeys: MapKeys) {
	const paddleRight = document.getElementById('paddleRight') as HTMLDivElement;
	const paddleLeft = document.getElementById('paddleLeft') as HTMLDivElement;

	const paddleSpeed = getGameValue.paddleSpeed();

	// --- LEFT PADDLE ---
	if (mapKeys.s) game.paddleL -= paddleSpeed;
	if (mapKeys.x) game.paddleL += paddleSpeed;

	if (game.paddleL < 0) game.paddleL = 0;
	if (game.paddleL > getGameValue.bottomLimit()) game.paddleL = getGameValue.bottomLimit();

	paddleLeft!.style.top = `${game.paddleL}px`;

	// --- RIGHT PADDLE ---
	if (mapKeys.up)   game.paddleR -= paddleSpeed;
	if (mapKeys.down) game.paddleR += paddleSpeed;

	if (game.paddleR < 0) game.paddleR = 0;
	if (game.paddleR > getGameValue.bottomLimit()) game.paddleR = getGameValue.bottomLimit();

	paddleRight!.style.top = `${game.paddleR}px`;
}

function calculateBall(game: LocalGameData) {
	const ball = game.ball;

	ball.x += ball.vx;
	ball.y += ball.vy;
	
	calculateWallCollision(game);

	calculatePaddleCollision(game);

	calculateScored(game);
}

function calculateWallCollision(game: LocalGameData) {
	const ball = game.ball;
	// Top wall collision
	if (ball.y <= getGameValue.ballSize() / 2) {
		ball.y = getGameValue.ballSize() / 2 + 0.1;
		ball.vy = -ball.vy; // Bounce
	}
	
	// Bottom wall collision
	if (ball.y >= getGameValue.arenaHeight() - getGameValue.ballSize() / 2) {
		ball.y = getGameValue.arenaHeight() - getGameValue.ballSize() / 2 - 0.1;
		ball.vy = -ball.vy; // Bounce
	}
}

function calculatePaddleCollision(game: LocalGameData) {
	const ball = game.ball;

	const gap = getGameValue.ballSize() / 2 + getGameValue.paddleWidth(); // = paddle width + half of ball size

	// Left paddle collision
	if (ball.x <= gap && ball.vx < 0) { // Ball x collision on left side and moving left
		if (ball.y >= game.paddleL && ball.y <= game.paddleL + getGameValue.paddleHeight()) { // Ball y is within paddle range
			// console.log(`🏓 BALL HIT LEFT : ballX=${ball.x} | ballY=${ball.y}`)

			// Calculate relative hit position on paddle (0 to 1, where 0.5 is center)
			const relativeHitY = (ball.y - game.paddleL) / getGameValue.paddleHeight();

			// Adjust velocityY based on where ball hit the paddle
			// Hit at center (0.5) = no Y change, hit at edges = max Y change
			const yInfluence = (relativeHitY - 0.5) * 2; // Range from -1 to 1
			ball.vy = yInfluence * Math.abs(ball.vx);

			// Reverse X direction
			ball.vx = -ball.vx;
			
			// Normalize to maintain constant speed (use dynamic speed)
			const speed = getGameValue.ballSpeed();
			const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
			ball.vx = (ball.vx / currentSpeed) * speed;
			ball.vy = (ball.vy / currentSpeed) * speed;

			return;
		}
	}
	
	// Right paddle collision
	if (ball.x >= getGameValue.arenaWidth() - gap  && ball.vx > 0) { // Ball x collision on right side and moving right
		if (ball.y >= game.paddleR && ball.y <= game.paddleR + getGameValue.paddleHeight()) { // Ball y is within paddle range
			// console.log(`🏓 BALL HIT RIGHT : ballX=${ball.x} | ballY=${ball.y}`)
			
			// Calculate relative hit position on paddle (0 to 1, where 0.5 is center)
			const relativeHitY = (ball.y - game.paddleR) / getGameValue.arenaHeight();
			
			// Adjust velocityY based on where ball hit the paddle
			// Hit at center (0.5) = no Y change, hit at edges = max Y change
			const yInfluence = (relativeHitY - 0.5) * 2; // Range from -1 to 1
			ball.vy = yInfluence * Math.abs(ball.vx);
			
			// Reverse X direction
			ball.vx = -ball.vx;
			
			// Normalize to maintain constant speed (use dynamic speed)
			const speed = getGameValue.ballSpeed();
			const currentSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
			ball.vx = (ball.vx / currentSpeed) * speed;
			ball.vy = (ball.vy / currentSpeed) * speed;

			return;
		}
	}

}

function calculateScored(game: LocalGameData) {
	const ball = game.ball;

	// Goal scored - left side
	if (ball.x <= getGameValue.ballSize() / 2) {
		game.scoreR++;
		game.nextService = 'left';
		if (wonGame(game))
			return;
		service(game);
		return;
	}
	
	// Goal scored - right side
	if (ball.x >= getGameValue.arenaWidth()- getGameValue.ballSize() / 2) {
		game.scoreL++;
		game.nextService = 'right';
		if (wonGame(game))
			return;
		service(game);
		return;
	}
}

function wonGame(game: LocalGameData): boolean {
	if (game.scoreL >= game.scoreToWin || game.scoreR >= game.scoreToWin) {
		initBall(game);
		game.status = 'finished';
		console.log('🏆 Game finished, status set to finished');
		window.dispatchEvent(new CustomEvent('event-game-completed', {
			detail: { finalGame: game }
		}));
		return true;
	}
	return false;
}

function initBall(game: LocalGameData) {
	// Stop the ball immediately
	game.ball.vx = 0;
	game.ball.vy = 0;

	// Reset ball to center
	game.ball.x = getGameValue.arenaWidth() / 2;
	game.ball.y = getGameValue.arenaHeight() / 2;

	const ball = document.getElementById('ball') as HTMLDivElement;
	ball.style.left = `${game.ball.x}px`;
	ball.style.top = `${game.ball.y}px`;
}

function service(game: LocalGameData) {

	// Stop the ball immediately
	game.ball.vx = 0;
	game.ball.vy = 0;

	// Reset ball to center
	game.ball.x = getGameValue.arenaWidth() / 2;
	game.ball.y = getGameValue.arenaHeight() / 2;

	// console.log(`🥎 ball centered : x=${game.ball.x} | y=${game.ball.y}`);

	// Wait before serving
	setTimeout(() => {
		if (game.isPaused) {
			return;
		}

		// Random direction
		game.nextService === 'left' ? game.ball.vx = 1 : game.ball.vx = -1;
		game.ball.vy = getRandom(-1, 1);
		
		// Normalize to constant speed (use dynamic speed)
		const speed = getGameValue.ballSpeed();
		const currentSpeed = Math.sqrt(game.ball.vx ** 2 + game.ball.vy ** 2);
		game.ball.vx = (game.ball.vx / currentSpeed) * speed;
		game.ball.vy = (game.ball.vy / currentSpeed) * speed;

		// console.log(`🏓 Service complete - Ball velocity: X=${game.ball.vx.toFixed(2)} | Y=${game.ball.vy.toFixed(2)}`);
	}, 2000);
}

// ======== UTILS ============
function getRandom(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export const calculateGame = {
	service,
	calculateBall,
	calculatePaddle
}