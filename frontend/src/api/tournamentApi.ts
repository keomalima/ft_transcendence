import { API_BASE_URL } from '../config.js';

const BASE_URL = `${API_BASE_URL}/api/tournaments`; // localhost:3000 in dev, proxied /api in prod

import { TournamentData } from "../types";

export const tournamentApi = {
	createTournament: async (accessToken: string, numberPlayers: number, scoreToWin: number): Promise<Partial<TournamentData>> => {
		const response = await fetch (`${BASE_URL}`, {
			method: 'POST',
			headers:{
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`},
			body: JSON.stringify({
				numberPlayers,
				scoreToWin
			})
		});
		if (!response.ok) {
			console.log('❌ Failed to create new tournament');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to create new tournament');
		}
		const result: Partial<TournamentData> = await response.json();
		console.log('🎮 createTournament sucess ✅ ', result);
		return result;
	},

	getTournament: async (accessToken: string, tournamentId: string): Promise<TournamentData> => {
		const response = await fetch (`${BASE_URL}/${tournamentId}`, {
			method: 'GET',
			headers:{
				'Authorization': `Bearer ${accessToken}`},
		});
		if (!response.ok) {
			console.log('❌ Failed to get tournament');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to get tournament');
		}
		const result: TournamentData = await response.json();
		console.log('🎮 getTournament sucess ✅ ', result);
		return result;
	},
}