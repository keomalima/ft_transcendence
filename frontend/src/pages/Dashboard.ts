import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";
import { friendshipApi } from "../api/friendshipApi.js";
import { userService } from "../services/UserService.js";

// import HTML components
import "../components/NavBar.js";
import "../components/FriendList.js";
import "../components/MatchHistory.js";
import "../components/FriendRequests.js";
import "../components/AddFriend.js";


export function Dashboard(ctx: AppContext): string{
    // get user data from store
    const currentUser: UserState | null = ctx.userStore.get();
    console.log('current user ', currentUser);

    // secure if no access token or user ID
    if (!currentUser?.accessToken || !currentUser?.id)
    {
        console.log('no session when accessing /home')
        router.navigateTo('/');
        return '';
    }

	setTimeout(() => {
		passContext(ctx);
		setupHomeEventListeners(ctx);
	}, 0);

	const content = /*html*/`

		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<!-- First part : welcome / games / notifications -->
		<div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
		<div class="mt-10 grid gap-4 sm:mt-16 lg:gap-6 lg:grid-cols-3 lg:grid-rows-3">
			<div class="lg:row-span-3 rounded-lg order-1 lg:order-0">
				<h1 class='text-4xl lg:text-4xl break-words'>Welcome,</br>${currentUser.name ?? 'User'}</h1>
			</div>
			<div class="relative rounded-lg bg-medium order-2 lg:order-0">
					<h1>Create a new gane</h1>
				</div>
				<div class="relative rounded-lg bg-medium order-3 lg:order-0 lg:col-start-2 lg:row-start-2">
					<h1>Join a game</h1>
				</div>
				<div class="relative rounded-lg bg-medium order-3 lg:order-0 lg:col-start-2 lg:row-start-3">
					<h1>Log out</h1>
				</div>
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
					<requests-list id='requests-component' class="p-4 lg:p-10 rounded-lg bg-white order-last lg:order-0 lg:col-start-3 lg:row-start-1"></requests-list>
					<add-friend id='add-friend-component' class="p-4 lg:p-10 rounded-lg bg-white order-first lg:order-0 lg:col-start-3 lg:row-start-2"></add-friend>

					<!-- <div id='add-new-friend' class="p-4 lg:p-10 rounded-lg bg-white order-first lg:order-0 lg:col-start-3 lg:row-start-2">
						<h1>Add a new friend</h1>
					</div> -->
					<friend-list id='friend-list-component' class="grow rounded-lg bg-white shadow-sm p-4 lg:p-10 order-2 lg:order-0 lg:col-start-3 lg:row-start-3 lg:row-span-3"></friend-list>
				</div>
			</div>
		</div>
	`
	return (content);
}

// ======== PASS CONTEXT ========
function passContext(ctx: AppContext) {
	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
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
	}

}

// ======== EVENT LISTENER ============
function setupHomeEventListeners(ctx: AppContext) {

	const friendListComponent = document.getElementById('friend-list-component') as any;

	// **** DELETE FRIEND ****
	friendListComponent?.addEventListener('event-delete-friend', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		try {
			if (data.friendshipId && data.accessToken) {
				await friendshipApi.delete(data.friendshipId, data.accessToken);
				console.log('Friend deleted successfully');
			}
		} catch (error) {
			console.log('Error deleting friend:', error);
		}
	});
}



// deleteBtn.addEventListener('click', (e) => {
// 			console.log('event delete friend on ', friend.name);
// 			try {
// 				if (friend.friendshipId)
// 					friendshipApi.delete(friend.friendshipId, this._accessToken!);
// 				card.remove();
// 			} catch (error) {

// 			}
// 		});