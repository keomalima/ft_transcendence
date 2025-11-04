export function NotFound() {
	const app = document.getElementById('app');
	if (app)
	{
		app.innerHTML = '';
		app.innerHTML = /*html*/
		`
			<main class="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
			<div class="text-center">
				<p class="font-bold">404</p>
				<h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl dark:text-white">Page not found</h1>
				<p class="mt-6 text-lg text-pretty text-medium sm:text-xl/8 dark:text-gray-400">Sorry, we couldn’t find the page you’re looking for.</p>
				<div class="mt-10 flex items-center justify-center gap-x-6">
					<a href="/" class="styled-link">Go back home</a>
				</div>
			</div>
			</main>
		`;
	}
}
