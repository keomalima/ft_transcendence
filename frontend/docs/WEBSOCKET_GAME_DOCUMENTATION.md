# WebSocket Game Implementation Documentation

## Architecture Overview

The multiplayer game uses WebSocket connections for real-time bidirectional communication between the frontend and backend. This allows for smooth gameplay with low latency updates for paddle positions, ball movement, and game events.

---

## 1. WebSocket Connection Setup

### Frontend: Client-Side WebSocket Creation

**File: `frontend/src/websocket/GameConnection.ts`**

```typescript
class GameConnection {
    private ws: WebSocket | null = null;

    connect(gameId: string, userId: string, scoreToWin: string) {
        const httpUrl = new URL(`/ws/game/${gameId}/${userId}/${scoreToWin}`, API_BASE_URL);
        httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        
        this.ws = new WebSocket(httpUrl.href);
        // Event handlers setup...
    }
}
```

The `GameConnection` class creates a WebSocket connection to the backend with the game parameters (gameId, userId, scoreToWin) encoded in the URL.

**File: `frontend/src/pages/Game.ts`**

```typescript
async function setGameSockets(gameId: string, userId: string, scoreToWin: string) {
    gameConnection = new GameConnection();
    gameConnection.connect(gameId, userId, scoreToWin);
}
```

The `Game.ts` page instantiates the `GameConnection` and calls `connect()` to establish the WebSocket connection.

---

### Backend: WebSocket Route Handler

**File: `backend/src/routes/websockets/game/game.ws.controller.ts`**

The backend receives the WebSocket connection request through a route handler:

```typescript
async function gameHandler(
    socket: WebSocket, 
    request: FastifyRequest<{Params: {gameId: string, userId: string, scoreToWin: string}}>
) {
    const gameId = request.params.gameId;
    const userId = request.params.userId;
    const scoreToWin = request.params.scoreToWin;
    
    // Get or create game session
    let gameSession = gameSessions.get(gameId);
    if (!gameSession) {
        gameSession = createGameSession(gameId, userId, parseInt(scoreToWin), socket);
        gameSessions.set(gameId, gameSession);
    }
    // ...
}
```

The `gameHandler` function:
1. Extracts parameters from the WebSocket URL
2. Retrieves or creates a `GameSession` for this game
3. Stores the session in a `Map<string, GameSession>` with gameId as key

---

### Backend: GameSession Structure

**File: `backend/src/routes/websockets/game/game.types.ts`**

The `GameSession` object is the core data structure that manages the game state:

```typescript
interface GameSession {
    gameId: string;
    players: Map<string, PlayerConnection>;  // Stores socket for each player
    gameState: {
        paddleA: { y: number; userId: string; side: 'left' };
        paddleB: { y: number; userId?: string; side: 'right' };
        ball: { x: number; y: number; velocityX: number; velocityY: number };
        score: { playerA: number; playerB: number };
        status: 'waiting' | 'playing' | 'finished';
        nextservice: 'playerA' | 'playerB';
    };
    gameConfig: { /* arena dimensions, speeds, etc */ };
    gameLoop: NodeJS.Timeout | null;
    // ... pause and disconnect timers
}

interface PlayerConnection {
    socket: WebSocket;     // WebSocket connection for this player
    userId: string;
    isCreator: boolean;
    position: 'left' | 'right';
    input: { up: boolean; down: boolean };
    score: number;
}
```

Each player's WebSocket is stored in the `players` Map, allowing the backend to send messages to specific players or broadcast to all.

---

## 2. Example Flow: Arrow Up Key Press

### Step 1: Frontend - Catch Keyboard Event

**File: `frontend/src/pages/Game.ts`**

```typescript
function gameActionListener() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            gameConnection?.send({ type: 'input', action: 'up' });
        } else if (e.key === 'ArrowDown') {
            gameConnection?.send({ type: 'input', action: 'down' });
        }
    });
}
```

When the user presses the Arrow Up key, the event listener sends a message through the WebSocket with `type: 'input'` and `action: 'up'`.

---

### Step 2: Backend - Receive Message and Update Input State

**File: `backend/src/routes/websockets/game/game.ws.controller.ts`**

```typescript
socket.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString());
    if (message.type === 'input') {
        const player = gameSession.players.get(userId);
        if (message.action === 'up') {
            player!.input.up = true;
            player!.input.down = false;
        } else if (message.action === 'down') {
            player!.input.up = false;
            player!.input.down = true;
        } else if (message.action === 'stop') {
            player!.input.up = false;
            player!.input.down = false;
        }
    }
});
```

The backend:
1. Parses the incoming WebSocket message
2. Finds the player in the `gameSession.players` Map
3. Updates the player's input state (`input.up = true`)

---

### Step 3: Backend - Calculate New Paddle Position

**File: `backend/src/routes/websockets/game/game.algo.ts`**

The game loop runs at 60 FPS using `setInterval`:

