import { GameState } from "../types";

export interface GameStore {
  init(value: GameState | null): void;
  get(): GameState | null;
  set(value: GameState | null): void;
  update(updater: (prev: GameState) => GameState | null): void;
}

export function createGameStore(initial: GameState | null): GameStore {
	let state = initial;

	const emptyState: GameState = {
		id: null,
		token: null,
		scoreToWin: null,
		createdAt: null,
		updatedAt: null,
		tournamentId: null,
		status: null,
		type: null,
		roundNumber: null,
		matchNumber: null,
		startedAt: null,
		completedAt: null,
		gameUsers: null,
		createdBy: null
	};

	return {
		init(value) {
			this.set(value ?? emptyState);
		},
		get() {
			return state;
		},
		set(value) {
			state = value;
		},
		update(updater) {
			if (state === null) state = emptyState;
			state = updater(state);
		},
	};
}