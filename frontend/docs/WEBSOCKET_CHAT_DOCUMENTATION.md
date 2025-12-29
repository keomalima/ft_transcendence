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
