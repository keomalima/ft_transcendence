import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";
import { friendshipApi } from "../api/friendshipApi.js";
import { gameService } from "../services/GameService.js";

// import HTML components
import "../components/NavBar.js";
import "../components/FriendList.js";
import "../components/MatchHistory.js";
import "../components/FriendRequests.js";
import "../components/AddFriend.js";
import "../components/JoinGamePopUp.js";
import type { FriendData, GameHistory } from "../types.js";
import { tournamentApi } from "../api/tournamentApi.js";
import { API_BASE_URL } from "../config.js";

export const PONG_MANTRAS: string[] = [
  "Keep your eye on the ball.",
  "Don't miss the bounce.",
  "Master the angle, master the game.",
  "Precision is your best paddle.",
  "Deflect the noise, focus on the goal.",
  "Ready Player One?",
  "Winners never quit, quitters never win.",
  "Level up your mindset.",
  "Victory favors the focused.",
  "Play hard, stay humble.",
  "The paddle is an extension of your mind.",
  "Simple game, infinite possibilities.",
  "The wall is just a rebound away.",
  "Speed is relative, timing is everything.",
  "Control the bounce, control the world.",
  "Physics doesn't lie.",
  "Zero lag, pure focus.",
  "Hit the corner, take the point.",
  "Stay centered, play wide.",
  "The table is your canvas.",
  "Perfect timing beats raw speed.",
  "Navigate the friction.",
  "A steady hand wins the rally.",
  "The screen has no limits.",
  "Geometry is your secret weapon.",
  "Find the rhythm in the ping-pong.",
  "Paddle up, eyes forward."
];

/**
 * Récupère un mantra aléatoire de la liste.
 */
export const getRandomMantra = (): string => {
  const randomIndex = Math.floor(Math.random() * PONG_MANTRAS.length);
  return PONG_MANTRAS[randomIndex];
};

export function Dashboard(ctx: AppContext): string{
    // get user data from store
    const currentUser: UserState | null = ctx.userStore.get();

	setTimeout( async () => {
		const currentGame = await getCurrentGame(ctx);
		const currentTournament = await getCurrentTournament();
		renderDashboardContent(currentUser!, currentGame, currentTournament?.tournamentId);
		const gameHistory: GameHistory[] = await gameService.getHistory();
		passContext(ctx, gameHistory);
		setupDashboardEventListeners(ctx);
	}, 0);

	
	return (/*html*/`
		<div id="dashboard-content">
			<p class='flex items-center justify-center h-screen'>Loading home data...</p>
		</div>
		`);
}

