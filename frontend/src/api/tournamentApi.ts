import httpCall from './httpClient.js';
import { GameToken, TournamentData, TournamentGame } from '../types';
import { buildApiError } from './apiError.js';

const BASE_URL = '/tournaments';

export const tournamentApi = {
	createTournament: async (numberPlayers: number, scoreToWin: number): Promise<Partial<TournamentData>> => {
		try {
			const response = await httpCall.post<Partial<TournamentData>>(`${BASE_URL}`, {
				numberPlayers,
				scoreToWin
			});
			console.log('🎮 createTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('create new tournament', error);
		}
	},

	startTournament: async (tournamentId: string): Promise<Partial<TournamentData>> => {
		try {
			const response = await httpCall.put<Partial<TournamentData>>(`${BASE_URL}/${tournamentId}/start`);
			console.log('🎮 start tournament sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('start tournament', error);
		}
	},

	matchMaking: async (tournamentId: string): Promise<Partial<TournamentData>> => {
		try {
			const response = await httpCall.post<Partial<TournamentData>>(`${BASE_URL}/${tournamentId}/match-make`);
			console.log('🎮 match making sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('match making', error);
		}
	},

	getTournament: async (tournamentId: string): Promise<TournamentData> => {
		try {
			const response = await httpCall.get<TournamentData>(`${BASE_URL}/${tournamentId}`);
			console.log('🎮 getTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('get tournament', error);
		}
	},

	getCurrentTournament: async (): Promise<{ userId: string; tournamentId: string; type: string; token: string | null }> => {
		try {
			const response = await httpCall.get<{ userId: string; tournamentId: string; type: string; token: string | null }>(`${BASE_URL}/current`);
			console.log('🎮 getCurrentTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('get current tournament', error);
		}
	},

	generateToken: async (tournamentId: string): Promise<GameToken> => {
		try {
			const response = await httpCall.post<GameToken>(`${BASE_URL}/${tournamentId}/token`);
			console.log('🎮 generate token sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('generate token', error);
		}
	},

	joinTournament: async (tournamentToken: string): Promise<{ id: string; tournamentId: string; userId: string }> => {
		try {
			const response = await httpCall.post<{ id: string; tournamentId: string; userId: string }>(`${BASE_URL}/${tournamentToken}/join`);
			console.log('🎮 join tournament sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('join tournament', error);
		}
	},

	removePlayer: async (tournamentId: string, playerId: string): Promise<void> => {
		try {
			await httpCall.put(`${BASE_URL}/${tournamentId}/remove`, { playerId });
			console.log('🎮 remove player from tournament sucess ✅ ');
		} catch (error) {
			throw buildApiError('remove player tournament game', error);
		}
	},

	quitTournament: async (tournamentId: string): Promise<void> => {
		try {
			await httpCall.delete(`${BASE_URL}/${tournamentId}`);
			console.log('🎮 quit / delete pending tournament sucess ✅ ');
		} catch (error) {
			throw buildApiError('quit / delete pending tournament', error);
		}
	},

	getTournamentGames: async (tournamentId: string): Promise<TournamentGame> => {
		try {
			const response = await httpCall.get(`${BASE_URL}/${tournamentId}/tournament-games`);
			console.log('🎮 tournament games sucess ✅ ');
			return response.data;
		} catch (error) {
			throw buildApiError('tournament games', error);
		}
	}
	
};
