import { AppContext } from "../types.js";
import { router } from "../main.js";
import { userService } from "../services/UserService.js";

// import style 
import { NAV_ELEM_CLASSES, NAV_LOGO_CLASSES, NAV_ELEM_SELECTED_CLASSES } from "../styles/tailwindStyles.js";

export class NavBar extends HTMLElement {

	private _ctx: AppContext | null = null;

	constructor() {
		super();
		this.render();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
		this.attachEventListener(this._ctx);
	}

	private render() {
		this.innerHTML = /*html*/`
			<nav aria-label="Global" class=" flex items-center justify-between p-6 lg:px-20">
				<a data-link href="/home" class='${NAV_LOGO_CLASSES}'>Let's Pong !</a>
				<div class="flex lg:hidden">
				<button type="button" command="show-modal" commandfor="mobile-menu" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700">
					<span class="sr-only">Open main menu</span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6">
					<path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
				</div>
					<div class="hidden lg:flex lg:gap-x-12">
					<a data-link href="/home" class="${window.location.pathname === '/home' ? NAV_ELEM_SELECTED_CLASSES : NAV_ELEM_CLASSES}" >home</a>
					<a data-link href="/profile" class="${window.location.pathname === '/profile' ? NAV_ELEM_SELECTED_CLASSES : NAV_ELEM_CLASSES}" >profile</a>
					<a data-link href="/create-game" class="${window.location.pathname === '/create-game' ? NAV_ELEM_SELECTED_CLASSES : NAV_ELEM_CLASSES}" >game</a>
					<a data-link href="/tournament" class="${window.location.pathname === '/tournament' ? NAV_ELEM_SELECTED_CLASSES : NAV_ELEM_CLASSES}" >tournament</a>
					<a data-link href="/live-chat" class="${window.location.pathname === '/live-chat' ? NAV_ELEM_SELECTED_CLASSES : NAV_ELEM_CLASSES}">live chat</a>
					<a id='logout-btn' href='/' class="${NAV_ELEM_CLASSES}">Log out</a>
				</div>
			</nav>
			<el-dialog>
				<dialog id="mobile-menu" class="backdrop:bg-transparent lg:hidden">
				<div tabindex="0" class="fixed inset-0 focus:outline-none">
					<el-dialog-panel class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm ">
					<div class="flex items-center justify-between">
						<a data-link href="/home" class="-m-1.5 p-1.5 font-['Calistoga'] text-black text-2xl">Let's Pong !</a>
						<button type="button" command="close" commandfor="mobile-menu" class="-m-2.5 rounded-md p-2.5 text-gray-700">
						<span class="sr-only">Close menu</span>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6">
							<path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						</button>
					</div>
					<div class="mt-6 flow-root">
						<div class="-my-6 divide-y divide-gray-500/10">
						<div class="space-y-2 py-6">
							<a data-link href="/home" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">home</a>
							<a data-link href="/profile" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">profile</a>
							<a data-link href="/create-game" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">game</a>
							<a data-link href="/tournament" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">tournament</a>
							<a data-link href="/live-chat" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">live chat</a>
						</div>
						<div class="py-6">
							<a id='logout-btn-2' href='/'class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">Log out</a>
						</div>
						</div>
					</div>
					</el-dialog-panel>
				</div>
				</dialog>
			</el-dialog>
		`
	}
	
	// ======== EVENT LISTENER ============
	
	private attachEventListener(ctx: AppContext) {
	
		// Logout listener
		const logoutBtn = document.getElementById('logout-btn') as HTMLElement;
		logoutBtn.addEventListener('click', async (e) => {
			e.preventDefault();
			e.stopPropagation();

			try {
				await userService.logoutUser(ctx); // Ensure logout is awaited
				router.navigateTo('/');
			} catch (error) {
				console.log(error);
			}
		});

		const logoutBtn2 = document.getElementById('logout-btn-2') as HTMLElement;
		logoutBtn2.addEventListener('click', async (e) => {
			e.preventDefault();
			e.stopPropagation();

			try {
				await userService.logoutUser(ctx); // Ensure logout is awaited
				router.navigateTo('/');
			} catch (error) {
				console.log(error);
			}
		});

	}
}

customElements.define('nav-bar', NavBar);