// ======== UPDATE CONTENT ========
function renderDashboardContent(currentUser: UserState, currentGame: {gameId: string, status: string, token: string | null, type: string, userId:string} | null, tournamentId: string | undefined) {
	const content = document.getElementById('dashboard-content');

    const avatarRaw = currentUser.avatarUrl || '/uploads/avatars/default.jpg';
    const avatarSrc = /^https?:\/\//i.test(avatarRaw) ? avatarRaw : `${API_BASE_URL}${avatarRaw}`;

	console.log("Avatar picture URL", avatarSrc);
	let link: string | null  = null;
	if (tournamentId)
		link = `/tournament-room/${tournamentId}`
	else if (currentGame) {
		if (currentGame.type === 'LOCAL')
			link = `/local-game/${currentGame.gameId}`;
		else if (currentGame.status === 'PENDING')
			link = `/game-room/${currentGame.gameId}`;
		else if (currentGame.status === 'IN_PROGRESS')
			link = `/game/${currentGame.gameId}`;
	}

	content!.innerHTML = /*html*/`

		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<!-- First part : welcome / games / notifications -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
			<div class="mt-10 grid gap-4 sm:mt-16 lg:gap-6 lg:grid-cols-3 lg:grid-rows-3">
				<div class="lg:row-span-3 rounded-lg order-1 lg:order-0">
					<img src='${avatarSrc}' class='w-20 h-20 bg-gray-300 rounded-full object-cover shrink-0'></img>
					<h1 class='mt-5 ml-5 text-4xl lg:text-4xl break-words truncate'>Welcome,</br><span>${currentUser.name ?? 'User'}</span></h1>
				</div>
				${tournamentId ?
					`
						<a data-link href='${link}' class="rounded-lg p-5 lg:p-0 bg-black order-2 lg:order-0 lg:row-span-2 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg">
							<p class='text-white' >You have an ongoing tournament</p>
							<p class='font-[Calistoga] text-white text-3xl cursor-pointer'>Enter tournament</p>
						</a>

						<a data-link href='/live-chat' class="relative rounded-lg bg-black order-3 lg:order-0 lg:col-start-2 lg:row-start-3 flex items-center justify-center cursor-pointer hover:shadow-lg">
							<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Live Chat</p>
						</a>

						`
					:
					currentGame?.gameId ?
						`
							<a data-link href='${link}' class="rounded-lg p-5 lg:p-0 bg-black order-2 lg:order-0 lg:row-span-2 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg">
								<p class='text-white' >You have a pending game</p>
								<p class='font-[Calistoga] text-white text-3xl cursor-pointer'>Enter game</p>
							</a>

							<a data-link href='/live-chat' class="relative rounded-lg bg-black order-3 lg:order-0 lg:col-start-2 lg:row-start-3 flex items-center justify-center cursor-pointer hover:shadow-lg">
								<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Live Chat</p>
							</a>

						`
						:
						`
							<a data-link href='/create-game' class="relative rounded-lg bg-black order-2 lg:order-0 flex items-center justify-center cursor-pointer hover:shadow-lg">
								<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Create new game</p>
							</a>
							<a onclick="document.getElementById('join-game-dialog').showModal()" class="relative rounded-lg bg-black order-3 lg:order-0 lg:col-start-2 lg:row-start-2 flex items-center justify-center cursor-pointer hover:shadow-lg">
								<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Join a game</p>
							</a>
							<a data-link href='/live-chat' class="relative rounded-lg bg-black order-3 lg:order-0 lg:col-start-2 lg:row-start-3 flex items-center justify-center cursor-pointer hover:shadow-lg">
								<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Live Chat</p>
							</a>

						`
				}
				<div id='achievements' class="relative lg:row-span-3 rounded-lg bg-white bg-opacity-50 p-4 lg:p-10 order-4 lg:order-0">
					<h1>Your mantra</h1>
					<p class='font-[Calistoga] text-center mt-10 mb-10 lg:mb-0 text-2xl'>"${getRandomMantra()}"</p>
				</div>
			</div>
		</div>
		<!-- Second part : match history / friends -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
			<div class="my-10 grid gap-4 lg:gap-6 lg:grid-cols-3 grid-rows-1">
				<div class="max-h-200 lg:col-span-2 min-w-0 order-3 lg:order-0">
					<match-history id='match-component' class="bg-white p-4 lg:p-10 shadow-sm rounded-lg h-full flex flex-col gap-3 max-h-[80vh] lg:max-h-[50vh]"></match-history>
				</div>
				<div class='flex flex-col col-span-1 gap-5 min-h-full'>
					<requests-list id='requests-component' class="p-4 lg:p-10 rounded-lg bg-white order-first lg:order-0 lg:col-start-3 lg:row-start-1 max-h-[30vh] lg:max-h-[50vh]"></requests-list>
					<add-friend id='add-friend-component' class="p-4 lg:p-10 rounded-lg bg-white order-0 lg:order-0 lg:col-start-3 lg:row-start-2"></add-friend>
					<friend-list id='friend-list-component' class="grow rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3 max-h-[30vh] lg:max-h-[50vh]"></friend-list>
				</div>
			</div>
		</div>
		<!-- Dialog for join game -->
		<dialog id="join-game-dialog" class="place-self-center">
			<join-game-pop-up id="join-game-component"></join-game-pop-up>
		</dialog>
	`
}

// ======== GET CURRENT GAME ============
async function getCurrentGame(ctx: AppContext): Promise<{userId: string, gameId: string, type: string, status: string, token: string | null} | null> {
	try {
		const currentGame = await gameService.getCurrentGame(ctx);
		return currentGame;
	} catch(error) {
		//console.log(error);
		return null;
	}
}

