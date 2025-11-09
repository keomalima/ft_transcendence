
import pongimg from '../images/pong.png';
import { navigateTo } from '../main';
import { RegisterPopUp } from '../components/RegisterPopUp';
import { userService } from '../services/UserService';

export function home() {
	const root = document.getElementById('root');
	if (root) {
		root.innerHTML = /*html*/`
		<div>
			<div class="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
				<div class="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
					<h1 class="max-w-2xl text-xl font-semibold tracking-tight text-balance sm:text-7xl lg:col-span-2 xl:col-auto dark:text-white">Let's Pong !</h1>
					<div class="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
						<p class="text-lg text-pretty sm:text-xl/8">Welcome to our transcendance project</p>
						<div class="mt-10 flex items-center gap-x-6">
							<a href="#" class="styled-link" id="get-started-btn">Get started</a>
							<a data-link href="/test" class="styled-link" id="get-started-btn">Test create user</a>
							<my-link lHref="/LearnMore" lId="learn-more-btn">Learn more <span aria-hidden="true">→</span></my-link>
						</div>
						<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm" id="hidden-form" style="display: none;">
							<form action="#" method="POST" class="space-y-6" id="signin-form" >
								<div>
									<my-label labelFor="email">Email address</my-label>
									<my-input inputId="email" inputType="email" inputName="email" inputAutoComplete="email" required/>
								</div>

								<div>
									<div class="flex items-center justify-between">
										<my-label labelFor="password">Password</my-label>
										<div class="text-sm">
											<a data-link href="#" class="text-medium underline">Forgot password?</a>
										</div>
									</div>
									<my-input inputId="password" inputType="password" inputName="password" inputAutoComplete="current-password" required/>
								</div>

								<div>
									<my-button btnType='submit'>Sign in</my-button>
								</div>
							</form>

							<p class="mt-10 text-center text-sm/6 text-medium">
								Not a member?
								<a class="underline" onclick="document.getElementById('pop-up-register').showModal()">Create a new account</a>
							</p>
						</div>
					</div>
					<img src="${pongimg}" alt="" class="mt-10 aspect-5/5 w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-36" />
				</div>
			</div>

			<!-- Dialog for pop up -->
			<dialog id="pop-up-register" class="place-self-center"></dialog>


		</div>
		`



	// Click handler : show form
	const startedBtn = document.getElementById('get-started-btn');
	const learnBtn = document.getElementById('learn-more-btn');
	const hidenForm = document.getElementById('hidden-form') as HTMLElement;
	startedBtn?.addEventListener('click', (e) => {
		e.preventDefault();
		hidenForm!.style.display = 'block';
		startedBtn.style.display = 'none';
		if (learnBtn)
			learnBtn.style.display = 'none';
	});

	// Sign-in submit form listener
	const form = document.getElementById('signin-form') as HTMLFormElement;
	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		e.stopPropagation();

		const emailInput = document.getElementById('email') as HTMLInputElement;
		const passwordInput = document.getElementById('password') as HTMLInputElement;

		const email = emailInput?.value;
		const password = passwordInput?.value;

		console.log('email:', email);
		console.log('password:', password);

		try {
			const user = await userService.loginUser(email, password);
			navigateTo('/profile');
			console.log(`successful login with : ${email} in session id : ${user.accessToken}`);
		} catch (error) {
			console.log(error);
		}
	});

	RegisterPopUp();

	}
}

