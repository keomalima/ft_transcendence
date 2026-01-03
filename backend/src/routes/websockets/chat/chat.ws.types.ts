export type ChatWsMessage =
	| {
		type: "chat-message";
		fromUserId: string;
		content: string;
		sentAt: string;
	}
	| {
		type: "connected";
		message: string;
	};
