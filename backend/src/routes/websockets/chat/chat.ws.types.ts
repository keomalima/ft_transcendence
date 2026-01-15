export type ChatWsMessage =
	| {
		type: "chat-message";
		fromUserId: string;
		content: string;
		sentAt: string;
		messageType: "TEXT";
	}
	| {
		type: "chat-message";
		fromUserId: string;
		content: string;
		sentAt: string;
		messageType: "GAME_INVITE";
		gameId: string;
	}
	| {
		type: "connected";
		message: string;
	};
