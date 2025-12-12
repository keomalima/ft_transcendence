export interface GameState {
	paddleA: {y: number, userId: string, side: 'right' | 'left'};
	paddleB: {y: number, userId: string | undefined, side: 'right' | 'left'};
	ball: {x: number, y: number, velocityX: number, velocityY: number};
	score: {playerA: number, playerB: number};
	status: 'waiting' | 'playing' | 'finished' | 'abandoned';
	nextservice: 'playerA' | 'playerB';
}

export interface GameConfig {
	arenaheight: number;
	arenawidth: number;
	paddleheight: number;
	paddlewidth: number;
	paddlespeed: number;
	ballspeed: number;
	ballsize: number,
	scoreToWin: number;
}

export interface PlayerConnection {
	socket: WebSocket;
	userId: string;
	// displayname: string;
	isCreator: boolean;
	position: 'right' | 'left';
	input: {up: boolean, down: boolean};
	score: number
}

export interface GameSession {
	gameId: string;
	players: Map<string, PlayerConnection>; //userID - playerConnection
	gameState: GameState;
	gameConfig: GameConfig;
	gameLoop: NodeJS.Timeout | null;
	winnerNotified: boolean; // Flag to ensure notifyWonGame is called only once
	isPaused: boolean;
}