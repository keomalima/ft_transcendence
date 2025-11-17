import { router } from "../main.js";
import type { AppStores } from "../store/store.js";
import { userService } from "../services/UserService.js";
import { BUTTON_PRIMARY_CLASSES, INPUT_CLASSES, LABEL_CLASSES, LINK_STYLED_CLASSES } from "../styles/tailwindStyles.js";
import "../components/RegisterPopUp.js";

export function Home(ctx: AppStores): string {
    const user = ctx.user.get();

	setTimeout(() => {
		setupHomeEventListeners(ctx);
	}, 0);

	const content:string = /*html*/`
        <div>
			<div class="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
				<div class="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
					<h1 class="max-w-2xl text-xl font-semibold text-black tracking-tight text-balance sm:text-7xl lg:col-span-2 xl:col-auto">Let's Pong !</h1>
					<div class="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
						<p class="text-lg text-pretty sm:text-xl/8">Welcome to our transcendance project</p>
						<div class="mt-10 flex items-center gap-x-6">
							<a href="#" id='get-started-btn' class='${LINK_STYLED_CLASSES}'>Get started</a>
							<a data-link href="/test" id="test-btn" class='${LINK_STYLED_CLASSES}'>Test user</a>
							<a href="#" id="clear-local-storage" class='${LINK_STYLED_CLASSES}'>Clear local storage</a>
							<a data-link href="/LearnMore" id="learn-more-btn" class='${LINK_STYLED_CLASSES}'>Learn more →</a>
						</div>
						<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm" id="hidden-form" style="display: none;">
							<form action="#" method="POST" class="space-y-6" id="signin-form" >
								<div>
									<label for="email" class='${LABEL_CLASSES}'>Email address</label>
									<input class="${INPUT_CLASSES}" id="email" type="email" name="email" autoComplete="email" required/>
								</div>

								<div>
									<div class="flex items-center justify-between">
										<label for="password" class='${LABEL_CLASSES}'>Password</label>
										<div class="text-sm">
											<a data-link href="#" class="text-medium underline">Forgot password?</a>
										</div>
									</div>
									<input id="password" type="password" name="password" autoComplete="current-password" class='${INPUT_CLASSES}' required/>
								</div>
								<p id='login-error' class='text-red-500'></p>

								<div>
									<button type='submit' class='${BUTTON_PRIMARY_CLASSES}'>Sign in</button>
								</div>
							</form>

							<p class="mt-10 text-center text-sm/6 text-medium">
								Not a member?
								<a class="underline" onclick="document.getElementById('pop-up-register').showModal()">Create a new account</a>
							</p>
						</div>
					</div>
					<img src="/src/images/pong.png" alt="Pong game" class="mt-10 aspect-5/5 w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-36" />
				</div>
			</div>

			<!-- Dialog for pop up -->
			<dialog id="pop-up-register" class="place-self-center">
				<register-popup></register-popup>
			</dialog>

		</div>
    `;

	return content;
}

// Setup event listeners after DOM is ready
function setupHomeEventListeners(ctx: AppStores) {

	// Start event : show from
	const startedBtn = document.getElementById('get-started-btn');
	const learnBtn = document.getElementById('learn-more-btn');
	const hidenForm = document.getElementById('hidden-form') as HTMLElement;
	
	if (startedBtn) {
		startedBtn.addEventListener('click', (e) => {
			e.preventDefault();
			console.log('click of Get started')
			if (hidenForm) {
				hidenForm.style.display = 'block';
				startedBtn.style.display = 'none';
			}
			if (learnBtn)
				learnBtn.style.display = 'none';
		});
	}

	// Sign-in submit form listener
	const form = document.getElementById('signin-form') as HTMLFormElement;
	if (form) {
		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			e.stopPropagation();

			const emailInput = document.getElementById('email') as HTMLInputElement;
			const passwordInput = document.getElementById('password') as HTMLInputElement;

			const email = emailInput?.value;
			const password = passwordInput?.value;
			
			console.log('Form submitted:', email);
			try {
				const user = await userService.loginUser(email, password, ctx);
				router.navigateTo('/about');
			} catch (error) {
				console.log(error);
				const popUpLogin = document.getElementById('login-error');
				popUpLogin!.textContent = 'Incorrect login or password. Please try again.'
			}
		});
	}
}
