import { navigateTo } from "../main";
import defaultProfilePicture from '../images/defaultProfile.webp'
import { userService } from "../services/UserService";
import { userStore } from "../store/UserStorage";
import { fileToBase64 } from "../utils/fileToBase64";

export function RegisterPopUp() {
    const popUp = document.getElementById('pop-up-register');
    if (popUp) {
        popUp.innerHTML = /*html*/`

		<div>
			<button onclick="this.closest('dialog').close()" class="outline-none float-right">X</button>
		</div>
		<div class="px-6 py-12 sm:rounded-lg sm:px-12">
			<h1 class="mb-10 text-xl">Create a new account</h1>
			<form action="/" method="POST" id='create-new-account-form' class="md:col-span-2">
				<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
					<div class="col-span-full flex items-center gap-x-8">
						<img id="avatar-preview" src="${defaultProfilePicture}" alt="default profile picture" class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0 object-cover" />
						<div>
							<input id="avatar-input" name="file" type="file" accept="image/webp, image/jpeg, image/png" class="sr-only">
							<label for="avatar-input" class="btn-primary bg-white hover:bg-black cursor-pointer">Add avatar</label>
							<p class="mt-5 text-xs/5 text-medium">JPG, GIF or PNG. 1MB max.</p>
						</div>
					</div>

					<div class="sm:col-span-3">
						<my-label labelFor="first-name">First name</my-label>
						<my-input inputId="first-name" inputType="text" inputName="first_name" inputAutoComplete="given-name"/>
					</div>

					<div class="sm:col-span-3">
						<my-label labelFor="last-name">Last name</my-label>
						<my-input inputId="last-name" inputType="text" inputName="last_name" inputAutoComplete="family-name"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="email">Email</my-label>
						<my-input inputId="sign-in-email" inputType="email" inputName="email" inputAutoComplete="email"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="username">Username</my-label>
						<my-input inputId="username" inputType="text" inputName="username" inputAutoComplete="username"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="password">Password</my-label>
						<my-input inputId="sign-in-password" inputType="password" inputName="password" inputAutoComplete="current-password"/>
					</div>

					<div class="col-span-full">
						<my-label labelFor="confirm-password">Confirm password</my-label>
						<my-input inputId="confirm-password" inputType="password" inputName="confirm_password" inputAutoComplete="current-password"/>
					</div>
					<div class="col-span-full">
						<p id='register-error' class='text-red-500'></p>
					</div>
				</div>
				<div class="mt-8 flex">
					<button id='save-btn' type="submit" class="btn-primary bg-white hover:bg-black">Save</button>
				</div>
			</form>
		</div>

        `;
    }

	let selectedAvatarFile: File | null;

	// Get the avatar image
	const avatarInput = document.getElementById('avatar-input') as HTMLElement;
	const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;

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
		selectedAvatarFile = file;

		try {
			// convert to Base64
			const imgBase64: string = await fileToBase64(file);
			const img = document.getElementById('avatar-preview') as HTMLImageElement;
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
	const createAccountForm = document.getElementById('create-new-account-form') as HTMLFormElement;
	if (createAccountForm)
	{
		createAccountForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			e.stopPropagation();

			const displayError = document.getElementById('register-error');
			const formData = new FormData(createAccountForm);
			if (displayError) {
					displayError.textContent = '';
				}
			// check for form data
			const errorMsg = checkFormData(formData);
			if (errorMsg)
			{
				if (displayError) {
					displayError.textContent = errorMsg;
				}
				return;
			}
			// fetch
			try {
					const response = await userService.createUser({
					email: formData.get('email') as string,
					name: formData.get('first_name') as string,
					surname: formData.get('last_name') as string,
					password: formData.get('password') as string,
					displayName: formData.get('username') as string,
					// avatarFile: null
					avatarFile: selectedAvatarFile
				});
				console.log(`user as been created : ${userStore.getUserInfo().name} id = ${userStore.getUserId()}`);

				try {
					const formData = new FormData(createAccountForm);
					const user = await userService.loginUser(formData.get('email') as string, formData.get('password') as string,);
					console.log('login after create account -> acessToken in localstorage ', userStore.getUserAccessToken());
				}
				catch (error) {
					if (displayError) {
						if (error instanceof Error) {
							displayError.textContent = getErrorMessage(error);
						}
						else {
							displayError.textContent = 'An unexpected error occurred';
						}
					}
				}
				navigateTo('/profile');

			} catch (error) {
				if (displayError) {
					if (error instanceof Error) {
						displayError.textContent = getErrorMessage(error);
					}
					else {
						displayError.textContent = 'An unexpected error occurred';
					}
				}
			}
			
		});
	}

    return popUp;
}

function checkFormData(data: FormData): string | null {
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

function getErrorMessage(error: Error): string {
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
