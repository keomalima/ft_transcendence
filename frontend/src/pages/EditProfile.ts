import { AppContext } from "../types.js";
import { router } from "../main.js";
import { userService } from "../services/UserService.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import { API_BASE_URL } from "../config.js";
import { containDigit, isValidName, isValidUsername } from "./Home.js";

// import style
import { INPUT_CLASSES, LABEL_CLASSES, BUTTON_CREAM_CLASSES, BUTTON_BLACK_CLASSES, BUTTON_DISABLED_CLASSES } from "../styles/tailwindStyles.js";

// import component
import "../components/NavBar.js";


export function EditProfile(ctx: AppContext) : string {
	let currentUser = ctx.userStore.get();

	if (!currentUser)
		return '';
	const uploadsUrl: string = 'http://localhost:3000';
	void userService.getUserState(ctx);
	currentUser = ctx?.userStore.get();
	const avatarRaw = currentUser?.avatarUrl || '/uploads/avatars/default.jpg';
    const avatarSrc = /^https?:\/\//i.test(avatarRaw) ? avatarRaw : `${API_BASE_URL}${avatarRaw}`;

	// console.log("Avatar picture URL", avatarSrc);
	setTimeout(() => {
		passContext(ctx);
		setupEditEventListeners(ctx);;
	}, 0);

	const content: string =
	/*html*/`
		<header>
			<nav-bar id='nav-bar-component'></nav-bar>
		</header>
		<div class="divide-y divide-gray-200 md:ml-20">

			<!-- Avatar -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
				<div></div>
				<div class='md:col-span-2'>
					<div class="col-span-full flex items-center gap-x-8">
						<img id="avatar-preview" src="${avatarSrc}" alt="profile picture" class="w-40 h-40 bg-gray-300 rounded-full mb-4 shrink-0 object-cover" />
						<div>
							<input id="avatar-input" name="file" type="file" accept="image/webp, image/jpeg, image/png" class="sr-only">
							<label id='change-avatar-label' for="avatar-input" class='${BUTTON_CREAM_CLASSES}'>Change avatar</label>
							<p class="mt-5 text-xs/5 text-medium">JPG, GIF or PNG. 10MB max.</p>
							<p id='avatar-info-error' class='pt-3 text-sm'></p>
						</div>
					</div>
				</div>
			</div>

			<!-- personnal information -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
				<div>
					<h2 class="text-base/7 font-semibold text-black">Personal Information</h2>
					<p class="mt-1 text-sm/6 text-medium">Use a permanent address where you can receive mail.</p>
				</div>
				<form id='personnal-info-form' class="md:col-span-2">
					<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">


						<div class="col-span-full">
							<label class='${LABEL_CLASSES}' for="username">Username</label>
							<input class='${INPUT_CLASSES}' id="username" type="text" name="username" autoComplete="username" placeholder=${currentUser?.displayName} maxlength="20">
						</div>

						<div class="sm:col-span-3">
							<label class='${LABEL_CLASSES}' for="first-name">First name</label>
							<input class='${INPUT_CLASSES}' id="first-name" type="text" name="first_name" autoComplete="given-name" placeholder=${currentUser?.name} maxlength="20">
						</div>

						<div class="sm:col-span-3">
							<label class='${LABEL_CLASSES}' for="last-name">Last name</label>
							<input class='${INPUT_CLASSES}' id="last-name" type="text" name="last_name" autoComplete="family-name" placeholder=${currentUser?.surname} maxlength="20">
						</div>

					</div>
					<p id='update-personnal-info-error' class='pt-5 text-red-500 text-sm'></p>
					<div class="mt-8 flex">
						<button type="submit" class="${BUTTON_BLACK_CLASSES}">Save personnal informations</button>
					</div>
				</form>
			</div>

			<!-- change password -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
			<div>
				<h2 class="text-base/7 font-semibold text-black">Change password</h2>
				<p class="mt-1 text-sm/6 text-medium">Update your password associated with your account.</p>
			</div>

			<form id='change-password-form' class="md:col-span-2">
				<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
				<div class="col-span-full">
					<label class='${LABEL_CLASSES}' for="current-password">Current password</label>
					<input class='${INPUT_CLASSES}' id="current-password" type="password" name="current_password" autoComplete="current-password"/>
				</div>

				<div class="col-span-full">
					<label class='${LABEL_CLASSES}' for="new-password">New password</label>
					<input class='${INPUT_CLASSES}' id="new-password" type="password" name="new_password" autoComplete="new-password" maxlength="20"/>
				</div>

				<div class="col-span-full">
					<label class='${LABEL_CLASSES}' for="confirm-password">Confirm password</label>
					<input class='${INPUT_CLASSES}' id="confirm-password" type="password" name="confirm_password" autoComplete="new-password" maxlength="20"/>
				</div>
				</div>

				<p id='change-password-msg' class='pt-5 text-red-500 text-sm'></p>
				<div class="mt-8 flex">
					<button type="submit" class="${BUTTON_BLACK_CLASSES}">Save password</button>
				</div>
			</form>
			</div>


			<!-- delete account -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
			<div>
				<h2 class="text-base/7 font-semibold text-black">Delete account</h2>
				<p class="mt-1 text-sm/6 text-medium">No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently.</p>
			</div>

			<form class="flex flex-col items-start md:col-span-2">
				<button id="delete" type="click" class="px-3.5 py-2.5 rounded-full outline outline-1 text-red-500 outline-red-500 hover:bg-red-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">Yes, delete my account</button>
				<p id="delete-account-error" class="text-red-500 text-sm"></p>
			</form>
			</div>

			<!-- Confirmation Dialog -->
			<dialog id="delete-account-dialog" class="fixed inset-0 m-auto w-fit h-fit rounded-lg shadow-lg p-6 backdrop:bg-black backdrop:bg-opacity-50">
				<div class="flex flex-col gap-4">
					<h2 class="text-xl font-semibold">Delete Account</h2>
					<p id="delete-account-message" class="text-gray-600">Are you sure you want to delete your account?</p>
					<div class="flex gap-3 justify-end">
						<button id="cancel-delete-account-btn" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cancel</button>
						<button id="confirm-delete-account-btn" class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white">Delete</button>
					</div>
				</div>
			</dialog>
		</div>
	`

	return content;
}