// ======== GET CURRENT TOURNAMENT ============
async function getCurrentTournament(): Promise<{userId: string, tournamentId: string, type: string, token: string | null} | null> {
	try {
		const currentTournament = await tournamentApi.getCurrentTournament();
		return currentTournament;
	} catch(error) {
		//console.log(error);
		return null;
	}
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext, gameHistory: GameHistory[]) {
	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
	const joinGameComponent = document.getElementById('join-game-component') as any;
	if (joinGameComponent) {
		joinGameComponent.type = 'game';
		joinGameComponent.ctx = ctx;
	}
	const friendListComponent = document.getElementById('friend-list-component') as any;
	if (friendListComponent) {
		friendListComponent.ctx = ctx;
	}
	const requestsComponent = document.getElementById('requests-component') as any;
	if (requestsComponent) {
		requestsComponent.ctx = ctx;
	}
	const addFriendComponent = document.getElementById('add-friend-component') as any;
	if (addFriendComponent) {
		addFriendComponent.ctx = ctx;
	}
	const matchHistoryComponent = document.getElementById('match-component') as any;
	if (matchHistoryComponent) {
		matchHistoryComponent.ctx = ctx;
		matchHistoryComponent.gameHistory = gameHistory;
	}
}

// ======== EVENT LISTENER ============
function setupDashboardEventListeners(ctx: AppContext) {

	const friendListComponent = document.getElementById('friend-list-component') as any;
	const requestsComponent = document.getElementById('requests-component') as any;
	const addFriendComponent = document.getElementById('add-friend-component') as any;
	const errorMsg = document.getElementById('add-friend-message') as HTMLElement;
	const joinGameComponent = document.getElementById('join-game-component') as any;

	// **** DELETE FRIEND ****
	friendListComponent?.addEventListener('event-delete-friend', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.friendshipId) {
				await friendshipApi.delete(data.friendshipId);
				
				// Refresh friend list after deletion
				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			//console.log('Error deleting friend:', error);
		}
	});

	// **** ACCEPT FRIEND ****
	requestsComponent?.addEventListener('event-accept-friend', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.requestId) {
				await friendshipApi.accept(data.requestId);
				
				// Refresh both lists after accepting
				if (requestsComponent.loadAndRender) {
					await requestsComponent.loadAndRender();
				}
				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			//console.log('Error accepting friend:', error);
		}
	});

	// **** REJECT FRIEND ****
	requestsComponent?.addEventListener('event-reject-friend', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.requestId) {
				await friendshipApi.reject(data.requestId);

				// Refresh both lists after accepting
				if (requestsComponent.loadAndRender) {
					await requestsComponent.loadAndRender();
				}
				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			//console.log('Error rejecting friend:', error);
		}
	});

	// **** SEND FRIEND REQUEST ****
	addFriendComponent?.addEventListener('event-send-friendship-request', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.friendName) {
				await friendshipApi.sendRequest(data.friendName);
				if (errorMsg) {
					errorMsg.className = 'text-green-500 text-sm mt-2';
					errorMsg.innerText = `Friend request sent successfully to ${data.friendName}!`;
				}
			}
		} catch (error) {
			if (errorMsg) {
				errorMsg.className = 'text-red-500';
				errorMsg.innerText = error instanceof Error ? error.message : 'Failed to send friend request';
			}
			//console.log('Error send friendship request:', error);
		}
	});

	// **** JOIN A GAME ****
	joinGameComponent?.addEventListener('event-join-game', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const gameToken = customEvent.detail;
		try {
			const result = await gameService.joinGame(gameToken, ctx);
			router.navigateTo(`/game-room/${result!.gameId}`);
		} catch (error) {
			const errorMsgJoinGame = document.querySelector('#error-join-game') as HTMLParagraphElement;
			errorMsgJoinGame.className = 'mt-2 text-red-500'
			errorMsgJoinGame.innerText = error as string;
			//console.log(error);
		}
	})

	// **** Show msg for block/unblock at left-up corner ***
	function showToast(message: string, type: 'block' | 'unblock') {
		const toast = document.createElement('div');
		toast.textContent = message;

		toast.className = `
			fixed top-4 left-4 z-50
			min-w-[200px] text-center
			px-4 py-2 rounded shadow-lg
			text-white font-medium
			${type === 'block' ? 'bg-red-600' : 'bg-green-600'}
		`;

		document.body.appendChild(toast);

		setTimeout(() => {
			toast.remove();
		}, 2000);
	}

}
