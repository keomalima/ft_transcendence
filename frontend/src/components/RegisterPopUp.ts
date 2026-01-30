import { fileToBase64 } from "../utils/fileToBase64.js";
import { INPUT_CLASSES, BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { AppContext } from "../types.js";
import { escapeHtml } from "../pages/LiveChat.js";

export class RegisterPopUp extends HTMLElement {
	private selectedAvatarFile: File | null = null;
	private _ctx: AppContext | null = null;
	private listenersAttached: boolean = false;

	constructor() {
		super();
		this.render();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		if (!this.listenersAttached) {
			this.attachEventListener(this._ctx);
			this.listenersAttached = true;
		}
	}

	private render() {
		this.innerHTML = /*html*/`
			<div>
				<button onclick="this.closest('dialog').close()" class="outline-none float-right p-10">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="px-6 py-12 sm:rounded-lg sm:px-12">
				<h1 class="mb-10 text-xl">Create a new account</h1>
				<form id='create-new-account-form' class="md:col-span-2">
					<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
						<div class="col-span-full flex items-center gap-x-8">
							<img id="avatar-preview" src="/src/images/defaultProfile.webp" alt="default profile picture" class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0 object-cover" />
							<div>
								<input id="avatar-input" name="file" type="file" accept="image/webp, image/jpeg, image/png" class="sr-only">
								<label for="avatar-input" class='${BUTTON_WHITE_CLASSES}'>Add avatar</label>
								<p class="mt-5 text-xs/5 text-medium">JPG, GIF or PNG. 1MB max.</p>
							</div>
						</div>

						<div class="sm:col-span-3">
							<label for="first-name">First name</label>
							<input id="first-name" type="text" name="first_name" autoComplete="given-name" class='${INPUT_CLASSES}' maxlength="20"/>
						</div>

						<div class="sm:col-span-3">
							<label for="last-name">Last name</label>
							<input id="last-name" type="text" name="last_name" autoComplete="family-name" class='${INPUT_CLASSES}' maxlength="20"/>
						</div>

						<div class="col-span-full">
							<label for="sign-in-email">Email</label>
							<input id="sign-in-email" type="email" name="email" autoComplete="email" class='${INPUT_CLASSES}'/>
						</div>

						<div class="col-span-full">
							<label for="username">Username</label>
							<input id="username" type="text" name="username" autoComplete="username" class='${INPUT_CLASSES}' maxlength="20"/>
						</div>

						<div class="col-span-full">
							<label for="sign-in-password">Password</label>
							<input id="sign-in-password" type="password" name="password" autoComplete="current-password" class='${INPUT_CLASSES}' maxlength="20"/>
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

	
	
	// ======== EVENT LISTENER ============

	private attachEventListener(ctx: AppContext | null) {

		if (ctx == null)
			return;

		// Get the avatar image - use querySelector scoped to this component
		const avatarInput = this.querySelector('#avatar-input') as HTMLInputElement;
		const saveBtn = this.querySelector('#save-btn') as HTMLButtonElement;

		// **** LOAD AVATAR ****
		avatarInput?.addEventListener('change', async (e) =>  {
			// disable button
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
				saveBtn.className = `${BUTTON_WHITE_CLASSES}`;
				saveBtn.textContent = 'Save';
			}
		}, { once: true });


		// **** CREATE NEW ACCOUNT ****
		const createAccountForm = this.querySelector('#create-new-account-form') as HTMLFormElement;
		if (createAccountForm)
		{
			createAccountForm.addEventListener('submit', async (e) => {
				// // console.log('create form submission');
				e.preventDefault();
				e.stopPropagation();

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
				formData.append('avatarFile', this.selectedAvatarFile!);
				this.dispatchEvent(new CustomEvent('event-account-creation', {
					detail: {
						email: escapeHtml(formData.get('email') as string),
						firstName: escapeHtml(formData.get('first_name') as string),
						lastName: escapeHtml(formData.get('last_name') as string),
						password: escapeHtml(formData.get('password') as string),
						username: escapeHtml(formData.get('username') as string),
						avatarFile: this.selectedAvatarFile,
					},
					bubbles: true
				}))
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

}

customElements.define('register-popup', RegisterPopUp);