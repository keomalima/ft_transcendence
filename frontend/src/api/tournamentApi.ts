import httpCall from './httpClient.js';
import { TournamentData } from '../types';
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

	getTournament: async (tournamentId: string): Promise<TournamentData> => {
		try {
			const response = await httpCall.get<TournamentData>(`${BASE_URL}/${tournamentId}`);
			console.log('🎮 getTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('get tournament', error);
		}
	},
};
