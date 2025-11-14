import profilePicture from '../images/ProfilePictureSquared.png';
import { NavBar } from '../components/NavBar';
import { navigateTo } from '../main';
import { userService } from '../services/UserService';
import { userStore } from '../store/UserStorage';
import { fileToBase64 } from '../utils/fileToBase64';

export function EditProfile () : HTMLElement | null {

	console.log('avatar url : ', userStore.getUserUserAvatar());
	const avatarImg: string | null = 'http://localhost:3000' + userStore.getUserUserAvatar();
	const editProfile = document.getElementById('root');
	if (editProfile)
	{
		editProfile.innerHTML = /*html*/`
		<header id='navigation-bar'></header>
		<div class="divide-y divide-gray-200 md:ml-20">

			<!-- Avatar -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
				<div></div>
				<div class='md:col-span-2'>
					<div class="col-span-full flex items-center gap-x-8">
						<img id="avatar-preview" src="${avatarImg}" alt="profile picture" class="w-40 h-40 bg-gray-300 rounded-full mb-4 shrink-0 object-cover" />
						<div>
							<input id="avatar-input" name="file" type="file" accept="image/webp, image/jpeg, image/png" class="sr-only">
							<label id='change-avatar-label' for="avatar-input" class="btn-primary">Change avatar</label>
							<p class="mt-5 text-xs/5 text-medium">JPG, GIF or PNG. 1MB max.</p>
						</div>
					</div>
				</div>
			</div>

			<!-- personnal information -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
				<div>
					<h2>Personal Information</h2>
					<p class="mt-1 text-sm/6 text-medium">Use a permanent address where you can receive mail.</p>
				</div>
				<form id='personnal-info-form' class="md:col-span-2">
					<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">


						<div class="col-span-full">
							<my-label labelFor="username">Username</my-label>
							<my-input inputId="username" inputType="text" inputName="username" inputAutoComplete="username" inputPlaceholder=${userStore.getUserUsername()}>
						</div>

						<div class="sm:col-span-3">
							<my-label labelFor="first-name">First name</my-label>
							<my-input inputId="first-name" inputType="text" inputName="first_name" inputAutoComplete="given-name" inputPlaceholder=${userStore.getUserSurname()}>
						</div>

						<div class="sm:col-span-3">
							<my-label labelFor="last-name">Last name</my-label>
							<my-input inputId="last-name" inputType="text" inputName="last_name" inputAutoComplete="family-name" inputPlaceholder=${userStore.getUserSurname()}>
						</div>

					</div>
					<div class="mt-8 flex">
						<button type="submit" class="btn-primary">Save</button>
					</div>
				</form>
			</div>

			<!-- change password -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
			<div>
				<h2>Change password</h2>
				<p class="mt-1 text-sm/6 text-medium">Update your password associated with your account.</p>
			</div>

			<form class="md:col-span-2">
				<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
				<div class="col-span-full">
					<my-label labelFor="current-password">Current password</my-label>
					<my-input inputId="current-password" inputType="password" inputName="current_password" inputAutoComplete="current-password"/>
				</div>

				<div class="col-span-full">
					<my-label labelFor="new-password">New password</my-label>
					<my-input inputId="new-password" inputType="password" inputName="new_password" inputAutoComplete="new-password"/>
				</div>

				<div class="col-span-full">
					<my-label labelFor="confirm-password">Confirm password</my-label>
					<my-input inputId="confirm-password" inputType="password" inputName="confirm_password" inputAutoComplete="new-password"/>
				</div>
				</div>

				<div class="mt-8 flex">
				<button type="submit" class="btn-primary">Save</button>
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
				<button id="delete" type="click" class="btn-primary bg-black text-white hover:shadow-xl hover:font-semibold">Yes, delete my account</button>
			</form>
			</div>
		</div>
		`
		NavBar();
	}



	let selectedAvatarFile: File | null;

	// Get the avatar image
	const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
	const avatarLabel = document.getElementById('change-avatar-label') as HTMLLabelElement;
	avatarInput?.addEventListener('change', async (e) =>  {
		// get file
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file)
			return;
		console.log('uploaded file : ', file);

		// store selected avatar
		selectedAvatarFile = file;

		try {
			if (avatarLabel) {
				avatarLabel.textContent = 'Loading ...';
				avatarLabel.className = 'btn-disable';
			}
			// update avatar method
			userService.updateAvatar(file);
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
				avatarLabel.className = 'btn-primary';
			}
		}

	})

	// update user data
	const updatePersonnalInfo = document.getElementById('personnal-info-form') as HTMLFormElement;
	updatePersonnalInfo.addEventListener('submit', async(e) => {
		e.preventDefault();
		e.stopPropagation();

		console.log('update personnal info event');

		try {
			const formData = new FormData(updatePersonnalInfo);
			const user = await userService.updateUser({
				surname: formData.get('last_name') ? formData.get('last_name') as string : null,
				displayName: formData.get('username') ? formData.get('username') as string : null,
				name: formData.get('first_name') ? formData.get('first_name') as string : null
			});
			console.log('updated successfully');
			navigateTo('/profile');
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

		console.log('delete account event');

		try {
			const user = await userService.deleteUser();
			navigateTo('/');
			console.log(`successful delete`);
		} catch (error) {
			console.log(error);
		}
	});

	return editProfile;
}

