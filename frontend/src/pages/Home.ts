import { router } from "../main.js";
import { AppContext } from "../types.js";
import { userService } from "../services/UserService.js";
import { BUTTON_CREAM_CLASSES, INPUT_CLASSES, LABEL_CLASSES, LINK_STYLED_CLASSES } from "../styles/tailwindStyles.js";
import "../components/RegisterPopUp.js";
import type { RegisterPopUp } from "../components/RegisterPopUp.js";
import httpCall from "../api/httpClient.js";
import { escapeHtml } from "./LiveChat.js";

// Track the last attached "Get started" button element so we can reattach
// listeners when the SPA recreates the DOM node during navigation.
let lastStartedBtn: HTMLButtonElement | null = null;

export function Home(ctx: AppContext): string {
	setTimeout(() => {
		// Reset UI state on each render
		const startedBtnEl = document.getElementById('get-started-btn') as HTMLButtonElement | null;
		const learnBtnEl = document.getElementById('learn-more-btn') as HTMLElement | null;
		const hiddenFormEl = document.getElementById('hidden-form') as HTMLElement | null;
		if (startedBtnEl) {
			startedBtnEl.disabled = false;
			if (startedBtnEl.classList.contains('hidden')) startedBtnEl.classList.remove('hidden');
		}
		if (learnBtnEl) learnBtnEl.style.display = '';
		if (hiddenFormEl) hiddenFormEl.style.display = 'none';

		// If the Get started button element has changed (SPA re-render),
		// re-run setup to attach listeners to the new DOM node.
		if (lastStartedBtn !== startedBtnEl) {
			passContext(ctx);
			setupHomeEventListeners(ctx);
			lastStartedBtn = startedBtnEl;
		}
	}, 0);

	const content:string = /*html*/`
        <div>
			<div class="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
				<div class="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
					<h1 class="max-w-2xl text-xl font-semibold text-black tracking-tight text-balance sm:text-7xl lg:col-span-2 xl:col-auto">Let's Pong !</h1>
					<div class="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
						<p class="text-lg text-pretty sm:text-xl/8">Welcome to our transcendance project</p>
						<div class="mt-10 flex items-center gap-x-6">
							<button id='get-started-btn' class='${LINK_STYLED_CLASSES}'>Get started</button>
							<button id='google-login-btn' class='${LINK_STYLED_CLASSES}'>Login Google</button>
						</div>
						
						<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm" id="hidden-form" style="display: none;">
							<form class="space-y-6" id="signin-form" >
								<div>
									<label for="email" class='${LABEL_CLASSES}'>Email address</label>
									<input class="${INPUT_CLASSES}" id="email" type="email" name="email" autoComplete="email" required/>
								</div>

								<div>
									<div class="flex items-center justify-between">
										<label for="password" class='${LABEL_CLASSES}'>Password</label>
									</div>
									<input id="password" type="password" name="password" autoComplete="current-password" class='${INPUT_CLASSES}' required/>
								</div>
								<p id='login-error' class='text-red-500'></p>

								<div>
									<button type='submit' class='${BUTTON_CREAM_CLASSES}'>Sign in</button>
								</div>
							</form>

							<p class="mt-10 text-center text-sm/6 text-medium">
								Not a member?
								<a class="underline" onclick="document.getElementById('register-dialog').showModal()">Create a new account</a>
							</p>
							
						</div>
					</div>
					<img src="/src/images/pong.png" alt="Pong game" class="mt-10 aspect-5/5 w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-36" />
				</div>
			</div>

			<!-- Dialog for pop up -->
			<dialog id="register-dialog" class="place-self-center">
				<register-popup id="register-component"></register-popup>
			</dialog>

		</div>
    `;

	return content;
}

// ======== PASS CONTEXT ========

function passContext(ctx: AppContext) {
	const registerComponent = document.getElementById('register-component') as RegisterPopUp | null;
	if (registerComponent) {
		registerComponent.ctx = ctx;
	}
}


// ======== EVENT LISTENER ============

