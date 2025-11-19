import { AppContext } from "../types.js";
import { router } from "../main.js";
import { userService } from "../services/UserService.js";
import { fileToBase64 } from "../utils/fileToBase64.js";

// import style
import { INPUT_CLASSES, LABEL_CLASSES, BUTTON_CREAM_CLASSES, BUTTON_BLACK_CLASSES, BUTTON_DISABLED_CLASSES } from "../styles/tailwindStyles.js";

// import component
import "../components/NavBar.js";


export function EditProfile(ctx: AppContext) : string {
	let currentUser = ctx.userStore.get();
	const accessToken = currentUser?.accessToken;
	if (!accessToken)
	{
		console.log('no session when access /login')
		router.navigateTo('/');
		return '';
	}

	if (!currentUser)
		return '';
	const uploadsUrl: string = 'http://localhost:3000';
	userService.getUserState(ctx, currentUser.id);
	currentUser = ctx?.userStore.get();
	const profilePicture: string = `${uploadsUrl}${currentUser?.avatarUrl}`;

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
						<img id="avatar-preview" src="${profilePicture}" alt="profile picture" class="w-40 h-40 bg-gray-300 rounded-full mb-4 shrink-0 object-cover" />
						<div>
							<input id="avatar-input" name="file" type="file" accept="image/webp, image/jpeg, image/png" class="sr-only">
							<label id='change-avatar-label' for="avatar-input" class='${BUTTON_CREAM_CLASSES}'>Change avatar</label>
							<p class="mt-5 text-xs/5 text-medium">JPG, GIF or PNG. 1MB max.</p>
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
							<input class='${INPUT_CLASSES}' id="username" type="text" name="username" autoComplete="username" placeholder=${currentUser?.displayName}>
						</div>

						<div class="sm:col-span-3">
							<label class='${LABEL_CLASSES}' for="first-name">First name</label>
							<input class='${INPUT_CLASSES}' id="first-name" type="text" name="first_name" autoComplete="given-name" placeholder=${currentUser?.name}>
						</div>

						<div class="sm:col-span-3">
							<label class='${LABEL_CLASSES}' for="last-name">Last name</label>
							<input class='${INPUT_CLASSES}' id="last-name" type="text" name="last_name" autoComplete="family-name" placeholder=${currentUser?.surname}>
						</div>

					</div>
					<div class="mt-8 flex">
						<button type="submit" class="${BUTTON_CREAM_CLASSES}">Save</button>
					</div>
				</form>
			</div>

			<!-- change password -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
			<div>
				<h2 class="text-base/7 font-semibold text-black">Change password</h2>
				<p class="mt-1 text-sm/6 text-medium">Update your password associated with your account.</p>
			</div>

			<form class="md:col-span-2">
				<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
				<div class="col-span-full">
					<label class='${LABEL_CLASSES}' for="current-password">Current password</label>
					<input class='${INPUT_CLASSES}' id="current-password" type="password" name="current_password" autoComplete="current-password"/>
				</div>

				<div class="col-span-full">
					<label class='${LABEL_CLASSES}' for="new-password">New password</label>
					<input class='${INPUT_CLASSES}' id="new-password" type="password" name="new_password" autoComplete="new-password"/>
				</div>

				<div class="col-span-full">
					<label class='${LABEL_CLASSES}' for="confirm-password">Confirm password</label>
					<input class='${INPUT_CLASSES}' id="confirm-password" type="password" name="confirm_password" autoComplete="new-password"/>
				</div>
				</div>

				<div class="mt-8 flex">
				<button type="submit" class="${BUTTON_CREAM_CLASSES}">Save</button>
				</div>
			</form>
			</div>


			<!-- delete account -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
			<div>
				<h2 class="text-base/7 font-semibold text-black">Delete account</h2>
				<p class="mt-1 text-sm/6 text-medium">No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently.</p>
			</div>

			<form class="flex items-start md:col-span-2">
				<button id="delete" type="click" class="${BUTTON_BLACK_CLASSES}">Yes, delete my account</button>
			</form>
			</div>
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


// Setup event listeners after DOM is ready
function setupEditEventListeners(ctx: AppContext) {

	let selectedAvatarFile: File | null;

	// Get the avatar image
	const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
	const avatarLabel = document.getElementById('change-avatar-label') as HTMLLabelElement;
	avatarInput?.addEventListener('change', async (e) =>  {
		// get file
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file)
			return;

		// store selected avatar
		selectedAvatarFile = file;

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
		} catch(error) {
			console.log(error);
		} finally {
			if (avatarLabel) {
				avatarLabel.textContent = 'Change avatar';
				avatarLabel.className = `${BUTTON_CREAM_CLASSES}`;
			}
		}

	})

	// update user data
	const updatePersonnalInfo = document.getElementById('personnal-info-form') as HTMLFormElement;
	updatePersonnalInfo.addEventListener('submit', async(e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			const formData = new FormData(updatePersonnalInfo);
			const user = await userService.updateUser({
				surname: formData.get('last_name') ? formData.get('last_name') as string : null,
				displayName: formData.get('username') ? formData.get('username') as string : null,
				name: formData.get('first_name') ? formData.get('first_name') as string : null
			}, ctx);
			router.navigateTo('/profile');
		}
		catch (error) {
			console.log(error);
		}
	})

	// delete user
	const deleteProfile = document.getElementById('delete') as HTMLElement;
	deleteProfile.addEventListener('click', async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			const user = await userService.deleteUser(ctx);
			router.navigateTo('/');
		} catch (error) {
			console.log(error);
		}
	});

}
