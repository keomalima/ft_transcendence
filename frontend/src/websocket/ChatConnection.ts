import { API_BASE_URL } from '../config.js';
import { ChatWsMessage } from '../types.js';

export class ChatConnection {
	private ws: WebSocket | null = null;

	connect(userId: string) {
		const url = new URL(`/ws/chat/${userId}`, API_BASE_URL);
		url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

		this.ws = new WebSocket(url.href);

		this.ws.onopen = () => {
			console.log('[Chat WS] ✅ Connected to backend');
		};

		this.ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data) as ChatWsMessage;

				switch (data.type) {
					case "connected":
						console.log("[Chat WS] ✅", data.message);
						break;

					case "new-messages": {
						console.log("[Chat WS] 🔔 New messages from:", data.fromUserIds);

						const key = `chat_unread_${userId}`;

						// 1. Read existing unread list
						let existing: string[] = [];
						try {
							const raw = localStorage.getItem(key);
							if (raw) {
								existing = JSON.parse(raw);
							}
						} catch {
							existing = [];
						}

						// 2. Merge (SET behavior)
						const merged = Array.from(
							new Set([...existing, ...data.fromUserIds])
						);

						// 3. Save back
						localStorage.setItem(key, JSON.stringify(merged));

						// 4. Notify UI
						window.dispatchEvent(
							new CustomEvent("chat-unread-updated", {
								detail: { userId }
							})
						);

						break;
					}

					case "chat-message":
						console.log("[Chat WS] 💬 Chat message:", data);

						// Forward this message to the UI
						const evt = new CustomEvent("ws-new-message", {
							detail: data,
						});
						window.dispatchEvent(evt);
						break;

					default:
						console.warn("[Chat WS] Unknown WS message:", data);
				}
			} catch (err) {
				console.error("[Chat WS] ❌ Failed to parse WS message:", event.data, err);
			}
		};


		this.ws.onerror = (err) => {
			console.error('[Chat WS] ❌ WebSocket error:', err);
		};

		this.ws.onclose = () => {
			console.log('[Chat WS] 🔌 Connection closed');
		};
	}

	send(message: any) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			console.warn('[Chat WS] ❌ Cannot send, socket not open');
		}
	}

	disconnect() {
		this.ws?.close();
		this.ws = null;
		console.log('[Chat WS] 🔌 Disconnected from backend');
	}
}

