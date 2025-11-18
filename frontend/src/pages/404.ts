import { router } from "../main.js";

export function NotFound(): string {

	setTimeout(() => {
			setup404EventListeners();
		}, 0);

	const content:string = /*html*/`
		<main class="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
		<div class="text-center">
			<p class="font-bold">404</p>
			<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">Page not found</h1>
			<p class="mt-6 text-lg text-pretty text-medium sm:text-xl/8 ">Sorry, we couldn’t find the page you’re looking for.</p>
			<div class="mt-10 flex items-center justify-center gap-x-6">
				<a data-link href="#" id='back-btn' class="styled-link">Go back</a>
			</div>
		</div>
		</main>
	`;

	return content;
}

function setup404EventListeners() {
	// Click handler : back
	const startedBtn = document.getElementById('back-btn');
	startedBtn?.addEventListener('click', (e) => {
		e.preventDefault();
		if (window.history.length > 1) {
			window.history.back();
		}
		else {
			router.navigateTo('/home');
		}
	});
}