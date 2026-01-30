import httpCall from './httpClient.js';
import { CurrentTournamentInfo, GameToken, TournamentData, TournamentGame, TournamentParticipant } from '../types';
import { buildApiError } from './apiError.js';

const BASE_URL = '/tournaments';

export const tournamentApi = {
	createTournament: async (numberPlayers: number, scoreToWin: number): Promise<Partial<TournamentData>> => {
		try {
			const response = await httpCall.post<Partial<TournamentData>>(`${BASE_URL}`, {
				numberPlayers,
				scoreToWin
			});
			// console.log('🎮 createTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('create new tournament', error);
		}
	},

	startTournament: async (tournamentId: string): Promise<Partial<TournamentData>> => {
		try {
			const response = await httpCall.put<Partial<TournamentData>>(`${BASE_URL}/${tournamentId}/start`);
			// console.log('🎮 start tournament sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('start tournament', error);
		}
	},

	startGame: async (gameId: string): Promise<Partial<TournamentData>> => {
		try {
			const response = await httpCall.put<Partial<TournamentData>>(`${BASE_URL}/${gameId}/start-game`);
			// console.log('🎮 start tournament game sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('start tournament game', error);
		}
	},
	
	getParticipantInfo: async (tournamentId: string): Promise<Partial<TournamentParticipant>> => {
		try {
			const response = await httpCall.get<Partial<TournamentData>>(`${BASE_URL}/${tournamentId}/participant`);
			// console.log('🎮 got participant info success ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('get participant info', error);
		}
	},

	getTournament: async (tournamentId: string): Promise<TournamentData> => {
		try {
			const response = await httpCall.get<TournamentData>(`${BASE_URL}/${tournamentId}`);
			// console.log('🎮 getTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('get tournament', error);
		}
	},

	resetTournament: async (tournamentId: string): Promise<TournamentData> => {
		try {
			const response = await httpCall.put<TournamentData>(`${BASE_URL}/${tournamentId}/reset`);
			// console.log('🎮 resetTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error: unknown) {
			throw buildApiError('get tournament', error);
		}
	},

	getCurrentTournament: async (): Promise<CurrentTournamentInfo> => {
		try {
			const response = await httpCall.get<CurrentTournamentInfo>(`${BASE_URL}/current`);
			// console.log('🎮 getCurrentTournament sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('get current tournament', error);
		}
	},

	generateToken: async (tournamentId: string): Promise<GameToken> => {
		try {
			const response = await httpCall.post<GameToken>(`${BASE_URL}/${tournamentId}/token`);
			// console.log('🎮 generate token sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('generate token', error);
		}
	},

	joinTournament: async (tournamentToken: string): Promise<{ id: string; tournamentId: string; userId: string }> => {
		try {
			const response = await httpCall.post<{ id: string; tournamentId: string; userId: string }>(`${BASE_URL}/${tournamentToken}/join`);
			// console.log('🎮 join tournament sucess ✅ ', response.data);
			return response.data;
		} catch (error) {
			throw buildApiError('join tournament', error);
		}
	},

	removePlayer: async (tournamentId: string, playerId: string): Promise<void> => {
		try {
			await httpCall.put(`${BASE_URL}/${tournamentId}/remove`, { playerId });
			// console.log('🎮 remove player from tournament sucess ✅ ');
		} catch (error) {
			throw buildApiError('remove player tournament game', error);
		}
	},

	quitTournament: async (tournamentId: string): Promise<void> => {
		try {
			await httpCall.delete(`${BASE_URL}/${tournamentId}`);
			// console.log('🎮 quit / delete pending tournament sucess ✅ ');
		} catch (error) {
			throw buildApiError('quit / delete pending tournament', error);
		}
	},

	quitActiveTournament: async (tournamentId: string): Promise<void> => {
		try {
			await httpCall.put(`${BASE_URL}/${tournamentId}/quit`);
			// console.log('🎮 quit active tournament sucess ✅ ');
		} catch (error) {
			throw buildApiError('quit active tournament', error);
		}
	},

	getTournamentGames: async (tournamentId: string): Promise<TournamentGame[]> => {
		try {
			const response = await httpCall.get(`${BASE_URL}/${tournamentId}/tournament-games`);
			// console.log('🎮 tournament games sucess ✅ ');
			return response.data;
		} catch (error) {
			throw buildApiError('tournament games', error);
		}
	},

	advanceTournament: async (tournamentId: string): Promise<void> => {
		try {
			await httpCall.post(`${BASE_URL}/${tournamentId}/advance-tournament`)
		} catch (error) {
			throw buildApiError('advance tournament', error);
		}
	}	
};
