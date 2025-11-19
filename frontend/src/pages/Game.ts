import { AppContext, UserState } from "../types.js";
import { router } from "../main.js";
import { friendshipApi } from "../api/friendshipApi.js";

// import HTML components
import "../components/NavBar.js";
import "../components/FriendList.js";
import "../components/MatchHistory.js";
import "../components/FriendRequests.js";
import "../components/AddFriend.js";


export function CreateGame(ctx: AppContext): string{
    // get user data from store
    const currentUser: UserState | null = ctx.userStore.get();
    console.log('current user ', currentUser);

    // secure if no access token or user ID
    if (!currentUser?.accessToken || !currentUser?.id)
    {
        console.log('no session when accessing /home')
        setTimeout(() => router.navigateTo('/'), 0);
        return '<div class="flex items-center justify-center h-screen"><p>Redirecting to home...</p></div>';
    }

	setTimeout(() => {
		passContext(ctx);
		setupGameEventListeners(ctx);
	}, 0);

	const styleLabel = 'inline-flex items-center justify-between w-full px-5 py-2 outline outline-1 outline-black rounded-full cursor-pointer peer-checked:bg-black peer-checked:text-white'

	const content = /*html*/`
	<div class="flex flex-col min-h-screen">
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>

		<div class="flex-1 flex flex-col items-center justify-center">
			<!-- Select mode -->
			<div id='select-mode' class='flex flex-col items-center justify-center'>
				<h1 class='text-2xl'>Select playing mode</h1>
				<ul class="flex flex-row mt-5 gap-8 justify-between">
					<li>
						<input type="radio" id="local-mode" name="mode" value="local-mode" class="hidden peer" required />
						<label for="local-mode" class='${styleLabel}'>                           
							Local mode
						</label>
					</li>
					<li>
						<input type="radio" id="remote-mode" name="mode" value="remote-mode" class="hidden peer">
						<label for="remote-mode" class='${styleLabel}'>
							Remote mode
						</label>
					</li>
				</ul>
			</div>
			<!-- Select score -->
			<div id='select-mode' class='flex flex-col items-center'>
				<h1 class='text-2xl'>Select playing mode</h1>
				<ul class="flex flex-row mt-5 gap-8 justify-between">
					<li>
						<input type="radio" id="local-mode" name="mode" value="local-mode" class="hidden peer" required />
						<label for="local-mode" class='${styleLabel}'>                           
							Local mode
						</label>
					</li>
					<li>
						<input type="radio" id="remote-mode" name="mode" value="remote-mode" class="hidden peer">
						<label for="remote-mode" class='${styleLabel}'>
							Remote mode
						</label>
					</li>
				</ul>
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

}

// ======== EVENT LISTENER ============
function setupGameEventListeners(ctx: AppContext) {

}
