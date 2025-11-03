
import clapImage from '../images/clap.png';

export function home() {

	const app = document.getElementById('app');
	if (app) {
		app.innerHTML = /*html*/`
		<div>
			<div class="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
				<div class="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
					<h1 class="max-w-2xl text-xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl lg:col-span-2 xl:col-auto dark:text-white">Let's Pong</h1>
					<div class="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
					<p class="text-lg text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">Welcome to our transcendance project</p>
					<div class="mt-10 flex items-center gap-x-6">
						<a href="/register" class="btn-primary">Get started</a>
						<a href="/learnmore" class="btn-primary">Learn more <span aria-hidden="true">→</span></a>

					</div>
					</div>
					<img src="${clapImage}" alt="" class="mt-10 aspect-6/5 w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-36 dark:outline-white/10" />
				</div>
			</div>
		</div>
		`
	}
}

