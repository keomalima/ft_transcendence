import { API_BASE_URL } from '../config.js';

export class GameConnection {
	private ws: WebSocket | null = null;

	connect(gameId: string, userId: string, scoreToWin: string) {
		const httpUrl = new URL(`/ws/game/${gameId}/${userId}/${scoreToWin}`, API_BASE_URL);
		httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(httpUrl.href);

		this.ws.onopen = () => {
			// console.log('🎮 Connected to game');
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
				// console.log('🚀 game starts');
				document.dispatchEvent(new CustomEvent('event-start-game', {
					detail: {
						gameId: data.gameId,
						position: data.position
					},
					bubbles: true
				}));
			} if (data.type === 'update_game') {
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
						winnerId: data.winnerId,
						playerinfo: data.currentPlayer,
						players: data.players
					},
					bubbles: true
				}));
			} if (data.type === 'abandoned-game') {
				if (!data.winnerId) {
					// console.log(`🚨 winnerId undefined`);
					return;
				}
				document.dispatchEvent(new CustomEvent('event-abandoned-game', {
					detail: {
						iswinner: data.iswinner,
						winnerId: data.winnerId,
						playerinfo: data.currentPlayer,
						players: data.players
					},
					bubbles: true
				}));
			} if (data.type === 'pause') {
				document.dispatchEvent(new CustomEvent('event-pause-game', {
					detail: {
						status: data.status
					},
					bubbles: true
				}));
			} if (data.type === 'player-disconnected') {
				document.dispatchEvent(new CustomEvent('event-player-disconnected', {
					detail: {
						disconnectedUserId: data.disconnectedUserId,
						timeoutSeconds: data.timeoutSeconds // Pass through the timeout from backend
					},
					bubbles: true
				}));
			} if (data.type === 'player-reconnected') {
				document.dispatchEvent(new CustomEvent('event-player-reconnected', {
					detail: {
						reconnectedUserId: data.reconnectedUserId
					},
					bubbles: true
				}));
			} if (data.type === 'already-in-game') {
				document.dispatchEvent(new CustomEvent('event-already-in-game', {
					bubbles: true
				}));
			}
		}
	}

	send(message: any) {
		if (this.ws && this.ws.readyState == WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			// console.log(`❌ Socket is NOT open. ReadyState: ${this.ws?.readyState}`);
		}
	}

	disconnect() {
		this.ws?.close();
		this.ws = null;
		// console.log('🎮 Disconnected from game');
	}

}