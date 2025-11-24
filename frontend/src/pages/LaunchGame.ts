import { router } from "../main.js";

export function LaunchGame(): string {

	setTimeout(() => {
			setupLaunchGameEventListeners();
		}, 0);

	const content:string = /*html*/`
		<main class="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
		<div class="text-center">
		<p class="font-bold">GAME</p>
		<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">The game will be displayed here</h1>
		<div class="mt-10 flex items-center justify-center gap-x-6">
			<button id='back-btn' class="styled-link">Go back</button>
		</div>
	</div>
		</main>
	`;

	return content;
}

function setupLaunchGameEventListeners() {
	// Click handler : back
	const backBtn = document.getElementById('back-btn');
	backBtn?.addEventListener('click', () => {
		if (window.history.length > 1) {
			window.history.back();
		}
		else {
			router.navigateTo('/home');
		}
	});
}