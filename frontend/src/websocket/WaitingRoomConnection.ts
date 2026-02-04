import { API_BASE_URL } from '../config.js';

export class WaitingRoomConnection {
	private ws: WebSocket | null = null;

	connect(gameId: string, userId: string,
		onUpdate: (gameData: any) => void,
		onRemoved: () => void,
		onGameClosed: () => void,
		onStartGame: () => void)
		{
		const httpUrl = new URL(`/ws/waiting-room/${gameId}/${userId}`, API_BASE_URL);
		httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(httpUrl.href);
		
		this.ws.onopen = () => {
			// console.log('🔌 Connected to waiting room');
		}

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'room_update') {
				onUpdate(data);
			}
			if (data.type === 'player_remove') {
				// console.log('🚫 You have been removed from the game');
				onRemoved();
			}
			if (data.type === 'game_closed') {
				// console.log('🚫 Your game has been closed');
				onGameClosed();
			}
			if (data.type === 'start_game') {
				// console.log('🔌 Your game just starts');
				onStartGame();
			}
		}
		
		this.ws.onerror = (error) => {
			// console.error('❌ WebSocket error:', error);
		}

		this.ws.onclose = () => {
			// console.log('🔌 Disconnected from waiting room');
		}
	}
	
	disconnect() {
        this.ws?.close();
        this.ws = null;
    }
}