function passContext(ctx: AppContext) {
	const navBarComponent = document.getElementById('nav-bar-component') as any;
	if (navBarComponent) {
		navBarComponent.ctx = ctx;
	}
}


function setupEditEventListeners(ctx: AppContext) {

	let selectedAvatarFile: File | null;

	// **** CHANGE AVATAR ****
	const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
	const avatarLabel = document.getElementById('change-avatar-label') as HTMLLabelElement;
	avatarInput?.addEventListener('change', async (e) =>  {
		// get file
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file)
			return;

		// store selected avatar
		selectedAvatarFile = file;

		const errorMsg = document.getElementById('avatar-info-error') as HTMLParagraphElement;
		try {
			if (avatarLabel) {
				avatarLabel.textContent = 'Loading ...';
				avatarLabel.className = `${BUTTON_DISABLED_CLASSES}`;
			}
			// update avatar method
			const result = await userService.updateAvatar(file, ctx);
			// convert to Base64
			const imgBase64: string = await fileToBase64(file);
			const img = document.getElementById('avatar-preview') as HTMLImageElement;
			if (img)
				img.src = imgBase64;
			errorMsg.innerText = 'Avatar updated successfully';
			errorMsg.style.color = '#22c55e';
			setTimeout(() => {
				errorMsg.innerText = '';
			}, 3000);
		} catch(error: any) {
			const errorMessage = error?.message || error || 'Failed to upload avatar';
			errorMsg.innerText = `Error: ${errorMessage}`;
			errorMsg.style.color = '#ef4444';
			setTimeout(() => {
				errorMsg.innerText = '';
			}, 3000);
		} finally {
			if (avatarLabel) {
				avatarLabel.textContent = 'Change avatar';
				avatarLabel.className = `${BUTTON_CREAM_CLASSES}`;
			}
		}

	})

	// **** UPDATE USER DATA ****
	const updatePersonnalInfo = document.getElementById('personnal-info-form') as HTMLFormElement;
	updatePersonnalInfo.addEventListener('submit', async(e) => {
		e.preventDefault();
		e.stopPropagation();
		const formData = new FormData(updatePersonnalInfo);
		const newDisplayName = formData.get('username') as string;
		const newFisrtName = formData.get('first_name') as string;
		const newLastName = formData.get('last_name') as string;
		const errorMsg = document.getElementById('update-personnal-info-error') as HTMLParagraphElement;

		const fail = (msg: string) => {
			if (errorMsg) errorMsg.innerText = msg;
			return false;
		};

		if (newDisplayName) {
			if (newDisplayName.length < 3 || newDisplayName.length > 20) return fail('Error: User name should contain 3 to 20 characters');
			if (!isValidUsername(newDisplayName)) return fail('Error: User name cannot contain spaces or special characters');
				}

		if (newFisrtName) {
			if (newFisrtName.length < 3 || newFisrtName.length > 20) return fail('Error: First name should contain 3 to 20 characters');
			if (!isValidName(newFisrtName)) return fail('Error: First name cannot contain digits, spaces or special characters');
			}

		if (newLastName) {
			if (newLastName.length < 3 || newLastName.length > 20) return fail('Error: Last name should contain 3 to 20 characters');
			if (!isValidName(newLastName)) return fail('Error: Last name cannot contain digits, spaces or special characters');
		}
		try {
			await userService.updateUser({
				surname: formData.get('last_name') ? formData.get('last_name') as string : null,
				displayName: formData.get('username') ? formData.get('username') as string : null,
				name: formData.get('first_name') ? formData.get('first_name') as string : null
			}, ctx);
			router.navigateTo('/profile');
		}
		catch (error) {
			if (errorMsg) {
				errorMsg.innerText = `${error}`;
			}
		}
	})

	// **** CHANGE USER PASSWORD ****
	const changePasswordForm = document.getElementById('change-password-form') as HTMLFormElement;
	const changePwdMsg = document.getElementById('change-password-msg') as HTMLParagraphElement;
	changePasswordForm.addEventListener('submit', async(e) => {
		e.preventDefault();
		e.stopPropagation();
		const formData = new FormData(changePasswordForm);
		const currentPassword = formData.get('current_password') as string;
		const newPassword = formData.get('new_password') as string;
		const confirmPassword = formData.get('confirm_password') as string;
		if (!currentPassword || !newPassword || !confirmPassword) {
			changePwdMsg.innerText = 'Missing input';
			changePwdMsg.className = 'pt-5 text-red-500 text-sm';
			return;
		}
		if (newPassword != confirmPassword) {
			changePwdMsg.innerText = 'Password confirmation is wrong';
			changePwdMsg.className = 'pt-5 text-red-500 text-sm';
			return;
		}
		try {
			await userService.changePassword(currentPassword, newPassword, ctx);
			changePwdMsg.innerHTML = 'Password sucessfully updated!';
			changePwdMsg.className = 'pt-5 text-green-500 text-sm';
			changePasswordForm.reset();
		} catch (error) {
			changePasswordForm.reset();
			changePwdMsg.innerText = `${error}`;
			changePwdMsg.className = 'pt-5 text-red-500 text-sm';
		}
	})

	// **** DELETE USER ****
	const deleteProfile = document.getElementById('delete') as HTMLElement;
	deleteProfile.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();

		// Get dialog elements
		const dialog = document.querySelector('#delete-account-dialog') as HTMLDialogElement;
		const cancelBtn = document.querySelector('#cancel-delete-account-btn') as HTMLButtonElement;
		const confirmBtn = document.querySelector('#confirm-delete-account-btn') as HTMLButtonElement;
		
		if (!dialog) return;
		
		// Show dialog
		dialog.showModal();
		
		// Handle cancel
		const handleCancel = () => {
			dialog.close();
			cancelBtn?.removeEventListener('click', handleCancel);
			confirmBtn?.removeEventListener('click', handleConfirm);
		};
		
		const errorMsg = document.getElementById('delete-account-error') as HTMLParagraphElement;
		// Handle confirm
		const handleConfirm = async () => {
			dialog.close();
			try {
				const user = await userService.deleteUser(ctx);
				router.navigateTo('/');
			} catch (error) {
				// console.log(error);
				errorMsg.innerText = error?.toString() || "Failed to delete account.";
			}
			cancelBtn?.removeEventListener('click', handleCancel);
			confirmBtn?.removeEventListener('click', handleConfirm);
		};
		
		// Attach event listeners
		cancelBtn?.addEventListener('click', handleCancel);
		confirmBtn?.addEventListener('click', handleConfirm);
		
		// Close on backdrop click
		dialog.addEventListener('click', (e) => {
			if (e.target === dialog) {
				handleCancel();
			}
		});
	});

}