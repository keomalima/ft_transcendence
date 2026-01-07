import { API_BASE_URL } from '../config.js';

export class TournamentWsConnection {
	private ws: WebSocket | null = null;

	connect(tournamentId: string, userId: string,
		onUpdate: (tournamentData: any) => void,
		onQuit: () => void,
		onTournamentEnd: () => void)
		{
		const httpUrl = new URL(`/ws/tournament/${tournamentId}/${userId}`, API_BASE_URL);
		httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(httpUrl.href);
		
		this.ws.onopen = () => {
			console.log('🔌 Connected to tournament room');
		}

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'tournament_update') {
				onUpdate(data);
			}
			if (data.type === 'player_quit') {
				console.log('🚫 A player quitted the tournament');
				onQuit();
			}
			if (data.type === 'tournament_closed') {
				console.log('🚫 The tournament has finished');
				onTournamentEnd();
			}
		}
		
		this.ws.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
		}

		this.ws.onclose = () => {
			console.log('🔌 Disconnected from tournament waiting room');
		}
	}
	
	disconnect() {
		this.ws?.close();
		this.ws = null;
	}
}
