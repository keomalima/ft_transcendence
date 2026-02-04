import { API_BASE_URL } from '../config.js';

export class TournamentWaitingRoomConnection {
	private ws: WebSocket | null = null;

	connect(tournamentId: string, userId: string,
		onUpdate: (tournamentData: any) => void,
		onRemoved: (participant: any) => void,
		onTournamentClosed: () => void,
		onStartTournament: () => void)
		{
		const httpUrl = new URL(`/ws/waiting-room/${tournamentId}/${userId}`, API_BASE_URL);
		httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(httpUrl.href);
		
		this.ws.onopen = () => {
			// console.log('🔌 Connected to tournament waiting room');
		}

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'room_update') {
				onUpdate(data);
			}
			if (data.type === 'player_remove' || data.type == 'player_quit') {
				// console.log('🚫 You have been removed from the tournament');
				onRemoved(data);
			}
			if (data.type === 'tournament_closed') {
				// console.log('🚫 The tournament has been closed');
				onTournamentClosed();
			}
			if (data.type === 'start_tournament') {
				// console.log('🎮 Tournament is starting!');
				onStartTournament();
			}
		}
		
		this.ws.onerror = (error) => {
			// console.error('❌ WebSocket error:', error);
		}

		this.ws.onclose = () => {
			// console.log('🔌 Disconnected from tournament waiting room');
		}
	}
	
	disconnect() {
		this.ws?.close();
		this.ws = null;
	}
}
