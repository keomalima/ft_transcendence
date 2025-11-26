export class WaitingRoomConnection {
	private ws: WebSocket | null = null;

	connect(gameId: string, onUpdate: (gameData: any) => void) {
		this.ws = new WebSocket(`wss://localhost:8443/ws/waiting-room/${gameId}`);
		
		this.ws.onopen = () => {
			console.log('🔌 Connected to waiting room');
		}

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'room_update') {
				onUpdate(data);
			}
		}
		
		this.ws.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
		}

		this.ws.onclose = () => {
			console.log('🔌 Disconnected from waiting room');
		}
	}
	
	disconnect() {
        this.ws?.close();
        this.ws = null;
    }
}