==============================
Live Chat WebSocket
==============================

1. WebSocket Creation (Frontend)

- In LiveChat.ts, when the user enters the Live Chat page:
  - A new WebSocket connection is created via:
        new WebSocket(url)

- This WebSocket exists on the FRONTEND side.
- It allows the frontend to:
  - send messages to the backend
  - receive messages pushed by the backend in real time

------------------------------------------------

2. WebSocket Routing (Backend)

- The backend registers a WebSocket route:
        /ws/chat/:userId

- When the frontend creates:
        new WebSocket("ws://backend/ws/chat/<userId>")
  the backend route is automatically triggered.

- Fastify + @fastify/websocket:
  - upgrades the HTTP request to a WebSocket
  - injects two parameters into the handler:
        - connection: SocketStream  (the WebSocket)
        - request: FastifyRequest  (HTTP request, params, headers)

------------------------------------------------

3. chatHandler() Execution (Backend)

- chatHandler() receives:
        connection → the live WebSocket stream
        request → contains params like userId

- Backend logic:
  - Extract userId from request.params
  - Store the WebSocket in a Map:
        Map<userId, SocketStream>

- This Map represents:
  - all ONLINE users
  - their active WebSocket connections

------------------------------------------------

4. Sending Messages (Backend → Frontend)

- Because the backend stored:
        userId → SocketStream
  it can later do:

        connection.socket.send(JSON.stringify(...))

- This sends data directly to the specific frontend user.

------------------------------------------------

5. Receiving Messages (Frontend)

- Frontend listens using:
        ws.onmessage = (event) => { ... }

- event.data contains:
  - the message sent by backend
  - usually JSON string

------------------------------------------------

6. Page Navigation & Cleanup

- When user leaves Live Chat:
  - cleanLiveChatWS() is called (in router.ts)

- Backend receives the "close" event:
  - removes user from Map

- When user comes back:
  - old socket is gone
  - new WebSocket is created
  - backend stores the new connection again
!!! check with Lytha: for Game: if close the tab, whether the WS is closed like the ChatRoom

------------------------------------------------

7. Key Mental Model

- Frontend:
  - creates WebSocket
  - owns the browser-side socket

- Backend:
  - does NOT create WebSockets manually
  - receives them automatically via Fastify
  - stores sockets to talk back to users

- WebSocket = persistent pipe
  - not request/response
  - backend can push messages anytime

------------------------------------------------

8. Why This Design Works

- Backend is the single source of truth
- Real-time delivery without polling
- Supports:
  - offline detection
  - message delivery
  - block/unblock updates
  - notifications
  - multiple users

==============================

## 💬 Live Chat Architecture – WebSocket + HTTP Message Flow

This system follows real-world messaging logic used by Discord, WhatsApp, etc.

### 🔄 Protocol roles

- **WebSocket**: used only for real-time **delivery**
- **HTTP**: used for sending messages and handling all **business logic**

---

### 📡 1. WebSocket Setup (Client ↔ Server)

```ts
// Client (browser)
const socket = new WebSocket("wss://your-app.com/ws/chat/:userId");

// Server (Fastify WS route)
const chatConnections = new Map<string, SocketStream>();

export const ChatWsController = {
	async chatHandler(
		connection: SocketStream,
		request: FastifyRequest<{ Params: { userId: string } }>
	) {
		const userId = request.params.userId;
		// console.log(`User ${userId} connected to chat.`);

		// Store this user's connection
		chatConnections.set(userId, connection);

		// Send connection confirmation
		connection.send(JSON.stringify({
			type: "connected",
			message: "Chat WebSocket connection established"
		}));

		// Optional: handle socket close (clean up)
		connection.on('close', () => {
			chatConnections.delete(userId);
			// console.log(`User ${userId} disconnected from chat.`);
		});
	}
};
```

- Each user has 1 open WebSocket
- Server stores each connection in a `Map<userId, socket>`

---

### 📨 2. User Sends Message (HTTP Request)

```http
POST /chat/message
Content-Type: application/json

{
  "toUserId": 42,
  "content": "hello world!"
}
```

**Server-side handling:**
```ts
POST /chat/message {
  // Extract sender from auth/session
  const sender = req.user.id;
  const { toUserId, content } = req.body;

  // ✅ Check: sender is authenticated
  // ✅ Check: message content length, valid JSON
  // ✅ Check: sender is not blocked by receiver
  // ✅ Save message to DB (for history)

  // ✅ If receiver is online(WS open), push via WebSocket:
  const receiverSocket = onlineUsers.get(toUserId);
  if (receiverSocket) {
    receiverSocket.send(JSON.stringify({
      from: sender,
      content,
      timestamp: Date.now()
    }));
  }

  return res.status(200).send({ success: true });
}
```

---

### ⚡ 3. Receiver Gets Message (WebSocket Push)

```ts
// Client WebSocket listener
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  displayMessage(message); // render to chat window
};
```

---

### ✅ Why this architecture?

| Protocol | Purpose |
|----------|---------|
| **HTTP** | Authenticated message creation, validation, storage |
| **WebSocket** | Real-time delivery if recipient is online |

- Messages are always **safe** (validated once via HTTP)
- Delivery is always **fast** (pushed via WebSocket if possible)
- No need to reinvent protocol logic over raw WebSocket

---
## 📨 Message Flow

```text
------------------------------------------------------------------------------
| Step | Who      | What                                                      |
|------|----------|-----------------------------------------------------------|
| 1    | Sender   | HTTP POST to `/chat/message`                              |
| 2    | Server   | Save message to DB with status = `"sent"`                 |
| 3    | Server   | If receiver's WebSocket is open → push via WS             |
| 4    | Server   | Update message status to `"delivered"`                    |
| 5    | Receiver | Receives message via WebSocket (shows in chat box)        |
| 6    | Receiver | If visible, sends `message_read` event via WebSocket      |
| 7    | Server   | Update DB: status = `"read"`                              |
| 8    | Server   | If sender is online → push `"message_read"` to sender     |
| 9    | Sender   | Updates UI to show `"✓✓ read"` (e.g. blue double tick)    |
------------------------------------------------------------------------------
```

### ✅ Visual Status Mapping

| Tick Icon   | Message Status | Description                         |
|-------------|----------------|-------------------------------------|
| `✓`         | `"sent"`        | Message saved to DB                 |
| `✓✓` (grey) | `"delivered"`   | Delivered via WebSocket to receiver |
| `✓✓` (blue) | `"read"`        | Receiver saw the message            |


