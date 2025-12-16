import { AppContext, GameData, GameHistory, GameToken } from "../types";
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

	// generate token for game
	async generateToken(gameId: string, ctx: AppContext): Promise<GameToken | null> {
		const result = await gameApi.generateToken(gameId);

		if (result?.token) {
			ctx.gameStore.update((prevState) => ({
				...prevState,
				token: result.token
			}));
		}

		return result;
	}

	// join game with token
	async joinGame(gameToken: string, ctx: AppContext): Promise<{ id: string; gameId: string; userId: string } | null> {
		const result = await gameApi.joinGame(gameToken);

		if (result?.gameId) {
			ctx.gameStore.update((prevState) => ({
				...prevState,
				id: result.gameId
			}));
		}

		return result;
	}

	// start game
	async startGame(gameId: string, ctx: AppContext): Promise<Partial<any> | null> {
		const result = await gameApi.startGame(gameId);

		if (result) {
			ctx.gameStore.update((prevState) => ({
				...prevState,
				status: result.status ?? prevState.status,
				startedAt: result.startedAt ?? prevState.startedAt
			}));
		}

		return result;
	}

	// quit pending game
	async quitPendingGame(gameId: string, ctx: AppContext): Promise<void> {
		await gameApi.quitPendingGame(gameId);
		this.cleanGame(ctx);
	}

	// remove player from game
	async removePlayer(gameId: string, playerId: string, ctx: AppContext): Promise<void> {
		await gameApi.removePlayer(gameId, playerId);
		await this.getGame(gameId, ctx);
	}

	// get game by ID
	async getGame(gameId: string, ctx: AppContext): Promise<GameData | null> {
		const result = await gameApi.getGame(gameId);

		if (result) {
			ctx.gameStore.update((prevState) => ({
				...prevState,
				id: result.id ?? prevState.id,
				createdBy: result.createdBy ?? prevState.createdBy,
				type: result.type ?? prevState.type,
				status: result.status ?? prevState.status,
				scoreToWin: result.scoreToWin ?? prevState.scoreToWin,
				createdAt: result.createdAt ?? prevState.createdAt,
				updatedAt: result.updatedAt ?? prevState.updatedAt,
				tournamentId: result.tournamentId ?? prevState.tournamentId,
				startedAt: result.startedAt ?? prevState.startedAt,
				completedAt: result.completedAt ?? prevState.completedAt,
				gameUsers: result.gameUsers ?? prevState.gameUsers,
				token: result.token ?? prevState.token
			}));
		}

		return result;
	}

	// get current game for logged-in user
	async getCurrentGame(ctx: AppContext): Promise<{ userId: string; gameId: string; type: string; status: string; token: string | null } | null> {
		const result = await gameApi.getCurrentGame();

		if (result) {
			ctx.gameStore.update((prevState) => ({
				...prevState,
				id: result.gameId ?? prevState.id,
				type: result.type ?? prevState.type,
				status: result.status ?? prevState.status,
				token: result.token ?? prevState.token
			}));
		}

		return result;
	}

	// get game history
	async getHistory(): Promise<GameHistory[]> {
		return await gameApi.getHistory();
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
