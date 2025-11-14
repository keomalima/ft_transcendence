import { userService } from "../services/UserService";
import { navigateTo } from "../main";

export function NavBar() {
	const navBar = document.getElementById('navigation-bar');
	if (navBar)
	{
		navBar.innerHTML = /*html*/`
			<nav aria-label="Global" class=" flex items-center justify-between p-6 lg:px-20">
				<a data-link href="/dashboard" class="nav-logo">
					<span class=''>Let's Pong !</span>
				</a>
				<div class="flex lg:hidden">
				<button type="button" command="show-modal" commandfor="mobile-menu" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700">
					<span class="sr-only">Open main menu</span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6">
					<path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
				</div>
					<div class="hidden lg:flex lg:gap-x-12">
					<a data-link href="/dashboard" class="nav-elem ${window.location.pathname === '/dashboard' ? 'text-black' : ''}" >home</a>
					<a data-link href="/profile" class="nav-elem ${window.location.pathname === '/profile' ? 'text-black' : ''}" >profile</a>
					<a data-link href="/game" class="nav-elem ${window.location.pathname === '/game' ? 'text-black' : ''}" >game</a>
					<a data-link href="/tournament" class="nav-elem ${window.location.pathname === '/tournament' ? 'text-black' : ''}" >tournament</a>
					<a id='logout-btn' href='/' class="nav-elem">Log out</a>
				</div>
			</nav>
			<el-dialog>
				<dialog id="mobile-menu" class="backdrop:bg-transparent lg:hidden">
				<div tabindex="0" class="fixed inset-0 focus:outline-none">
					<el-dialog-panel class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm ">
					<div class="flex items-center justify-between">
						<a data-link href="#" class="-m-1.5 p-1.5">
							<span class="font-['Calistoga'] text-black text-2xl">Let's Pong !</span>
						</a>
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
							<a data-link href="/dashboard" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">home</a>
							<a data-link href="/profile" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">profile</a>
							<a data-link href="/game" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">game</a>
							<a data-link href="/tournament" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 text-black hover:bg-gray-50">tournament</a>
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

	// Logout listener
	const logoutBtn = document.getElementById('logout-btn') as HTMLElement;
	logoutBtn.addEventListener('click', async (e) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			const user = await userService.logoutUser();
			navigateTo('/');
		} catch (error) {
			console.log(error);
		}
	});

	const logoutBtn2 = document.getElementById('logout-btn-2') as HTMLElement;
	logoutBtn2.addEventListener('click', async (e) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			const user = await userService.logoutUser();
			navigateTo('/');
		} catch (error) {
			console.log(error);
		}
	});

	return navBar;
}
