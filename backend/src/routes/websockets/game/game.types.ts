export interface GameState {
	paddleA: {y: number, userId: string};
	paddleB: {y: number, userId: string | undefined};
	ball: {x: number, y: number, velocityX: number, velocityY: number};
	score: {playerA: number, playerB: number};
	status: 'waiting' | 'playing' | 'finished';
}

export interface GameConfig {
	arenaheight: number;
	arenawidth: number;
	paddleheight: number;
	paddlespeed: number;
	ballspeed: number;
	scoreToWin: number;
}

export interface PlayerConnection {
	socket: WebSocket;
	userId: string;
	isCreator: boolean;
	position: 'right' | 'left';
	input: {up: boolean, down: boolean};
}

export interface GameSession {
	gameId: string;
	players: Map<string, PlayerConnection>; //userID - playerConnection
	gameState: GameState;
	gameConfig: GameConfig;
}