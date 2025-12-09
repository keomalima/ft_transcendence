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
			}
			if (data.type === 'update_game') {
				const left = data.left;
				const right = data.right;
				// console.log(`🔃 update game [L:${left}, R:${right}]`);
				document.dispatchEvent(new CustomEvent('event-update-game', {
					detail: {
						leftPaddle: left,
						rightPaddle: right
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