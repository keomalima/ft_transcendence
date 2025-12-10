import { AppContext } from "../types";
import { CreateGameDto, CreateGameResp, FinishGameDto, FinishGameResp, gameApi } from "../api/gameApi.js";

class GameService {
	// create game
	async createGame(data: CreateGameDto, ctx: AppContext): Promise<CreateGameResp | null>{
		
		const result = await gameApi.createGame(data);

		ctx.gameStore.update((prevState) => ({
			...prevState,
			id: result?.id ?? null,
			createdBy: result?.createdBy ?? null,
			type: result?.type ?? null,
			status: result?.status ?? null,
			scoreToWin: result?.scoreToWin ?? null
		}));
		
		return result;
	}

	async finishGame(gameId: string, data: FinishGameDto, ctx: AppContext): Promise<FinishGameResp | null> {
		const result = await gameApi.finishGame(gameId, data);

		ctx.gameStore.update((prevState) => ({
			...prevState,
			id: result?.id ?? prevState.id,
			createdBy: result?.createdBy ?? prevState.createdBy,
			type: result?.type ?? prevState.type,
			status: result?.status ?? prevState.status,
			startedAt: result?.startedAt ?? prevState.startedAt,
			completedAt: result?.completedAt ?? prevState.completedAt,
			gameUsers: result?.gameUsers ?? prevState.gameUsers
		}));

		return result;
	}

	// clean game store
	cleanGame(ctx: AppContext): void {
		ctx.gameStore.set({
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
		});
	}
}

export const gameService = new GameService();
