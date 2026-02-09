import { router } from "../main.js";
import type { AppContext, GameData, UserState } from "../types.js";
import { GameConnection } from "../websocket/GameConnection.js";
import { BUTTON_CREAM_CLASSES, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { gameService } from "../services/GameService.js";
import { sharedGameState, setGameConnection } from "../game/sharedGameState.js";
import { registerInterval, setupGameEventListeners } from "./GameEventListeners.js";

// Guard to prevent double initialization
let isInitializing = false;
let currentGameId: string | null = null;
let claimVictoryInterval: number | null = null;

export function Game(ctx: AppContext, params?: Record<string, string>): string {

	// get user data from store
	const currentUser = ctx.userStore.get();

	// secure if no user
	if (!currentUser?.id)
	{
		// console.log('No active session when accessing game')
		setTimeout(() => router.navigateTo('/'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	// secure if no params
	if (!params || !params['id'])
	{
		// console.log('No game id is provided')
		setTimeout(() => router.navigateTo('/home'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	// Prevent double initialization for the same game
	if (isInitializing && currentGameId === params['id']) {
		// console.log('⏭️ Already initializing game', params['id']);
		return '<div id="game-content"><p class="flex items-center justify-center h-screen">Loading Game ...</p></div>';
	}

	isInitializing = true;
	currentGameId = params['id'];

	setTimeout(async () => {
		const userGame = await gameService.getCurrentGame(ctx);
		// secure if the user do not belong to the game
		if (params['id'] !== userGame?.gameId) {
			// console.log('User do not belong to this game')
			setTimeout(() => router.navigateTo('/home'), 0);
			return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
		}

		let currentGame = await gameService.getGame(params['id'], ctx);
		// secure if the ugame is not IN_PROGRESS
		if (!currentGame || currentGame.status === 'ABANDONED' || currentGame.status === 'COMPLETED') {
			// console.log('The game is not in progress');
			setTimeout(() => router.navigateTo('/'), 0);
			return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
		}
		let check = await userIsAuthorized(currentUser.id!, ctx);
		if (check !== null)
			return check;

		// 2. Start listener for action up and down arrows
		gameActionListener();
		
		// 3. Render the initial game
			console.log('current game = ', currentGame);
			// 3. Render the initial game
			renderGameContent(params['id'], currentGame!);
		
			// 4. Set all the event listeners
			setupGameEventListeners(currentUser, currentGame!, params['id'], ctx);

			// 5. Now start the websocket connection (don't block rendering) and keep the promise
			const playersPromise = setGameSockets(params['id'], currentUser.id!, currentGame.scoreToWin!.toString());

			// When the server reports players count, update the waiting overlay if needed
			playersPromise.then((playersInfo) => {
				const playersCount = (playersInfo && typeof (playersInfo as any).numberOfPlayers === 'number') ? (playersInfo as any).numberOfPlayers : 1;
				const waitingOverlay = document.querySelector('#waiting-opponent-overlay') as HTMLDivElement | null;
				if (waitingOverlay) {
					if (playersCount >= 2) {
						waitingOverlay.classList.add('hidden');
						stopClaimVictoryCountdown();
					} else {
						waitingOverlay.classList.remove('hidden');
						initializeClaimVictoryCountdown(normalizeStartedAt(currentGame?.startedAt));
					}
				}
			}).catch(() => {
				// ignore — fallback behavior already in UI
			});

			// 6. Start game (show the start overlays)
			startGame();

		// Mark initialization as complete
		isInitializing = false;
	}, 0);

	return (/*html*/`
		<div id="game-content">
			<p class='flex items-center justify-center h-screen'>Loading Game ...</p>
		</div>
		`);
}

// ======== UPDDATE CONTENT ============
function renderGameContent(gameId: string, currentGame: GameData, playersCount?: number) {
	if (!currentGame) {
		// console.log('❌ Missing current game');
		return;
	}
	// Show waiting overlay when server reports less than 2 connected players.
	// If we don't have server info, fall back to DB status (PENDING).
		const showWaitingOverlay = typeof playersCount === 'number' ? (playersCount < 2) : (currentGame.status === 'PENDING');
	const content = document.getElementById('game-content');
	content!.innerHTML = 
	/*html*/`
		<main class="flex flex-col gap-2 md:gap-4 h-screen w-screen overflow-hidden place-items-center justify-center px-2 py-2 md:px-6">
			<div class="text-center flex-shrink-0">
				<h1 class="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 md:mt-4 hidden portrait:block landscape:md:block">Game</h1>
			</div>
			<div class='flex flex-row w-full max-w-[90vw] lg:max-w-[80vw] mx-auto flex-shrink-0'>
				<div class='flex-1 text-center'>
					<p id='left-player' class='font-[Inter] text-sm md:text-base lg:text-xl'>-</p>
					<p id='left-score' class='font-[Calistoga] text-2xl md:text-3xl lg:text-5xl mt-1'>0</p>
				</div>
				<div class='flex-1 flex items-center justify-center'>
					<p class="text-sm md:text-base">vs</p>
				</div>
				<div class='flex-1 text-center'>
					<p id='right-player' class='font-[Inter] text-sm md:text-base lg:text-xl'>-</p>
					<p id='right-score' class='font-[Calistoga] text-2xl md:text-3xl lg:text-5xl mt-1'>0</p>
				</div>
			</div>
			<div id="arena" class='mx-auto bg-black relative border-2 border-black rounded-xl' style='width: min(90vw, calc(100vh - 6rem) * 2); height: calc(min(90vw, calc(100vh - 6rem) * 2) / 2);'>
				<div id="line" class='absolute w-[1px] h-full bg-white' style='left: 50%'></div>
				<div id="paddleLeft" class='absolute w-[2%] h-1/5 bg-white rounded-xs' style="top: 40%"></div>
				<div id="paddleRight" class='absolute w-[2%] h-1/5 bg-white right-[0px] rounded-xs' style="top: 40%"></div>
				<div id='ball' class='absolute w-[2%] h-[4%] rounded-full bg-yellow-500' style="top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
			</div>
			<div class="text-center flex-shrink-0">
				<div class="flex items-center justify-center gap-x-2 md:gap-x-6">
					<button id='pause-btn' type='click' class='${BUTTON_CREAM_CLASSES} text-xs md:text-sm lg:text-base px-2 py-1 md:px-3 md:py-2'>pause</button>
					<button id='give-up-btn' type='click' class='${BUTTON_CREAM_CLASSES} text-xs md:text-sm lg:text-base px-2 py-1 md:px-3 md:py-2'>give up</button>
				</div>
			</div>

			<!-- Start message overlay -->
			<div id="start-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-black text-black">Your game will start soon</p>
						<p id='start-side' class="text-3xl font-[Calistoga] text-black"></p>
					</div>
				</div>
			</div>

			<!-- Player set pause overlay -->
			<div id="player-set-pause-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Pause</p>
						<p id='player-pause-timer' class="text-3xl font-[Inter] font-light text-black"></p>
						<button id='stop-pause-btn' type='click' class='${BUTTON_WHITE_CLASSES}'>Go!</button>
					</div>
				</div>
			</div>

			<!-- Opponent set pause overlay -->
			<div id="opponent-set-pause-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Pause</p>
						<p class="text-xl font-[Calistoga] font-bold text-black">Waiting for your opponent</p>
						<p id='opponent-pause-timer' class="text-3xl font-[Inter] font-light text-black"></p>
					</div>
				</div>
			</div>

			<!-- Player disconnected overlay -->
			<div id="player-disconnected-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Opponent Disconnected</p>
						<p class="text-xl font-[Inter] font-medium text-black">Waiting for reconnection...</p>
						<p id="disconnect-timer" class="text-lg font-[Inter] font-light text-gray-500">30</p>
					</div>
				</div>
			</div>

			<!-- Won game overlay -->
			<div id="won-game-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Finish Game</p>
						<p class="text-5xl font-[Calistoga] font-black text-black" id="winner"></p>
						<button id='won-back-home-btn' class='${BUTTON_WHITE_CLASSES}'>Back to home</button>
					</div>
				</div>
			</div>

			<!-- Waiting opponent overlay -->
				<div id="waiting-opponent-overlay" class="${showWaitingOverlay ? '' : 'hidden'} fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class='flex flex-col gap-5'>
					<p class="text-3xl font-[Calistoga] font-bold text-white">Waiting for your opponent ...</p>
					<p id='claim-victoty-timer' class='text-3xl text-white text-center'></p>
					<div class="flex gap-3 justify-between">
						<button id='go-back-btn' type='click' class='flex-1 px-3.5 py-2.5 rounded-full bg-white outline outline-1 outline-black hover:font-semibold focus-visible:outline-2 focus-visible:outline-offset-2'>go back</button>
						<button id='claim-victory-btn' type='click' class='hidden flex-1 px-3.5 py-2.5 rounded-full bg-white outline outline-1 outline-black hover:font-semibold focus-visible:outline-2 focus-visible:outline-offset-2'>claim victory</button>
					</div>
				</div>
			</div>

			<!-- Confirmation QUIT Dialog -->
			<dialog id="quit-game-dialog" class="fixed inset-0 m-auto w-fit h-fit rounded-lg shadow-lg p-6 backdrop:bg-black backdrop:bg-opacity-50">
				<div class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold">Give up</h2>
					<p id="delete-friend-message" class="text-gray-600">Are you sure to quit game?</p>
					<div class="flex gap-3 justify-end">
						<button id="cancel-give-up-btn" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
						<button id="confirm-give-up-btn" class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white">Confirm</button>
					</div>
				</div>
			</dialog>

		</main>
	`;
	initializeClaimVictoryCountdown(normalizeStartedAt(currentGame.startedAt));
}

// ======== CHECK IF USER IS AUTHORIZED ============
async function userIsAuthorized(userId: string, ctx: AppContext): Promise<string | null>
{
	const gameData = await gameService.getCurrentGame(ctx);
	if (userId !== gameData?.userId) {
		return (
			/*html*/`
				<main class="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
					<div class="text-center">
						<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">You're not allowed in this game</h1>
						<div class="mt-10 flex items-center justify-center gap-x-6">
							<button id='back-btn' class="styled-link">Go back</button>
						</div>
					</div>
				</main>
			`
		)
	}
	return null;
}

// ======== SET WEBSOCKET CONNECTION ==========
// Returns the initial players info received from the server (or a sensible default)
async function setGameSockets(gameId: string, userId: string, scoreToWin: string) {

	// Create websocket
	const gameConnection = new GameConnection();
	// Connect and wait for initial players info (the promise resolves when server sends it)
	try {
		// race the server response with a short timeout to avoid hanging if server doesn't send initial info
		const playersInfo = await Promise.race([
			gameConnection.connect(gameId, userId, scoreToWin),
			new Promise<any>((resolve) => setTimeout(() => resolve({ numberOfPlayers: 1 }), 1500))
		]);
		setGameConnection(gameConnection);
		return playersInfo;
	} catch (err) {
		// If connect fails, still attach the connection object and return a safe default
		setGameConnection(gameConnection);
		return { numberOfPlayers: 1 };
	}
}

// ======== CLEANUP WEBSOCKET CONNECTION ============
export function cleanGameWS() {
	if (sharedGameState.gameConnection) {
		sharedGameState.gameConnection.disconnect();
		setGameConnection(null);
	}
}

// ======== GAME ACTION ============
function gameActionListener() {
	// Keyboard controls
	document.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			sharedGameState.gameConnection?.send({ type: 'input', action: 'up' });
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			sharedGameState.gameConnection?.send({ type: 'input', action: 'down' });
		}
	});

	document.addEventListener('keyup', (e) => {
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			sharedGameState.gameConnection?.send({ type: 'input', action: 'stop' });
		}
	});

	// Touch controls for mobile - paddle follows finger position
	let touchId: number | null = null;

	const handleTouchStart = (e: TouchEvent) => {
		if (touchId !== null) return; // Already tracking a touch
		
		const touch = e.changedTouches[0];
		touchId = touch.identifier;
		
		// Start tracking immediately
		updatePaddlePosition(touch.clientY);
	};

	const handleTouchMove = (e: TouchEvent) => {
		e.preventDefault(); // Prevent scrolling
		
		// Find the touch we're tracking
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			
			if (touch.identifier === touchId) {
				updatePaddlePosition(touch.clientY);
				break;
			}
		}
	};

	const handleTouchEnd = (e: TouchEvent) => {
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];
			
			if (touch.identifier === touchId) {
				touchId = null;
				break;
			}
		}
	};

	function updatePaddlePosition(touchY: number) {
		const arena = document.getElementById('arena');
		if (!arena) return;

		const arenaRect = arena.getBoundingClientRect();
		const paddleHeight = arenaRect.height * 0.2; // 20% of arena height (matches h-1/5 in HTML)
		
		// Calculate touch position relative to arena
		const relativeY = touchY - arenaRect.top;
		
		// Calculate paddle position (centered on finger)
		let paddlePosition = relativeY - (paddleHeight / 2);
		
		// Clamp to arena bounds
		const maxY = arenaRect.height - paddleHeight;
		paddlePosition = Math.max(0, Math.min(maxY, paddlePosition));
		
		// Convert to percentage (0-100)
		const positionPercent = (paddlePosition / arenaRect.height) * 100;
		
		// Send position to server
		sharedGameState.gameConnection?.send({ type: 'position', position: positionPercent });
	}

	document.addEventListener('touchstart', handleTouchStart, { passive: false });
	document.addEventListener('touchmove', handleTouchMove, { passive: false });
	document.addEventListener('touchend', handleTouchEnd);
	document.addEventListener('touchcancel', handleTouchEnd);
}

