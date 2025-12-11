import { API_BASE_URL } from '../config.js';

export class GameConnection {
	private ws: WebSocket | null = null;

	connect(gameId: string, userId: string) {
		const httpUrl = new URL(`/ws/game/${gameId}/${userId}`, API_BASE_URL);
		httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(httpUrl.href);

		this.ws.onopen = () => {
			console.log('🎮 Connected to game');
		}

		this.ws.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
		}

		this.ws.onclose = () => {
			console.log('🎮 Disconnected from game');
		}

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type == 'start-game') {
				console.log('🚀 game starts');
				document.dispatchEvent(new CustomEvent('event-start-game', {
					detail: {
						gameId: data.gameId,
						position: data.position
					},
					bubbles: true
				}));
			} if (data.type === 'update_game') {
				// console.log(`🔃 update game [L:${left}, R:${right}]`);
				document.dispatchEvent(new CustomEvent('event-update-game', {
					detail: {
						left: data.left,
						right: data.right,
						ballX: data.ballX,
						ballY: data.ballY
					},
					bubbles: true
				}));
			} if (data.type === 'service') {
				document.dispatchEvent(new CustomEvent('event-service-countdown', {
					detail: {
						count: 3
					},
					bubbles: true
				}));
			} if (data.type === 'won-game') {
				document.dispatchEvent(new CustomEvent('event-won-game', {
					detail: {
						iswinner: data.iswinner,
						playerinfo: data.playerinfo
					},
					bubbles: true
				}));
				
			}
		}
	}

	send(message: any) {
		if (this.ws && this.ws.readyState == WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			console.log(`❌ Socket is NOT open. ReadyState: ${this.ws?.readyState}`);
		}
	}

	disconnect() {
		this.ws?.close();
		this.ws = null;
	}

}