
import pongimg from '../images/pong.png';

export function register() {

	const app = document.getElementById('app');
	if (app) {
		app.innerHTML = /*html*/`
		<div>
			<div class="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
				<div class="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
					<h1 class="max-w-2xl text-xl font-semibold tracking-tight text-balance sm:text-7xl lg:col-span-2 xl:col-auto dark:text-white">Let's Pong</h1>
					<div class="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
						<p class="text-lg text-pretty sm:text-xl/8 dark:text-gray-400">Welcome to our transcendance project</p>
						<div class="mt-10 flex items-center gap-x-6">
							<a href="/register" class="styled-link" id="get-started-btn">Get started</a>
							<a href="/learnmore" class="styled-link" id="learn-more-btn">Learn more <span aria-hidden="true">→</span></a>
						</div>
						<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm" id="signin-form" style="display: none;">
							<form action="#" method="POST" class="space-y-6">
							<div>
								<label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">Email address</label>
								<div class="mt-2">
								<input id="email" type="email" name="email" required autocomplete="email" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
								</div>
							</div>

							<div>
								<div class="flex items-center justify-between">
								<label for="password" class="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">Password</label>
								<div class="text-sm">
									<a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Forgot password?</a>
								</div>
								</div>
								<div class="mt-2">
								<input id="password" type="password" name="password" required autocomplete="current-password" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500" />
								</div>
							</div>

							<div>
								<button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Sign in</button>
							</div>
							</form>

							<p class="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
							Not a member?
							<a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Start a 14 day free trial</a>
							</p>
						</div>
					</div>
					<img src="${pongimg}" alt="" class="mt-10 aspect-5/5 w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-36" />
				</div>
			</div>
		</div>
		`

		const startedBtn = document.getElementById('get-started-btn');
		const learnBtn = document.getElementById('learn-more-btn');
		const form = document.getElementById('signin-form');
		startedBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			form!.style.display = 'block';
			startedBtn.style.display = 'none';
			if (learnBtn)
				learnBtn.style.display = 'none';
		});

	}
}

