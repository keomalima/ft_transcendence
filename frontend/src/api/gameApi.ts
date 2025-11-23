const BASE_URL = 'http://localhost:3000/api/games';

import { GameData, GameToken } from "../types";

export const gameApi = {
	createGame: async (accessToken: string, type: string, scoreToWin: number): Promise<Partial<GameData>> => {
		const response = await fetch (`${BASE_URL}`, {
			method: 'POST',
			headers:{
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`},
			body: JSON.stringify({
				type: type,
				scoreToWin: scoreToWin
			})
		});
		if (!response.ok) {
			console.log('❌ Failed to create new game');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to create new game');
		}
		const result: Partial<GameData> = await response.json();
		console.log('🎮 createGame sucess ✅ ', result);
		return result;
	},

	getGame: async (accessToken: string, gameId: string): Promise<GameData> => {
		const response = await fetch (`${BASE_URL}/${gameId}`, {
			method: 'GET',
			headers:{
				'Authorization': `Bearer ${accessToken}`},
		});
		if (!response.ok) {
			console.log('❌ Failed to get game');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to get game');
		}
		const result: GameData = await response.json();
		console.log('🎮 getGame sucess ✅ ', result);
		return result;
	},

	generateToken: async (accessToken: string, gameId: string): Promise<GameToken> => {
		const response = await fetch (`${BASE_URL}/${gameId}/token`, {
			method: 'POST',
			headers:{
				'Authorization': `Bearer ${accessToken}`},
		});
		if (!response.ok) {
			console.log('❌ Failed to generate token');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to generate token');
		}
		const result: GameData = await response.json();
		console.log('🎮 generate token sucess ✅ ', result);
		return result;
	}
}
