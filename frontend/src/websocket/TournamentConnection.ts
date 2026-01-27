import { API_BASE_URL } from '../config.js';

export class TournamentWsConnection {
	private ws: WebSocket | null = null;

	connect(tournamentId: string, userId: string,
		onUpdate: (tournamentData: any) => void,
		opponentReady: (game: any) => void,
		onStartGame: (game: any) => void,
		onStartTournament: () => void,
		onTournamentEnd: (game: any) => void)
		{
		const httpUrl = new URL(`/ws/tournament/${tournamentId}/${userId}`, API_BASE_URL);
		httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(httpUrl.href);
		
		this.ws.onopen = () => {
			//console.log('🔌 Connected to tournament room');
		}

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'tournament_update') {
				//console.log('New tournament update');
				onUpdate(data);
			}
			if (data.type == 'opponent_ready') {
				//console.log('A player is ready to play the game');
				opponentReady(data);
			}
			if (data.type == 'start_game') {
				//console.log('The game will start..');
				onStartGame(data);
			}
			if (data.type === 'start_tournament') {
				//console.log('The tournament has started');
				onStartTournament();
			}
			if (data.type === 'tournament_ended') {
				//console.log('🚫 The tournament has finished');
				onTournamentEnd(data);
			}
		}
		
		this.ws.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
		}

		this.ws.onclose = () => {
			//console.log('🔌 Disconnected from tournament room');
		}
	}
	
	disconnect() {
		this.ws?.close();
		this.ws = null;
	}
}