function initializeClaimVictoryCountdown(startedAt: number | null | undefined) {
	stopClaimVictoryCountdown();
	const countdownEl = document.getElementById('claim-victoty-timer') as HTMLParagraphElement | null;
	const button = document.getElementById('claim-victory-btn') as HTMLButtonElement | null;
	if (!countdownEl || !button) return;
	if (!startedAt) {
		countdownEl.textContent = '';
		button.classList.add('hidden');
		return;
	}
	const target = startedAt + 30000;
	button.classList.add('hidden');
	const update = () => {
		const remainingMs = Math.max(0, target - Date.now());
		const remainingSec = Math.ceil(remainingMs / 1000);
		countdownEl.textContent = remainingSec.toString();
		if (remainingMs <= 0) {
			countdownEl.textContent = '0';
			countdownEl.classList.add('hidden');
			button.classList.remove('hidden');
			stopClaimVictoryCountdown();
		}
	};
	update();
	if (target > Date.now()) {
		claimVictoryInterval = window.setInterval(update, 1000);
		registerInterval(claimVictoryInterval as number);
	}
}

function stopClaimVictoryCountdown() {
	if (claimVictoryInterval) {
		clearInterval(claimVictoryInterval);
		claimVictoryInterval = null;
	}
}

function normalizeStartedAt(value: string | number | null | undefined): number | null {
	if (value === undefined || value === null) return null;
	if (typeof value === 'number') return value;
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		return Number.isNaN(parsed) ? null : parsed;
	}
	const normalized = Number(value);
	return Number.isNaN(normalized) ? null : normalized;
}

// ======== START ============
let startGameHandler: ((e: Event) => void) | null = null;

function startGame() {
	// Remove old listener if it exists
	if (startGameHandler) {
		document.removeEventListener('event-start-game', startGameHandler);
	}

	// Store reference to current overlay
	const waitingOpponentOverlay = document.querySelector('#waiting-opponent-overlay') as HTMLDivElement | null;
	
	// Create new handler
	startGameHandler = (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const detail = customEvent.detail;

		// Query DOM elements fresh when event fires (after new render)
		const startOverlay = document.querySelector('#start-overlay') as HTMLDivElement | null;
		const playingSide = document.querySelector('#start-side') as HTMLParagraphElement | null;

		if (waitingOpponentOverlay) {
			waitingOpponentOverlay.style.display = 'none';
		}

		if (playingSide) {
			playingSide.innerHTML = `You play on ${detail.position} side ${detail.position === 'left' ? '⬅️' : '➡️' }`;
		}

		if (startOverlay) {
			startOverlay.classList.remove('hidden');
			setTimeout(() => {
				startOverlay.classList.add('hidden');
			}, 3000);
		}
	};

	// Register the new listener (will only fire once)
	document.addEventListener('event-start-game', startGameHandler, { once: true });
}