```typescript
gameSession.gameLoop = setInterval(() => {
    if (gameSession.players.size === 2) {
        gameAlgo.calculateGame(gameSession);           // Calculate new positions
        gameWsNotification.broadcastGameState(gameSession);  // Send to all players
    }
}, 1000 / 60);
```

Inside `calculateGame()`, the paddle position is updated based on input state:

```typescript
function calculatePaddle(gameSession: GameSession) {
    gameSession.players.forEach((player) => {
        const paddle = player.position === 'left' ? gameSession.gameState.paddleA : gameSession.gameState.paddleB;
        
        if (player.input.up) {
            paddle.y -= gameSession.gameConfig.paddlespeed;
        }
        if (player.input.down) {
            paddle.y += gameSession.gameConfig.paddlespeed;
        }
        
        // Clamp paddle position to arena bounds
        if (paddle.y < 0) paddle.y = 0;
        if (paddle.y > maxY) paddle.y = maxY;
    });
}
```

---

### Step 4: Backend - Broadcast New State to All Players

**File: `backend/src/routes/websockets/game/game.ws.notification.ts`**

```typescript
export function broadcastGameState(gameSession: GameSession) {
    const leftPlayer = Array.from(gameSession.players.values())
        .find(p => p.position === 'left');
    const rightPlayer = Array.from(gameSession.players.values())
        .find(p => p.position === 'right');

    const message = {
        type: 'update_game',
        left: {
            userid: leftPlayer?.userId,
            paddleposition: gameSession.gameState.paddleA.y,
            score: gameSession.gameState.score.playerA.toString()
        },
        right: {
            userid: rightPlayer?.userId,
            paddleposition: gameSession.gameState.paddleB.y,
            score: gameSession.gameState.score.playerB.toString()
        },
        ballX: gameSession.gameState.ball.x,
        ballY: gameSession.gameState.ball.y
    };

    gameSession.players.forEach((player) => {
        if (player.socket.readyState === WebSocket.OPEN) {
            player.socket.send(JSON.stringify(message));
        }
    });
}
```

The backend:
1. Constructs a message with updated paddle positions, ball position, and scores
2. Iterates through all players in the session
3. Sends the message to each player's WebSocket

---

### Step 5: Frontend - Receive Message in GameConnection

**File: `frontend/src/websocket/GameConnection.ts`**

```typescript
this.ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'update_game') {
        document.dispatchEvent(new CustomEvent('event-update-game', {
            detail: {
                left: data.left,
                right: data.right,
                ballX: data.ballX,
                ballY: data.ballY
            },
            bubbles: true
        }));
    }
}
```

The WebSocket `onmessage` handler:
1. Parses the incoming JSON data
2. Dispatches a custom DOM event (`event-update-game`) with the game state
3. Uses `bubbles: true` so the event propagates through the DOM

---

### Step 6: Frontend - Update DOM with New Positions

**File: `frontend/src/pages/Game.ts`**

```typescript
document.addEventListener('event-update-game', (e: Event) => {
    const customEvent = e as CustomEvent;
    const data = customEvent.detail;
    
    const paddleLeft = document.getElementById('paddleLeft');
    const paddleRight = document.getElementById('paddleRight');
    const ball = document.getElementById('ball');
    
    paddleLeft.style.top = `${parseInt(data.left.paddleposition) * getGameHeight() / 100}px`;
    paddleRight.style.top = `${parseInt(data.right.paddleposition) * getGameHeight() / 100}px`;
    ball.style.left = `${parseInt(data.ballX) * getGameWidth() / 200}px`;
    ball.style.top = `${parseInt(data.ballY) * getGameHeight() / 100}px`;
});
```

The event listener:
1. Extracts the game state from the custom event detail
2. Gets DOM elements for paddles and ball
3. Updates their CSS positions based on the received coordinates
4. Converts from game coordinates (0-100%) to pixel positions

---

## 3. Example Flow: Quit Button Click

### Step 1: Frontend - Handle Button Click

**File: `frontend/src/pages/Game.ts`**

```typescript
const quitBtn = document.getElementById('quit-btn');
quitBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    
    const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
    quitDialog.showModal();
    
    const confirmBtn = document.querySelector('#confirm-quit-btn') as HTMLButtonElement;
    
    const handleConfirm = () => {
        quitDialog.close();
        gameConnection?.send({ type: 'quit', looser: currentUser.id });
    };
    
    confirmBtn?.addEventListener('click', handleConfirm);
});
```

When the user clicks "Quit" → confirmation dialog → clicks "Confirm":
1. The dialog closes
2. A message is sent via WebSocket with `type: 'quit'` and the user ID

---

### Step 2: Backend - Receive Quit Message

**File: `backend/src/routes/websockets/game/game.ws.controller.ts`**

```typescript
socket.on('message', (data: Buffer) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'quit') {
        if (gameSession.gameLoop) {
            clearInterval(gameSession.gameLoop!);
            gameSession.gameLoop = null;
        }
        gameWsNotification.notifyAbandonnedGame(gameSession, message.looser);
    }
});
```

