import type { UserState, GameData, AppContext } from "../types";
import { sharedGameState } from "../game/sharedGameState.js";
import { router } from "../main.js";
import { gameService } from "../services/GameService.js";
import { FinishGameDto } from "../api/gameApi.js";
import { cleanGameWS } from "./Game.js";

// Simple global interval registry so router can clear intervals on navigation
export function registerInterval(id: number) {
	(window as any).__gameIntervals = (window as any).__gameIntervals || [];
	(window as any).__gameIntervals.push(id);
}

export function clearAllIntervals() {
	const arr: number[] = (window as any).__gameIntervals || [];
	arr.forEach((id) => {
		try { clearInterval(id); } catch (e) {}
	});
	(window as any).__gameIntervals = [];
}

// ======== EVENT LISTENER ============
export function setupGameEventListeners(currentUser: UserState, currentGame: GameData, gameId: string, ctx: AppContext) {

	// console.log(currentGame);
	if (!currentGame || !currentGame.gameUsers || currentGame.gameUsers.length < 2) {
		// console.log('❌ Missing current game');
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
	let disconnectInterval: number | null = null;

	// **** ALREADY IN GAME ****
	document.addEventListener('event-already-in-game', (e: Event) => {
		e.preventDefault();
		const customEvent = e as CustomEvent;

		// console.log('You already are in this game, redirection to home');
		if (currentGame.type === 'TOURNAMENT') {
			router.navigateTo(`/tournament/${currentGame.tournamentId}`);
		} else {
			router.navigateTo(`/home`);
		}
	})

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

	// **** GO BACK GAME ****
	const goBackButton = document.getElementById('go-back-btn');
	goBackButton?.addEventListener('click', (e) => {
		e.preventDefault();
		if (currentGame.type === 'TOURNAMENT') {
			router.navigateTo(`/tournament/${currentGame.tournamentId}`);
		} else {
			router.navigateTo(`/home`);
		}
	});


	// **** CLAIM VICTORY ****
	const clainVictoryBtn = document.getElementById('claim-victory-btn');
	clainVictoryBtn?.addEventListener('click', (e) => {
		e.preventDefault();
		const looserId = currentGame.gameUsers?.find((player) => player.user?.id !== currentUser.id);

		const waitingOpponentOverlay = document.querySelector('#waiting-opponent-overlay') as HTMLDivElement | null;
		if (waitingOpponentOverlay) {waitingOpponentOverlay.classList.add('hidden')};

		sharedGameState.gameConnection?.send({ type: 'quit', looser: looserId});
		console.log('👑 claim victory');
	});

	
	// **** GIVE UP GAME ****
	const giveUpBtn = document.getElementById('give-up-btn');
	giveUpBtn?.addEventListener('click', (e) => {
		e.preventDefault();

		const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
		if (!quitDialog)
			return;

		quitDialog.showModal();
		const cancelBtn = document.querySelector('#cancel-give-up-btn') as HTMLButtonElement;
		const confirmBtn = document.querySelector('#confirm-give-up-btn') as HTMLButtonElement;

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
			sharedGameState.gameConnection?.send({ type: 'quit', looser: currentUser.id});
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

	
	// **** WON GAME ****
	document.addEventListener('event-won-game', async (e: Event) => {
		if (!currentGame.gameUsers || currentGame.gameUsers.length < 2) {
    		console.error('❌ Missing game users data');
			return;
		}

		hideAllOverlays();

		const wonGameOverlay = document.querySelector('#won-game-overlay') as HTMLDivElement;
		const winner = document.querySelector('#winner') as HTMLParagraphElement;
		const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
		const backHomeBtn = document.querySelector('#won-back-home-btn') as HTMLButtonElement;

		if (quitDialog?.open) {
			return;
		}
		if (!wonGameOverlay || !winner)
			return;

		const customEvent = e as CustomEvent;
		const isWinner = customEvent.detail.iswinner;
		if (isWinner === true)
			winner.innerText = `Congratulation you won the game !`;
		else
			winner.innerText = `Sorry, you've lost`;
		wonGameOverlay.classList.remove('hidden');
		
		backHomeBtn?.addEventListener('click', async () => {
			// console.log(currentGame);
			cleanGameWS();
			if (currentGame.type === 'TOURNAMENT' && currentGame.tournamentId) {
				router.navigateTo(`/tournament/${currentGame.tournamentId}`);
			}
			else
				router.navigateTo('/home');
		}, { once: true });

	}, { once: true });

	// **** ADANDONNED GAME ****
	document.addEventListener('event-abandoned-game', async (e: Event) => {
		if (!currentGame.gameUsers || currentGame.gameUsers.length < 2) {
    		console.error('❌ Missing game users data');
			return;
		}

		const customEvent = e as CustomEvent;
		const isWinner = customEvent.detail.iswinner;

		hideAllOverlays();

		const wonGameOverlay = document.querySelector('#won-game-overlay') as HTMLDivElement;
		const winner = document.querySelector('#winner') as HTMLParagraphElement;
		const backHomeBtn = document.querySelector('#won-back-home-btn') as HTMLButtonElement;

		if (!wonGameOverlay || !winner)
			return;

		if (isWinner === true)
			winner.innerText = `You win!`;
		else
			winner.innerText = `Game over`;
		wonGameOverlay.classList.remove('hidden');
		
		backHomeBtn?.addEventListener('click', async () => {
			cleanGameWS();
			if (currentGame.type === 'TOURNAMENT' && currentGame.tournamentId)
				router.navigateTo(`/tournament/${currentGame.tournamentId}`)
			else
				router.navigateTo('/home');
		}, { once: true });

	}, { once: true });


	// **** CURRENT USER SET PAUSE ****
	const pauseBtn = document.querySelector('#pause-btn') as HTMLButtonElement;
	pauseBtn?.addEventListener('click', (e: Event) => {
		e.preventDefault();
		
		const stopPauseBtn = document.querySelector('#stop-pause-btn') as HTMLButtonElement;
		const playerPauseOverlay = document.querySelector('#player-set-pause-overlay') as HTMLDivElement;
		const timer = document.querySelector('#player-pause-timer') as HTMLParagraphElement;

		playerPauseOverlay?.classList.remove('hidden');
		sharedGameState.gameConnection?.send({ type: 'pause', action: 'stop', pausedby: currentUser.id});

		let count = 10;
		timer.textContent = count.toString();
		playerPauseInterval = window.setInterval(() => {
			count--;
			if (count > 0) {
				timer.textContent = count.toString();
			} else {
				playerPauseOverlay?.classList.add('hidden');
				if (playerPauseInterval) {
					clearInterval(playerPauseInterval);
					playerPauseInterval = null;
				}
			}
		}, 900);
		registerInterval(playerPauseInterval as number);

		stopPauseBtn.addEventListener('click', (e) => {
			e.preventDefault();
			sharedGameState.gameConnection?.send({ type: 'pause', action: 'resume'});
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

		// console.log('opponent pause overlay');
		if (data.status === true) {
			let count = 10;
			timer.textContent = count.toString();
			opponentPauseOverlay.classList.remove('hidden');
			opponentPauseInterval = window.setInterval(() => {
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
			registerInterval(opponentPauseInterval as number);
		} if (data.status === false) {
			opponentPauseOverlay.classList.add('hidden');
			if (opponentPauseInterval) {
				clearInterval(opponentPauseInterval);
				opponentPauseInterval = null;
			}
		}
	})

	// **** PLAYER DISCONNECTED ****
	document.addEventListener('event-player-disconnected', (e: Event) => {
		e.preventDefault();
		// console.log('🔌 Player disconnected');
		
		const customEvent = e as CustomEvent;
		const timeoutSeconds = customEvent.detail?.timeoutSeconds || 30; // Use backend value or default to 30
		
		const disconnectOverlay = document.querySelector('#player-disconnected-overlay') as HTMLDivElement;
		const disconnectTimer = document.querySelector('#disconnect-timer') as HTMLParagraphElement;
		
		hideAllOverlays();
		if (playerPauseInterval) {
			clearInterval(playerPauseInterval);
			playerPauseInterval = null;
		}
		if (opponentPauseInterval) {
			clearInterval(opponentPauseInterval);
			opponentPauseInterval = null;
		}
		if (!disconnectOverlay || !disconnectTimer) return;
		
		let count = timeoutSeconds; // Start from backend's remaining time
		disconnectTimer.textContent = count.toString();
		disconnectOverlay.classList.remove('hidden');
		
		disconnectInterval = window.setInterval(() => {
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
		registerInterval(disconnectInterval as number);
	});

	// **** PLAYER RECONNECTED ****
	document.addEventListener('event-player-reconnected', (e: Event) => {
		e.preventDefault();
		// console.log('🔄 Player reconnected');
		
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

function hideAllOverlays(): void {
	const playerPauseOverlay = document.querySelector('#player-set-pause-overlay') as HTMLDivElement;
	if (playerPauseOverlay) {
		playerPauseOverlay.classList.add('hidden');
	}
	const opponentPauseOverlay = document.querySelector('#opponent-set-pause-overlay') as HTMLDivElement;
	if (opponentPauseOverlay) {
		opponentPauseOverlay.classList.add('hidden');
	}
	const quitDialog = document.querySelector('#quit-game-dialog') as HTMLDialogElement;
	if (quitDialog) {
		quitDialog.close();
	}
}

// Legacy helper removed - use exported clearAllIntervals() above which clears the global registry.