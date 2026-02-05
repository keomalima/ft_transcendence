import type { GameConnection } from "../websocket/GameConnection.js";

export const sharedGameState = {
	gameConnection: null as GameConnection | null,
	isFinishingGame: false
};

export function setGameConnection(conn: GameConnection | null) {
	sharedGameState.gameConnection = conn;
}
