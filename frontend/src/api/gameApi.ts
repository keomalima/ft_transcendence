import httpCall from './httpClient.js';
import { GameData, GameHistory, GameState, GameToken } from '../types';
import { buildApiError } from './apiError.js';

const BASE_URL = '/games';

export interface CreateGameDto {
	scoreToWin: number | null;
	type: string | null;
}

interface FinishGamePlayerDto {
	userId: string;
	playerId: string;
	score: number;
}

export interface FinishGameDto {
	status: Exclude<GameState['status'], null>;
	gamePlayers: [FinishGamePlayerDto, FinishGamePlayerDto];
	winnerId: string
}

// response when creating a new game
export type CreateGameResp = Pick<GameState, 'id' | 'createdBy' | 'type' | 'status' | 'scoreToWin' >

// response when finishing a game
export type FinishGameResp = Pick<GameState, 'id' | 'createdBy' | 'type' | 'status' | 'gameUsers' | 'startedAt' | 'completedAt' >

export const gameApi = {
	createGame: async (data: CreateGameDto): Promise<CreateGameResp> => {
		try {
			const response = await httpCall.post<CreateGameResp>(`${BASE_URL}`, data);
			console.log('🎮 createGame sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('create new game', error);
		}
	},

	finishGame: async (gameId: string, data: FinishGameDto): Promise<FinishGameResp> => {
		try {
			const response = await httpCall.post<FinishGameResp>(`${BASE_URL}/${gameId}/finish`, data);
			console.log('🎮 finishGame sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('finish game', error);
		}
	},

	getGame: async (gameId: string): Promise<GameData> => {
		try {
			const response = await httpCall.get<GameData>(`${BASE_URL}/${gameId}`);
			console.log('🎮 getGame sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('get game', error);
		}
	},

	getCurrentGame: async (): Promise<{ userId: string; gameId: string; type: string; status: string; token: string | null }> => {
		try {
			const response = await httpCall.get<{ userId: string; gameId: string; type: string; status: string; token: string | null }>(`${BASE_URL}/current`);
			console.log('🎮 getCurrentGame sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('get current game', error);
		}
	},

	generateToken: async (gameId: string): Promise<GameToken> => {
		try {
			const response = await httpCall.post<GameToken>(`${BASE_URL}/${gameId}/token`);
			console.log('🎮 generate token sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('generate token', error);
		}
	},

	joinGame: async (gameToken: string): Promise<{ id: string; gameId: string; userId: string }> => {
		try {
			const response = await httpCall.post<{ id: string; gameId: string; userId: string }>(`${BASE_URL}/${gameToken}/join`);
			console.log('🎮 join game sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('join game', error);
		}
	},

	startGame: async (gameId: string): Promise<Partial<GameData>> => {
		try {
			const response = await httpCall.put<Partial<GameData>>(`${BASE_URL}/${gameId}/start`);
			console.log('🎮 start game sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('start game', error);
		}
	},

	quitPendingGame: async (gameId: string): Promise<void> => {
		try {
			await httpCall.delete(`${BASE_URL}/${gameId}`);
			console.log('🎮 quit / delete pending game sucess ✅ ');
		} catch (error) {
			throw buildApiError('quit / delete pending game', error);
		}
	},

	removePlayer: async (gameId: string, playerId: string): Promise<void> => {
		try {
			await httpCall.put(`${BASE_URL}/${gameId}/remove`, { playerId });
			console.log('🎮 remove player from game sucess ✅ ');
		} catch (error) {
			throw buildApiError('remove player from game', error);
		}
	},

	getHistory: async (): Promise<GameHistory[]> => {
		try {
			const response = await httpCall.get<GameHistory[]>(`${BASE_URL}/history`);
			console.log('🎮 Get Game history sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('get game history', error);
		}
	},
};