The backend:
1. Receives the quit message
2. Stops the game loop (stops sending updates)
3. Calls `notifyAbandonnedGame()` with the loser's ID

---

### Step 3: Backend - Notify All Players

**File: `backend/src/routes/websockets/game/game.ws.notification.ts`**

```typescript
export function notifyAbandonnedGame(gameSession: GameSession, looserUserId: string) {
    gameSession.gameState.status = 'finished';
    
    gameSession.players.forEach((player) => {
        const message = {
            type: 'abandoned-game',
            iswinner: player.userId !== looserUserId,
            currentPlayer: {
                userid: player.userId,
                position: player.position
            },
            players: [/* player data */]
        };
        
        if (player.socket.readyState === WebSocket.OPEN) {
            player.socket.send(JSON.stringify(message));
        }
    });
    
    cleanupGameSession(gameSession.gameId, gameSession);
}
```

The backend:
1. Sets game status to 'finished'
2. Sends `abandoned-game` message to each player
3. Marks the player who quit as loser (`iswinner: false` for them, `true` for opponent)
4. Cleans up the game session (closes sockets, clears timers)

---

### Step 4: Frontend - Receive Abandoned Game Event

**File: `frontend/src/websocket/GameConnection.ts`**

```typescript
this.ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'abandoned-game') {
        document.dispatchEvent(new CustomEvent('event-abandoned-game', {
            detail: {
                iswinner: data.iswinner,
                playerinfo: data.currentPlayer,
                players: data.players
            },
            bubbles: true
        }));
    }
}
```

Similar to the update flow, the WebSocket handler dispatches a custom event with the game result.

---

### Step 5: Frontend - Show Game Over Overlay

**File: `frontend/src/pages/Game.ts`**

```typescript
document.addEventListener('event-abandoned-game', async (e: Event) => {
    const customEvent = e as CustomEvent;
    const detail = customEvent.detail;
    
    const currentGame = await gameService.getGame(gameId, ctx);
    
    if (currentGame.status !== 'ABANDONED' && currentGame.status !== 'COMPLETED') {
        const data: FinishGameDto = {
            status: 'ABANDONED',
            gamePlayers: [/* scores */]
        };
        await gameService.finishGame(currentGame.id!, data, ctx);
    }
    
    const wonGameOverlay = document.querySelector('#won-game-overlay');
    const winner = document.querySelector('#winner');
    
    const isWinner = detail.iswinner;
    if (isWinner === true) {
        winner.innerText = `Your opponent gave up`;
    } else {
        winner.innerText = `Game over`;
    }
    wonGameOverlay.classList.remove('hidden');
    
}, { once: true });
```

The event listener:
1. Calls the REST API to mark the game as finished in the database
2. Shows the game over overlay
3. Displays appropriate message (winner vs. loser)
4. Uses `{ once: true }` to prevent multiple executions

---

## Key Design Patterns

### 1. Event-Driven Architecture
- Frontend uses custom DOM events to decouple WebSocket message handling from UI updates
- Components listen for events instead of directly accessing WebSocket data

### 2. State Synchronization
- Backend is the single source of truth for game state
- Frontend only renders what the backend sends (no client-side prediction)
- 60 FPS update rate ensures smooth gameplay

### 3. Connection Management
- Backend stores all active WebSocket connections in the `GameSession`
- Handles reconnection logic when players disconnect temporarily
- Cleanup on game end to prevent memory leaks

### 4. Race Condition Prevention
- `isFinishingGame` flag prevents duplicate API calls
- `{ once: true }` on event listeners prevents multiple overlays
- Backend checks game status before processing actions

---

## Connection Lifecycle

1. **Connection**: Player navigates to `/game/:id` → `GameConnection.connect()` → WebSocket opens → Backend creates/joins `GameSession`
2. **Playing**: Game loop runs at 60 FPS → sends `update_game` messages → Frontend updates DOM
3. **Disconnection**: Player closes page → WebSocket `close` event → Backend sets 30s reconnection timeout
4. **Reconnection**: Player returns → Backend detects same userId → clears timeout → resumes game
5. **Game End**: Win/quit condition → `won-game` or `abandoned-game` event → REST API call to save result → WebSocket cleanup

---

## Summary

The WebSocket implementation provides real-time, bidirectional communication for the multiplayer Pong game:

- **Frontend**: `GameConnection` class manages WebSocket lifecycle and dispatches DOM events
- **Backend**: `GameSession` structure stores player connections and game state, with a 60 FPS loop calculating physics
- **Communication**: JSON messages flow bidirectionally (input commands from client, state updates from server)
- **Event Flow**: User input → WebSocket send → Backend calculation → Broadcast → WebSocket receive → Custom event → DOM update

This architecture separates concerns, allows for easy testing, and provides a scalable foundation for real-time multiplayer gameplay.
