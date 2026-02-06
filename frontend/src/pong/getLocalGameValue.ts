function arenaHeight(): number
{
	const gameArea = document.getElementById("arena")
	if (!gameArea) return 0;
	return (gameArea.clientHeight);
}

function arenaWidth(): number
{
	const gameArea = document.getElementById("arena")
	if (!gameArea) return 0;
	return (gameArea.clientWidth);
}

function paddleHeight(): number
{
	const paddleLeft = document.getElementById('paddleLeft');
	if (!paddleLeft) return 0;
	return (paddleLeft.clientHeight);
}

function paddleWidth(): number
{
	const paddleLeft = document.getElementById('paddleLeft');
	if (!paddleLeft) return 0;
	return (paddleLeft.clientWidth);
}


function bottomLimit(): number {
	return (arenaHeight() - paddleHeight());
}

function ballSize(): number {
	const ball = document.getElementById('ball');
	if (!ball) return 0;
	return (ball.clientWidth);
}

function ballSpeed(): number {
	// Ball takes approximately 2 seconds to cross the arena at 60fps
	// speed = arenaWidth / (targetSeconds * fps)
	return arenaWidth() / (2 * 60);
}

function paddleSpeed(): number {
	// Paddle can move from top to bottom in approximately 1.5 seconds at 60fps
	return arenaHeight() / (1.5 * 60);
}

export const getGameValue = {
	arenaHeight,
	arenaWidth,
	paddleHeight,
	paddleWidth,
	bottomLimit,
	ballSize,
	ballSpeed,
	paddleSpeed
}