import profilePicture from '../images/ProfilePictureSquared.png';
import { userData } from '../data/userData';
import { NavBar } from '../components/NavBar';
import { navigateTo } from '../main';
import { userService } from '../services/UserService';
import { userStore } from '../store/UserStorage';

export function EditProfile () : HTMLElement | null {

	const user = userData;
	const editProfile = document.getElementById('root');
	if (editProfile)
	{
		editProfile.innerHTML = /*html*/`
		<header id='navigation-bar'></header>
		<div class="divide-y divide-gray-200 md:ml-20">

			<!-- personnal information -->
			<div class="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
				<div>
					<h2>Personal Information</h2>
					<p class="mt-1 text-sm/6 text-medium">Use a permanent address where you can receive mail.</p>
				</div>
				<form id='personnal-info-form' class="md:col-span-2">
					<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
						<div class="col-span-full flex items-center gap-x-8">
							<img src="${profilePicture}" alt="" class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0" />
							<div>
							<button type="button" class="btn-primary">Change avatar</button>
							<p class="mt-2 text-xs/5 text-medium">JPG, GIF or PNG. 1MB max.</p>
							</div>
						</div>

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

						<div class="col-span-full">
							<my-label labelFor="city">City</my-label>
							<my-input inputId="city" inputType="city" inputName="city" inputAutoComplete="city" inputPlaceholder=${userStore.getUserUserCity()}>
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

	// update user data
	const updatePersonnalInfo = document.getElementById('personnal-info-form') as HTMLFormElement;
	updatePersonnalInfo.addEventListener('submit', async(e) => {
		e.preventDefault();
		e.stopPropagation();

		console.log('update personnal info event');

		try {
			const formData = new FormData(updatePersonnalInfo);
			const user = await userService.updateUser({
				surname: formData.get('last_name') ? formData.get('last_name') as string : null,				// surname: formData.get('last_name') === '' ? null : formData.get('last_name') as string,
				city: formData.get('city') ? formData.get('city') as string : null,
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
