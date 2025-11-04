import profilePicture from '../images/ProfilePictureSquared.png';
import { userData } from '../data/userData';
import { NavBar } from '../components/NavBar';

export function EditProfile () : HTMLElement | null {

	const user = userData;
	const editProfile = document.getElementById('app');
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
				<form class="md:col-span-2">
					<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:max-w-xl sm:grid-cols-6">
						<div class="col-span-full flex items-center gap-x-8">
							<img src="${profilePicture}" alt="" class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0" />
							<div>
							<button type="button" class="btn-primary">Change avatar</button>
							<p class="mt-2 text-xs/5 text-medium">JPG, GIF or PNG. 1MB max.</p>
							</div>
						</div>

						<div class="sm:col-span-3">
							<label for="first-name" class="block text-sm/6 font-medium text-black">First name</label>
							<div class="mt-2">
							<input id="first-name" type="text" name="first-name" autocomplete="given-name" class="input-style outline-creamgrey" />
							</div>
						</div>

						<div class="sm:col-span-3">
							<label for="last-name" class="block text-sm/6 font-medium text-black">Last name</label>
							<div class="mt-2">
							<input id="last-name" type="text" name="last-name" autocomplete="family-name" class="input-style  outline-creamgrey" />
							</div>
						</div>

						<div class="col-span-full">
							<label for="email" class="block text-sm/6 font-medium text-black">Email address</label>
							<div class="mt-2">
							<input id="email" type="email" name="email" autocomplete="email" class="input-style outline-creamgrey" />
							</div>
						</div>

						<div class="col-span-full">
							<label for="username" class="block text-sm/6 font-medium text-black">Username</label>
							<div class="mt-2">
							<input id="email" type="email" name="email" autocomplete="email" class="input-style outline-creamgrey" />
							</div>
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
					<label for="current-password" class="block text-sm/6 font-medium text-black">Current password</label>
					<div class="mt-2">
					<input id="current-password" type="password" name="current_password" autocomplete="current-password" class="input-style outline-creamgrey" />
					</div>
				</div>

				<div class="col-span-full">
					<label for="new-password" class="block text-sm/6 font-medium text-black">New password</label>
					<div class="mt-2">
					<input id="new-password" type="password" name="new_password" autocomplete="new-password" class="input-style outline-creamgrey" />
					</div>
				</div>

				<div class="col-span-full">
					<label for="confirm-password" class="block text-sm/6 font-medium text-black">Confirm password</label>
					<div class="mt-2">
					<input id="confirm-password" type="password" name="confirm_password" autocomplete="new-password" class="input-style outline-creamgrey" />
					</div>
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
				<button type="submit" class="btn-primary bg-black text-white hover:shadow-xl hover:font-semibold">Yes, delete my account</button>
			</form>
			</div>
		</div>
		`
		NavBar();
	}
	return editProfile;
}
