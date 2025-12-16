function arenaHeight(): number
{
	const gameArea = document.getElementById("arena")
	return (gameArea!.clientHeight);
}

function arenaWidth(): number
{
	const gameArea = document.getElementById("arena")
	return (gameArea!.clientWidth);
}

function paddleHeight(): number
{
	const paddleLeft = document.getElementById('paddleLeft');
	return (paddleLeft!.clientHeight);
}

function paddleWidth(): number
{
	const paddleLeft = document.getElementById('paddleLeft');
	return (paddleLeft!.clientWidth);
}


function bottomLimit(): number {
	return (arenaHeight() - paddleHeight());
}

function ballSize(): number {
	const ball = document.getElementById('ball');
	return (ball!.clientWidth);
}

export const getGameValue = {
	arenaHeight,
	arenaWidth,
	paddleHeight,
	paddleWidth,
	bottomLimit,
	ballSize
}