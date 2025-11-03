
import pongimg from '../images/pong.png';

export function home() {

	console.log('🏠 HOME FUNCTION CALLED');

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
							<a href="#" class="styled-link rounded-full" id="get-started-btn">Get started</a>
							<a href="/learnmore" class="styled-link" id="learn-more-btn">Learn more <span aria-hidden="true">→</span></a>
						</div>
						<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm" >
							<form action="#" method="POST" class="space-y-6" id="signin-form" style="display: none;">
								<div>
									<label for="email" >Email address</label>
									<div class="mt-2">
									<input id="email" type="email" name="email" required autocomplete="email" class="input-style" />
									</div>
								</div>

								<div>
									<div class="flex items-center justify-between">
									<label for="password" >Password</label>
									<div class="text-sm">
										<a href="#" class="text-medium underline">Forgot password?</a>
									</div>
									</div>
									<div class="mt-2">
									<input id="password" type="password" name="password" required autocomplete="current-password" class="input-style" />
									</div>
								</div>

								<div>
									<button type="submit" class="btn-primary">Sign in</button>
								</div>
							</form>

							<p class="mt-10 text-center text-sm/6 text-medium">
								Not a member?
								<a href="#" class="underline">Create a new account</a>
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
	const form = document.getElementById('signin-form') as HTMLFormElement;

	console.log('Started button:', startedBtn);
	console.log('Learn button:', learnBtn);
	console.log('Form:', form);

	// Add submit listener - this should catch the form submission
	form?.addEventListener('submit', (e) => {
		console.log('🎯 SUBMIT EVENT FIRED!');
		e.preventDefault(); // Prevent reload
		e.stopPropagation(); // Stop event bubbling

		const emailInput = document.getElementById('email') as HTMLInputElement;
		const passwordInput = document.getElementById('password') as HTMLInputElement;

		console.log('Email input:', emailInput);
		console.log('Password input:', passwordInput);

		const email = emailInput?.value;
		const password = passwordInput?.value;

		console.log('email:', email);
		console.log('password:', password);
	});

	// Click handler just shows the form
	startedBtn?.addEventListener('click', (e) => {
		e.preventDefault();
		form!.style.display = 'block';
		startedBtn.style.display = 'none';
		if (learnBtn)
			learnBtn.style.display = 'none';
	});



	}
}