function setupHomeEventListeners(ctx: AppContext) {

	// Get the register component
	const registerComponent = document.getElementById('register-component') as RegisterPopUp | null;

	// **** GOOGLE LOGIN ****
	const googleForm = document.getElementById('google-login-btn') as HTMLFormElement;
	googleForm?.addEventListener('click', async (e) => {
		e.preventDefault();
		try {
			window.location.href = 'http://localhost:3000/api/users/login/google';
			// // // console.log('⭐ loginUser success! ✅');
			router.navigateTo('/home');
		} catch (error) {
			// // // console.log(error);
			const popUpLogin = document.getElementById('login-error');
			popUpLogin!.textContent = 'Incorrect login or password. Please try again.'
		}
	});

	// **** SHOW FORM ****
	const startedBtn = document.getElementById('get-started-btn') as HTMLButtonElement;
	const learnBtn = document.getElementById('learn-more-btn') as HTMLLinkElement;
	const hidenForm = document.getElementById('hidden-form') as HTMLElement;

	startedBtn?.addEventListener('click', (e) => {
		// // // console.log('started triggered')
		e.preventDefault();
		startedBtn.disabled = true;
		startedBtn.classList.add('hidden');
		if (hidenForm) {
			hidenForm.style.display = 'block';
		}
		if (learnBtn)
			learnBtn.style.display = 'none';
	});

	// **** SIGN IN ****
	const form = document.getElementById('signin-form') as HTMLFormElement;

	form?.addEventListener('submit', async (e) => {
		e.preventDefault();
		e.stopPropagation();

		const emailInput = document.getElementById('email') as HTMLInputElement;
		const passwordInput = document.getElementById('password') as HTMLInputElement;

		const email = escapeHtml(emailInput?.value);
		const password = escapeHtml(passwordInput?.value);

		try {
			await userService.loginUser(email, password, ctx);
			router.navigateTo('/home');
		} catch (error) {
			// // console.log(error);
			const popUpLogin = document.getElementById('login-error');
			popUpLogin!.textContent = 'Incorrect login or password. Please try again.'
		}
	});


	// **** CREATE NEW ACCOUNT ****
	registerComponent?.addEventListener('event-account-creation', async (e: Event) => {
		const customEvent = e as CustomEvent;
		const data = customEvent.detail;
		const displayError = document.querySelector('#register-error') as HTMLParagraphElement;
		const {firstName, lastName, username, email, password} = data;
		// // console.log('name', data);
		if (!firstName || !lastName || !username || !email || !password) {
			if (displayError) {
				displayError.innerText = 'Error: Missing information.';
			}
			return;
		}
		if (containDigit(firstName) || containDigit(lastName)) {
			if (displayError) {
				displayError.innerText = 'Error: First name and surname cannot contain digit.'
			}
			return;		
		}
		if (username.length > 20 || username.length < 3) {
			if (displayError) {
				displayError.innerText = 'Error: Username lenght must be between 3 and 20 characters.'
			}
			return;
		}
		if (firstName.length > 20 || firstName.length < 3) {
			if (displayError) {
				displayError.innerText = 'Error: Name lenght must be between 3 and 20 characters.'
			}
			return;
		}
		if (lastName.length > 20 || lastName.length < 3) {
			if (displayError) {
				displayError.innerText = 'Error: Surname lenght must be between 3 and 20 characters.'
			}
			return;
		}
		if (!isPasswordValid(password)) {
			if (displayError) {
				displayError.innerText = 'Error: Password must contain at least 8 characters, 1 uppercase and 1 special character.'
			}
			return;			
		}
		try {
			await userService.createUser({
				email: data.email,
				name: data.firstName,
				surname: data.lastName,
				password: data.password,
				displayName: data.username,
				avatarFile: data.avatarFile,
			}, ctx);

			// Login after successful creation
			await userService.loginUser(data.email, data.password, ctx);
			router.navigateTo('/home');
		} catch (error) {
			// // // console.log(error);
			if (displayError)
				displayError.innerText = `${error}`;
		}
	});
}

function isPasswordValid(password: string): boolean {
	const minLength = password.length >= 8;
	const hasUppercase = /[A-Z]/.test(password);
	const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

	return minLength && hasUppercase && hasSpecialChar;
}

export function containDigit(str: string): boolean {
	const hasDigit = /[0-9]/.test(str);

	return hasDigit;
}