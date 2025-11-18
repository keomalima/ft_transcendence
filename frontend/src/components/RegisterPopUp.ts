import { router } from "../main.js";
import { userService } from "../services/UserService.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import { INPUT_CLASSES, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import type { AppStores } from "../store/store.js";

export class RegisterPopUp extends HTMLElement {
	private selectedAvatarFile: File | null = null;
	private _ctx: AppStores | null = null;

	constructor() {
		super();
		this.render();
	}

	set ctx(value: AppStores) {
		this._ctx = value;
		this.attachEventListener(this._ctx);
	}

	private render() {
		this.innerHTML = /*html*/`
			<div>
				<button onclick="this.closest('dialog').close()" class="outline-none float-right p-10">X</button>
			</div>
			<div class="px-6 py-12 sm:rounded-lg sm:px-12">
				<h1 class="mb-10 text-xl">Create a new account</h1>
				<form action="/" method="POST" id='create-new-account-form' class="md:col-span-2">
					<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
						<div class="col-span-full flex items-center gap-x-8">
							<img id="avatar-preview" src="/src/images/defaultProfile.webp" alt="default profile picture" class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0 object-cover" />
							<div>
								<input id="avatar-input" name="file" type="file" accept="image/webp, image/jpeg, image/png" class="sr-only">
								<label for="avatar-input" class="btn-primary bg-white hover:bg-black cursor-pointer">Add avatar</label>
								<p class="mt-5 text-xs/5 text-medium">JPG, GIF or PNG. 1MB max.</p>
							</div>
						</div>

						<div class="sm:col-span-3">
							<label for="first-name">First name</label>
							<input id="first-name" type="text" name="first_name" autoComplete="given-name" class='${INPUT_CLASSES}'/>
						</div>

						<div class="sm:col-span-3">
							<label for="last-name">Last name</label>
							<input id="last-name" type="text" name="last_name" autoComplete="family-name" class='${INPUT_CLASSES}'/>
						</div>

						<div class="col-span-full">
							<label for="email">Email</label>
							<input id="sign-in-email" type="email" name="email" autoComplete="email" class='${INPUT_CLASSES}'/>
						</div>

						<div class="col-span-full">
							<label for="username">Username</label>
							<input id="username" type="text" name="username" autoComplete="username" class='${INPUT_CLASSES}'/>
						</div>

						<div class="col-span-full">
							<label for="password">Password</label>
							<input id="sign-in-password" type="password" name="password" autoComplete="current-password" class='${INPUT_CLASSES}'/>
						</div>

						<div class="col-span-full">
							<label for="confirm-password">Confirm password</label>
							<input id="confirm-password" type="password" name="confirm_password" autoComplete="current-password" class='${INPUT_CLASSES}'/>
						</div>
						<div class="col-span-full">
							<p id='register-error' class='text-red-500'></p>
						</div>
					</div>
					<div class="mt-8 flex">
						<button id='save-btn' type="submit" class="${BUTTON_WHITE_CLASSES}">Save</button>
					</div>
				</form>
			</div>

        `;
	}

	private attachEventListener(ctx: AppStores | null) {

		if (ctx == null)
			return;

		// Get the avatar image - use querySelector scoped to this component
		const avatarInput = this.querySelector('#avatar-input') as HTMLInputElement;
		const saveBtn = this.querySelector('#save-btn') as HTMLButtonElement;

		avatarInput?.addEventListener('change', async (e) =>  {
			// diable button
			saveBtn.disabled = true;
			saveBtn.className = 'btn-disable bg-white';
			saveBtn.textContent = 'Loading...';

			// get the file
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file)
				return;

			// store selected file
			this.selectedAvatarFile = file;

			try {
				// convert to Base64
				const imgBase64: string = await fileToBase64(file);
				const img = this.querySelector('#avatar-preview') as HTMLImageElement;
				if (img)
					img.src = imgBase64;
			} catch (error) {
				return;
			} finally {
				saveBtn.disabled = false;
				saveBtn.className = 'btn-primary bg-white hover:bg-black';
				saveBtn.textContent = 'Save';
			}
		})


		// Create new account
		const createAccountForm = this.querySelector('#create-new-account-form') as HTMLFormElement;
		if (createAccountForm)
		{
			createAccountForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				e.stopPropagation();
				console.log('save btn trigger');

				const displayError = this.querySelector('#register-error');
				const formData = new FormData(createAccountForm);
				if (displayError) {
						displayError.textContent = '';
					}
				// check for form data
				const errorMsg = this.checkFormData(formData);
				if (errorMsg)
				{
					if (displayError) {
						displayError.textContent = errorMsg;
					}
					return;
				}
				// try to create a new user
				try {
					const response = await userService.createUser({
						email: formData.get('email') as string,
						name: formData.get('first_name') as string,
						surname: formData.get('last_name') as string,
						password: formData.get('password') as string,
						displayName: formData.get('username') as string,
						// avatarFile: null
						avatarFile: this.selectedAvatarFile
					}, ctx);
					// try to login with the new created user
					try {
						const formData = new FormData(createAccountForm);
						const user = await userService.loginUser(formData.get('email') as string, formData.get('password') as string, ctx);
						router.navigateTo('/home');
					} catch {

					}
				} catch {

				}
			});
		}
	}


	private checkFormData(data: FormData): string | null {
		for (const element of data.entries()) {
			if (element[1] == null || element[1] == '')
				return `Missing input. Please enter ${element[0]}`;
		}

		const password = data.get('password');
		const confirmPassword = data.get('confirm_password');
		if (password != confirmPassword)
			return 'Password confirmation failed. Please confirm password.';
		
		return null;
	}

	private getErrorMessage(error: Error): string {
		let errorMessage = 'An unexpected error occurred';

		const message = error.message;
		// clear message
		const jsonMatch = message.match(/\{.*\}/);
		if (jsonMatch) {
			try {
				const errorData = JSON.parse(jsonMatch[0]);
				errorMessage = errorData.message;
			} catch {
				errorMessage = message;
			}
		} else {
			errorMessage = message;
		}
		return errorMessage;
	}

}

customElements.define('register-popup', RegisterPopUp);