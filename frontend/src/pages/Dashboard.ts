import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";
import { friendshipApi } from "../api/friendshipApi.js";

// import HTML components
import "../components/NavBar.js";
import "../components/FriendList.js";
import "../components/MatchHistory.js";
import "../components/FriendRequests.js";
import "../components/AddFriend.js";
import "../components/JoinGamePopUp.js";
import { gameApi } from "../api/gameApi.js";
import type { GameHistory } from "../types.js";


export function Dashboard(ctx: AppContext): string{
    // get user data from store
    const currentUser: UserState | null = ctx.userStore.get();

    // secure if no access token or user ID
    if (!currentUser || !currentUser?.accessToken || !currentUser?.id)
    {
        console.log('no session when accessing /home')
        setTimeout(() => router.navigateTo('/'), 0);
        return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
    }

	setTimeout( async () => {
		const currentGame = await getCurrentGame(currentUser.accessToken!);
		renderDashboardContent(currentUser, currentGame?.gameId!);
		const gameHistory: GameHistory[] = await gameApi.getHistory(currentUser?.accessToken!);
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
function renderDashboardContent(currentUser: UserState, gameId: string | null) {
	const content = document.getElementById('dashboard-content');
	content!.innerHTML = /*html*/`

		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<!-- First part : welcome / games / notifications -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
			<div class="mt-10 grid gap-4 sm:mt-16 lg:gap-6 lg:grid-cols-3 lg:grid-rows-3">
				<div class="lg:row-span-3 rounded-lg order-1 lg:order-0">
					<img src='http://localhost:3000${currentUser.avatarUrl}' class='w-20 h-20 bg-gray-300 rounded-full object-cover shrink-0'></img>
					<h1 class='mt-5 ml-5 text-4xl lg:text-4xl break-words'>Welcome,</br><span>${currentUser.name ?? 'User'}</span></h1>
				</div>

				${gameId ?
					`
						<a data-link href='/game-room/${gameId}'class="rounded-lg p-5 lg:p-0 bg-black order-2 lg:order-0 lg:row-span-2 flex flex-col items-center justify-center cursor-pointer">
							<p class='text-white' >You have a pending game</p>
							<p class='font-[Calistoga] text-white text-3xl cursor-pointer'>Enter game</p>
						</a>

						<div class="relative rounded-lg bg-white order-3 lg:order-0 lg:col-start-2 lg:row-start-3 flex items-center justify-center">
							<h1>???</h1>
						</div>
					`
					:
					`
						<a data-link href='/create-game' class="relative rounded-lg bg-black order-2 lg:order-0 flex items-center justify-center cursor-pointer">
							<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Create new game</p>
						</a>
						<a onclick="document.getElementById('join-game-dialog').showModal()" class="relative rounded-lg bg-black order-3 lg:order-0 lg:col-start-2 lg:row-start-2 flex items-center justify-center cursor-pointer">
							<p class='font-[Calistoga] m-5 text-white text-3xl cursor-pointer'>Join a game</p>
						</a>
						<div class="relative rounded-lg bg-white order-3 lg:order-0 lg:col-start-2 lg:row-start-3 flex items-center justify-center">
							<h1>???</h1>
						</div>
					`
				}

				


				<div id='achievements' class="relative lg:row-span-3 rounded-lg bg-white p-4 lg:p-10 order-4 lg:order-0">
					<h1>Your achievements</h1>
				</div>
			</div>
		</div>
		<!-- Second part : match history / friends -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
			<div class="my-10 grid gap-4 lg:gap-6 lg:grid-cols-3 grid-rows-1">
				<div class="max-h-200 lg:col-span-2 min-w-0 order-3 lg:order-0">
					<match-history id='match-component' class="bg-white p-4 lg:p-10 shadow-sm rounded-lg h-full flex flex-col gap-3"></match-history>
				</div>
				<div class='flex flex-col col-span-1 gap-5 min-h-full'>
					<requests-list id='requests-component' class="p-4 lg:p-10 rounded-lg bg-white order-first lg:order-0 lg:col-start-3 lg:row-start-1"></requests-list>
					<add-friend id='add-friend-component' class="p-4 lg:p-10 rounded-lg bg-white order-0 lg:order-0 lg:col-start-3 lg:row-start-2"></add-friend>
					<friend-list id='friend-list-component' class="grow rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3"></friend-list>
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
async function getCurrentGame(token: string): Promise<{userId: string, gameId: string, type: string, status: string, token: string | null} | null> {
	try {
		const currentGame = await gameApi.getCurrentGame(token);
		return currentGame;
	} catch(error) {
		console.log(error);
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
			if (data.friendshipId && data.accessToken) {
				await friendshipApi.delete(data.friendshipId, data.accessToken);
				
				// Refresh friend list after deletion
				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			console.log('Error deleting friend:', error);
		}
	});

	// **** ACCEPT FRIEND ****
	requestsComponent?.addEventListener('event-accept-friend', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.requestId && data.accessToken) {
				await friendshipApi.accept(data.requestId, data.accessToken);
				
				// Refresh both lists after accepting
				if (requestsComponent.loadAndRender) {
					await requestsComponent.loadAndRender();
				}
				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			console.log('Error accepting friend:', error);
		}
	});

	// **** REJECT FRIEND ****
	requestsComponent?.addEventListener('event-reject-friend', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.requestId && data.accessToken) {
				await friendshipApi.reject(data.requestId, data.accessToken);

				// Refresh both lists after accepting
				if (requestsComponent.loadAndRender) {
					await requestsComponent.loadAndRender();
				}
				if (friendListComponent.loadAndRender) {
					await friendListComponent.loadAndRender();
				}
			}
		} catch (error) {
			console.log('Error rejecting friend:', error);
		}
	});

	// **** SEND FRIEND REQUEST ****
	addFriendComponent?.addEventListener('event-send-friendship-request', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.accessToken && data.friendName) {
				await friendshipApi.sendRequest(data.friendName, data.accessToken);
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
			console.log('Error send friendship request:', error);
		}
	});

	// **** JOIN A GAME ****
	joinGameComponent?.addEventListener('event-join-game', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		const accessToken = ctx.userStore.get()?.accessToken;
		if (!accessToken)
			return;
		try {
			const result = await gameApi.joinGame(accessToken, data);
			router.navigateTo(`/game-room/${result.gameId}`);
		} catch (error) {
			const errorMsgJoinGame = document.querySelector('#error-join-game') as HTMLParagraphElement;
			errorMsgJoinGame.className = 'mt-2 text-red-500'
			errorMsgJoinGame.innerText = error as string;
			console.log(error);
		}
	})

}
