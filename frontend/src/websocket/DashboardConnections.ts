import { API_BASE_URL } from '../config.js';

export class DashboardConnection {
	private ws: WebSocket | null = null;

	connect(
		userId: string,
		onNewFriendRequest: (friendRequest: any) => void,
		onAcceptFriend: (friend: any) => void
	){
		const httpUrl = new URL(`/ws/dashboard/${userId}`, API_BASE_URL);
		httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(httpUrl.href);

		this.ws.onopen = () => {
			console.log('🔌 Connected to dashboard');
		};

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'friendship-request') {
				onNewFriendRequest(data);
			}
			if (data.type === 'friendship-approved') {
				onAcceptFriend(data);
			}
		}
		
		this.ws.onclose = () => {
			console.log('🔌 Disconnected from dashboard');
		}
	}
	
	disconnect() {
		this.ws?.close();
		this.ws = null;
	}
}
