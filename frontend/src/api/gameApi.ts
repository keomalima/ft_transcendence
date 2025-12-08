import { API_BASE_URL } from '../config.js';

const BASE_URL = `${API_BASE_URL}/api/games`; // localhost:3000 in dev, proxied /api in prod

import { GameData, GameToken, GameHistory } from "../types";

export const gameApi = {
	createGame: async (type: string, scoreToWin: number): Promise<Partial<GameData>> => {
		const response = await fetch (`${BASE_URL}`, {
			method: 'POST',
			credentials: 'include',
			headers:{
				'Content-Type': 'application/json'
			},
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

	getGame: async (gameId: string): Promise<GameData> => {
		const response = await fetch (`${BASE_URL}/${gameId}`, {
			method: 'GET',
			credentials: 'include',
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

	getCurrentGame: async (): Promise<{userId: string, gameId: string, type: string, status: string, token: string | null}> => {
		const response = await fetch (`${BASE_URL}/current`, {
			method: 'GET',
			credentials: 'include',
		});
		if (!response.ok) {
			console.log('❌ Failed to get current game');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to get current game');
		}
		const result = await response.json();
		console.log('🎮 getCurrentGame sucess ✅ ', result);
		return result;
	},

	generateToken: async (gameId: string): Promise<GameToken> => {
		const response = await fetch (`${BASE_URL}/${gameId}/token`, {
			method: 'POST',
			credentials: 'include',
		});
		if (!response.ok) {
			console.log('❌ Failed to generate token');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to generate token');
		}
		const result: GameData = await response.json();
		console.log('🎮 generate token sucess ✅ ', result);
		return result;
	},

	joinGame: async (gameToken: string): Promise<{id: string, gameId: string, userId: string}> => {
		const response = await fetch (`${BASE_URL}/${gameToken}/join`, {
			method: 'POST',
			credentials: 'include',
		});
		if (!response.ok) {
			console.log('❌ Failed to join game');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to join game');
		}
		const result: {id: string, gameId: string, userId: string} = await response.json();
		console.log('🎮 join game sucess ✅ ', result);
		return result;
	},

	startGame: async (gameId: string): Promise<Partial<GameData>> => {
		const response = await fetch (`${BASE_URL}/${gameId}/start`, {
			method: 'PUT',
			credentials: 'include',
		});
		if (!response.ok) {
			console.log('❌ Failed to start game');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to start game');
		}
		const result: Partial<GameData> = await response.json();
		console.log('🎮 start game sucess ✅ ', result);
		return result;
	},

	quitPendingGame: async (gameId: string): Promise<void> => {
		const response = await fetch (`${BASE_URL}/${gameId}`, {
			method: 'DELETE',
			credentials: 'include',
		});
		if (!response.ok) {
			console.log('❌ Failed to quit / delete pending game');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to quit / delete pending game');
		}
		console.log('🎮 quit / delete pending game sucess ✅ ');
	},

	removePlayer: async (gameId: string, playerId: string): Promise<void> => {
		const response = await fetch (`${BASE_URL}/${gameId}/remove`, {
			method: 'PUT',
			credentials: 'include',
			headers:{
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				playerId: playerId
			}),
		});
		if (!response.ok) {
			console.log('❌ Failed to remove player from game');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to remove player from game');
		}
		console.log('🎮 remove player from game sucess ✅ ');
	},

	getHistory: async (): Promise<GameHistory[]> => {
		const response = await fetch (`${BASE_URL}/history`, {
			method: 'GET',
			credentials: 'include',
		});
		if (!response.ok) {
			console.log('❌ Failed to get game history');
			const errorData = await response.json().catch(() => ({ message: response.statusText }));
			throw new Error(errorData.message || 'Failed to get game history');
		}
		const result: GameHistory[] = await response.json();
		console.log('🎮 Get Game history sucess ✅ ', result);
		return result;
	},
}
