import { router } from "../main.js";
import type { AppContext, GameData, UserState } from "../types.js";
import { GameConnection } from "../websocket/GameConnection.js";
import { BUTTON_CREAM_CLASSES, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { gameService } from "../services/GameService.js";
import { FinishGameDto } from "../api/gameApi.js";
import { tournamentApi } from "../api/tournamentApi.js";


let gameConnection: GameConnection | null = null;
let isFinishingGame: boolean = false; // Flag to prevent duplicate finishGame calls

export function Game(ctx: AppContext, params?: Record<string, string>): string {

	// get user data from store
	const currentUser = ctx.userStore.get();

	// secure if no access token or user ID
	if (!currentUser?.id)
	{
		console.log('no session when accessing /game-room')
		setTimeout(() => router.navigateTo('/'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}

	// secure if no params
	if (!params || !params['id'])
	{
		console.log('no params available')
		setTimeout(() => router.navigateTo('/home'), 0);
		return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
	}


	setTimeout(async () => {
		let currentGame = await gameService.getGame(params['id'], ctx);
		console.log('💫 current game = ', currentGame);
		if (!currentGame || currentGame.status === 'ABANDONED' || currentGame.status === 'COMPLETED') {
			setTimeout(() => router.navigateTo('/'), 0);
			return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
		}
		let check = await userIsAuthorized(currentUser.id!, ctx);
		if (check !== null)
			return check;
		
		// 1. Set game sockets
		setGameSockets(params['id'], currentUser.id!, currentGame.scoreToWin!.toString());
		
		// 2. Start listener for action up and down arrows
		gameActionListener();
		
		// 3. Render the initial game
		renderGameContent(params['id'], currentGame!);
		
		// 4. Set all the event listeners
		setupGameEventListeners(currentUser, currentGame!, params['id'], ctx);
		
		// 5. Start game (show the start overlays)
		startGame();
	}, 0);

	return (/*html*/`
		<div id="game-content">
			<p class='flex items-center justify-center h-screen'>Loading Game ...</p>
		</div>
		`);
}

// ======== UPDDATE CONTENT ============
function renderGameContent(gameId: string, currentGame: GameData) {
	if (!currentGame) {
		console.log('❌ Missing current game');
		return;
	}
	const content = document.getElementById('game-content');
	content!.innerHTML = 
	/*html*/`
		<main class="flex flex-col gap-2 md:gap-4 h-screen w-screen overflow-hidden place-items-center justify-center px-2 py-2 md:px-6">
			<div class="text-center flex-shrink-0">
				<h1 class="text-2xl md:text-4xl lg:text-5xl font-semibold tracking-tight mt-2 md:mt-4 hidden portrait:block landscape:md:block">Game</h1>
				<p class="text-xs md:text-sm hidden portrait:block landscape:md:block">#${gameId}</p>
			</div>
			<div class='flex flex-row w-full max-w-[90vw] lg:max-w-[80vw] mx-auto flex-shrink-0'>
				<div class='flex-1 justify-items-center'>
					<p id='left-player' class='font-[Inter] text-sm md:text-base lg:text-xl'>player 1</p>
					<p id='left-score' class='font-[Calistoga] text-2xl md:text-3xl lg:text-5xl mt-1'>0</p>
				</div>
				<div class='flex-1 flex items-center justify-center'>
					<p class="text-sm md:text-base">vs</p>
				</div>
				<div class='flex-1 justify-items-center'>
					<p id='right-player' class='font-[Inter] text-sm md:text-base lg:text-xl'>player 2</p>
					<p id='right-score' class='font-[Calistoga] text-2xl md:text-3xl lg:text-5xl mt-1'>0</p>
				</div>
			</div>
			<div id="arena" class='w-full max-w-[90vw] lg:max-w-[80vw] mx-auto aspect-[2/1] bg-black relative border-2 border-black rounded-xl flex-shrink min-h-0'>
				<div id="line" class='absolute w-[1px] h-full bg-white' style='left: 50%'></div>
				<div id="paddleLeft" class='absolute w-[2%] h-1/5 bg-white rounded-xs' style="top: 40%"></div>
				<div id="paddleRight" class='absolute w-[2%] h-1/5 bg-white right-[0px] rounded-xs' style="top: 40%"></div>
				<div id='ball' class='absolute w-[2.5%] h-[5%] rounded-full bg-yellow-500' style="top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
			</div>
			<div class="text-center flex-shrink-0">
				<div class="flex items-center justify-center gap-x-2 md:gap-x-6">
					<button id='pause-btn' type='click' class='${BUTTON_CREAM_CLASSES} text-xs md:text-sm lg:text-base px-2 py-1 md:px-3 md:py-2'>pause</button>
					<button id='quit-btn' type='click' class='${BUTTON_CREAM_CLASSES} text-xs md:text-sm lg:text-base px-2 py-1 md:px-3 md:py-2'>give up</button>
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

			<!-- Countdown overlay -->
			<div id="countdown-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div class="bg-white rounded-lg shadow-2xl p-12 min-w-[400px]">
					<div class="flex flex-col items-center justify-center gap-6">
						<p class="text-3xl font-[Calistoga] font-bold text-gray-500 tracking-wide">Get Ready</p>
						<p class="text-8xl font-[Calistoga] font-black text-black animate-pulse" id="countdown-number">3</p>
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

			<!-- Confirmation Dialog -->
			<dialog id="quit-game-dialog" class="fixed inset-0 m-auto w-fit h-fit rounded-lg shadow-lg p-6 backdrop:bg-black backdrop:bg-opacity-50">
				<div class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold">Give up</h2>
					<p id="delete-friend-message" class="text-gray-600">Are you sure to quit game?</p>
					<div class="flex gap-3 justify-end">
						<button id="cancel-quit-btn" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
						<button id="confirm-quit-btn" class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white">Confirm</button>
					</div>
				</div>
			</dialog>
		</main>
	`;
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

// ======== SET WEBSOCKET CONNECTION ============
async function setGameSockets(gameId: string, userId: string, scoreToWin: string) {

	// Create websocket
	gameConnection = new GameConnection();
	gameConnection.connect(gameId, userId, scoreToWin);
}

// ======== CLEANUP WEBSOCKET CONNECTION ============
export function cleanGameWS() {
	if (gameConnection) {
		gameConnection.disconnect();
		gameConnection = null;
	}
	// Reset the flag when cleaning up
	isFinishingGame = false;
}

// ======== GAME ACTION ============
function gameActionListener() {
	// Keyboard controls
	document.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			gameConnection?.send({ type: 'input', action: 'up' });
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			gameConnection?.send({ type: 'input', action: 'down' });
		}
	});

	document.addEventListener('keyup', (e) => {
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			gameConnection?.send({ type: 'input', action: 'stop' });
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
		gameConnection?.send({ type: 'position', position: positionPercent });
	}

	document.addEventListener('touchstart', handleTouchStart, { passive: false });
	document.addEventListener('touchmove', handleTouchMove, { passive: false });
	document.addEventListener('touchend', handleTouchEnd);
	document.addEventListener('touchcancel', handleTouchEnd);
}

// ======== START ============
function startGame() {
	document.addEventListener('event-start-game', (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const detail = customEvent.detail;

		const startOverlay = document.querySelector('#start-overlay') as HTMLDivElement;
		const playingSide = document.querySelector('#start-side') as HTMLParagraphElement;
		playingSide.innerText = `You play on ${detail.position} side ${detail.position === 'left' ? '⬅️' : '➡️' }`;
		
		startOverlay?.classList.remove('hidden');
		
		let count = 3;
		const interval = setInterval(() => {
			count--;
			if (count >= 0)
				count--;
			else {
				startOverlay?.classList.add('hidden');
				clearInterval(interval);
			}
		}, 1000);
	}, { once: true });
}


// ======== EVENT LISTENER ============
function setupGameEventListeners(currentUser: UserState, currentGame: GameData, gameId: string, ctx: AppContext) {

	console.log(currentGame);
	if (!currentGame || !currentGame.gameUsers || currentGame.gameUsers.length < 2) {
		console.log('❌ Missing current game');
		return;
	}

	let opponentDisplayName: string | null | undefined = null;
	if (currentGame.gameUsers[0].user?.id === currentUser.id) {
		opponentDisplayName = currentGame.gameUsers[1].user?.displayName;
	} else {
		opponentDisplayName = currentGame.gameUsers[0].user?.displayName;
	}

	let playerPauseInterval: number | null = null;
	let opponentPauseInterval: number | null = null;

	// **** UPDATE GAME ****
	document.addEventListener('event-update-game', (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		
		const paddleLeft = document.getElementById('paddleLeft');
		const paddleRight = document.getElementById('paddleRight');
		const ball = document.getElementById('ball');
		const leftPlayer = document.getElementById('left-player') as HTMLParagraphElement;
		const rightPlayer = document.getElementById('right-player') as HTMLParagraphElement;
		const leftScore = document.getElementById('left-score') as HTMLParagraphElement;
		const rightScore = document.getElementById('right-score') as HTMLParagraphElement;
		
		if (!paddleLeft || !paddleRight || !ball) return;


		paddleLeft.style.top = `${parseInt(data.left.paddleposition) * getGameHeight() / 100}px`;
		paddleRight.style.top = `${parseInt(data.right.paddleposition) * getGameHeight() / 100}px`;
		ball.style.left = `${parseInt(data.ballX) * getGameWidth() / 200}px`;
		ball.style.top = `${parseInt(data.ballY) * getGameHeight() / 100}px`;
		ball.style.transform = 'translate(-50%, -50%)';
		leftPlayer.innerText = data.left.userid === currentUser.id ? 'You' : opponentDisplayName!;
		leftScore.innerText = data.left.score;
		rightPlayer.innerText = data.right.userid === currentUser.id ? 'You' : opponentDisplayName!;
		rightScore.innerText = data.right.score;
	})

	// **** QUIT GAME ****
	const quitBtn = document.getElementById('quit-btn');
	quitBtn?.addEventListener('click', (e) => {
		e.preventDefault();

		const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
		if (!quitDialog)
			return;

		quitDialog.showModal();
		const cancelBtn = document.querySelector('#cancel-quit-btn') as HTMLButtonElement;
		const confirmBtn = document.querySelector('#confirm-quit-btn') as HTMLButtonElement;

		// Handle cancel
		const handleCancel = () => {
			quitDialog.close();
			cancelBtn?.removeEventListener('click', handleCancel);
			confirmBtn?.removeEventListener('click', handleConfirm);
		};
		
		// Handle confirm
		const handleConfirm = () => {
			quitDialog.close();
			cancelBtn?.removeEventListener('click', handleCancel);
			confirmBtn?.removeEventListener('click', handleConfirm);
			gameConnection?.send({ type: 'quit', looser: currentUser.id});
		};

		// Attach event listeners
		cancelBtn?.addEventListener('click', handleCancel);
		confirmBtn?.addEventListener('click', handleConfirm);
		
		// Close on backdrop click
		quitDialog.addEventListener('click', (e) => {
			if (e.target === quitDialog) {
				handleCancel();
			}
		});
	});

	// const wonGameOverlay = document.querySelector('#won-game-overlay') as HTMLDivElement;
	// const backHomeBtn = document.querySelector('#won-back-home-btn') as HTMLButtonElement;
	
	// wonGameOverlay.classList.remove('hidden');
	// backHomeBtn?.addEventListener('click', async () => {
	// 	console.log(currentGame);
	// 	cleanGameWS();
	// 	if (currentGame.type === 'TOURNAMENT' && currentGame.tournamentId)
	// 		await tournamentApi.advanceTournament(currentGame.tournamentId!);
	// 	else
	// 		router.navigateTo('/home');
	// }, { once: true });
	
	// **** WON GAME ****
	document.addEventListener('event-won-game', async (e: Event) => {
		e.preventDefault();
		console.log('🏆 WON GAME');
		
		if (isFinishingGame) {
			console.log('⏭️ Already finishing game, skipping...');
			return;
		}
		isFinishingGame = true;
		
		const customEvent = e as CustomEvent;
		const detail = customEvent.detail;

		// Only the creator should call the API to finish the game
		if (currentGame.isCreator) {
			const currentGame = await gameService.getGame(gameId, ctx);
			if (!currentGame) {
				router.navigateTo('/home');
				return;
			}
			
			// Check if game is already finished
			if (currentGame.status !== 'IN_PROGRESS') {
				console.log('👀 Game already finished, skipping finishGame API call');
			} else {
				try {
					// Build game players data from currentGame.gameUsers
					if (!currentGame.gameUsers || currentGame.gameUsers.length !== 2) {
						console.error('❌ Missing game users data');
						router.navigateTo('/home');
						return;
					}
					console.log(`Winner id = ${detail.winnerId}`);
					const data: FinishGameDto = {
						status: 'COMPLETED',
						winnerId: detail.winnerId,
						gamePlayers: [
							{
								userId: currentGame.gameUsers[0].user?.id!,
								playerId: currentGame.gameUsers[0].id!,
								score: currentGame.gameUsers[0].user?.id === detail.players[0].id ? parseInt(detail.players[0].score!) : parseInt(detail.players[1].score!)
							},
							{
								userId: currentGame.gameUsers[1].user?.id!,
								playerId: currentGame.gameUsers[1].id!,
								score: currentGame.gameUsers[1].user?.id === detail.players[1].id ? parseInt(detail.players[1].score!) : parseInt(detail.players[0].score!)
							}
						]
					};
					console.log('🎮 Creator finishing game...');
					await gameService.finishGame(currentGame.id!, data, ctx);
					console.log('✅ Game finished successfully');
				} catch (error) {
					console.error('❌ Error finishing game:', error);
				}
			}
		} else {
			console.log('👀 Non-creator, skipping finishGame API call');
		}

		const wonGameOverlay = document.querySelector('#won-game-overlay') as HTMLDivElement;
		const winner = document.querySelector('#winner') as HTMLParagraphElement;
		const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
		const backHomeBtn = document.querySelector('#won-back-home-btn') as HTMLButtonElement;

		if (quitDialog?.open) {
			return;
		}
		if (!wonGameOverlay || !winner)
			return;
		const isWinner = detail.iswinner;
		if (isWinner === true)
			winner.innerText = `Congratulation you won the game !`;
		else
			winner.innerText = `Sorry, you've lost`;
		wonGameOverlay.classList.remove('hidden');
		
		backHomeBtn?.addEventListener('click', async () => {
			console.log(currentGame);
			cleanGameWS();
			if (currentGame.type === 'TOURNAMENT' && currentGame.tournamentId)
				router.navigateTo(`/tournament/${currentGame.tournamentId}`);
			else
				router.navigateTo('/home');
		}, { once: true });

	}, { once: true });

	// **** ADANDONNED GAME ****
	document.addEventListener('event-abandoned-game', async (e: Event) => {
		e.preventDefault();
		console.log('🏆 ABANDONED GAME');

		if (isFinishingGame) {
			console.log('⏭️ Already finishing game, skipping...');
			return;
		}
		isFinishingGame = true;

		const customEvent = e as CustomEvent;
		const detail = customEvent.detail;
		const currentGame = await gameService.getGame(gameId, ctx);
		if (!currentGame) {
			router.navigateTo('/home');
			return;
		}

		// For abandoned games, ANY player can finish (creator might have left)
		if (currentGame.status === 'IN_PROGRESS') {
			try {
				if (!currentGame.gameUsers || currentGame.gameUsers.length !== 2) {
					console.error('❌ Missing game users data');
					router.navigateTo('/home');
					return;
				}

				console.log(`🚨 Abandoned game -> winner Id = ${detail.winnerId}`);
				
				const data: FinishGameDto = {
					status: 'ABANDONED',
					winnerId: detail.winnerId,
					gamePlayers: [
						{
								userId: currentGame.gameUsers[0].user?.id!,
								playerId: currentGame.gameUsers[0].id!,
								score: currentGame.gameUsers[0].user?.id === detail.players[0].id ? parseInt(detail.players[0].score!) : parseInt(detail.players[1].score!)
						},
						{
								userId: currentGame.gameUsers[1].user?.id!,
							playerId: currentGame.gameUsers[1].id!,
							score: currentGame.gameUsers[1].user?.id === detail.players[1].id ? parseInt(detail.players[1].score!) : parseInt(detail.players[0].score!)
						}
					]
				};
				console.log('🎮 Finishing abandoned game...');
				await gameService.finishGame(currentGame.id!, data, ctx);
				console.log('✅ Game finished successfully');
			} catch (error) {
				console.error('❌ Error finishing game:', error);
			}
		} else {
			console.log('👀 Game already finished, skipping finishGame API call');
			isFinishingGame = true;
		}

		const wonGameOverlay = document.querySelector('#won-game-overlay') as HTMLDivElement;
		const winner = document.querySelector('#winner') as HTMLParagraphElement;
		const backHomeBtn = document.querySelector('#won-back-home-btn') as HTMLButtonElement;

		if (!wonGameOverlay || !winner)
			return;

		const isWinner = detail.iswinner;
		if (isWinner === true)
			winner.innerText = `Your opponent gave up`;
		else
			winner.innerText = `Game over`;
		wonGameOverlay.classList.remove('hidden');
		
		backHomeBtn?.addEventListener('click', async () => {
			cleanGameWS();
			router.navigateTo('/home');
		}, { once: true });

	}, { once: true });

	// **** COUNTDOWN ****
	document.addEventListener('event-service-countdown', (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;

		const countdownOverlay = document.querySelector('#countdown-overlay') as HTMLDivElement;
		const countdownNumber = document.querySelector('#countdown-number') as HTMLParagraphElement;
		const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
		const pauseOverlay = document.querySelector('#player-set-pause-overlay') as HTMLDivElement;

		if (!countdownOverlay || !countdownNumber || !quitDialog || !pauseOverlay
			|| quitDialog?.open || !pauseOverlay.classList.contains('hidden'))
			return;

		let count = data.count;

		countdownOverlay?.classList.remove('hidden');
		countdownNumber.textContent = count.toString();

		const interval = setInterval(() => {
			count--;
			if (count > 0) {
				countdownNumber.textContent = count.toString();
			} else {
				countdownNumber.textContent = 'GO!';
				setTimeout(() => {
					countdownOverlay?.classList.add('hidden');
				}, 800);
				clearInterval(interval);
			}
		}, 1000);
	})

	// **** CURRENT USER SET PAUSE ****
	const pauseBtn = document.querySelector('#pause-btn') as HTMLButtonElement;
	pauseBtn?.addEventListener('click', (e: Event) => {
		e.preventDefault();
		
		const stopPauseBtn = document.querySelector('#stop-pause-btn') as HTMLButtonElement;
		const playerPauseOverlay = document.querySelector('#player-set-pause-overlay') as HTMLDivElement;
		const timer = document.querySelector('#player-pause-timer') as HTMLParagraphElement;

		playerPauseOverlay?.classList.remove('hidden');
		gameConnection?.send({ type: 'pause', action: 'stop', pausedby: currentUser.id});

		let count = 10;
		timer.textContent = count.toString();
		playerPauseInterval = setInterval(() => {
			count--;
			if (count >= 0) {
				timer.textContent = count.toString();
			} else {
				if (playerPauseInterval) {
					clearInterval(playerPauseInterval);
					playerPauseInterval = null;
					gameConnection?.send({ type: 'quit', looser: currentUser.id});
				}
			}
		}, 1000);

		stopPauseBtn.addEventListener('click', (e) => {
			e.preventDefault();
			gameConnection?.send({ type: 'pause', action: 'resume'});
			playerPauseOverlay?.classList.add('hidden');
			if (playerPauseInterval) {
				clearInterval(playerPauseInterval);
				playerPauseInterval = null;
			}
		});
	});

	// **** GAME PAUSED BY OPPONENT ****
	document.addEventListener('event-pause-game', (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;

		const opponentPauseOverlay = document.querySelector('#opponent-set-pause-overlay') as HTMLDivElement;
		const timer = document.querySelector('#opponent-pause-timer') as HTMLParagraphElement;

		if (!opponentPauseOverlay)
			return;

		console.log('opponent pause overlay');
		if (data.status === true) {
			let count = 10;
			timer.textContent = count.toString();
			opponentPauseOverlay.classList.remove('hidden');
			opponentPauseInterval = setInterval(() => {
				count--;
				if (count >= 0) {
					timer.textContent = count.toString();
				} else {
					if (opponentPauseInterval) {
						clearInterval(opponentPauseInterval);
						opponentPauseInterval = null;
					}
				}
			}, 1000)
		} if (data.status === false) {
			opponentPauseOverlay.classList.add('hidden');
			if (opponentPauseInterval) {
				clearInterval(opponentPauseInterval);
				opponentPauseInterval = null;
			}
		}
	})

	// **** PLAYER DISCONNECTED ****
	let disconnectInterval: number | null = null;
	document.addEventListener('event-player-disconnected', (e: Event) => {
		e.preventDefault();
		console.log('🔌 Player disconnected');
		
		const disconnectOverlay = document.querySelector('#player-disconnected-overlay') as HTMLDivElement;
		const disconnectTimer = document.querySelector('#disconnect-timer') as HTMLParagraphElement;
		
		if (!disconnectOverlay || !disconnectTimer) return;
		
		let count = 30;
		disconnectTimer.textContent = count.toString();
		disconnectOverlay.classList.remove('hidden');
		
		disconnectInterval = setInterval(() => {
			count--;
			if (count >= 0) {
				disconnectTimer.textContent = count.toString();
			} else {
				if (disconnectInterval) {
					clearInterval(disconnectInterval);
					disconnectInterval = null;
				}
			}
		}, 1000);
	});

	// **** PLAYER RECONNECTED ****
	document.addEventListener('event-player-reconnected', (e: Event) => {
		e.preventDefault();
		console.log('🔄 Player reconnected');
		
		const disconnectOverlay = document.querySelector('#player-disconnected-overlay') as HTMLDivElement;
		
		if (!disconnectOverlay) return;
		
		disconnectOverlay.classList.add('hidden');
		
		if (disconnectInterval) {
			clearInterval(disconnectInterval);
			disconnectInterval = null;
		}
	});
}



// ======== UTILS ============
function getGameHeight(): number
{
	const gameArea = document.getElementById("arena")
	return (gameArea!.clientHeight);
}

function getGameWidth(): number
{
	const gameArea = document.getElementById("arena")
	return (gameArea!.clientWidth);
}