import profilePicture from '../images/defaultProfile.webp';
// import { userData } from '../data/userData';
import { navigateTo } from "../main";
import { userStore } from '../store/UserStorage';
import { userService } from '../services/UserService';
import { UserState } from '../types';

type getUserResp = Omit<UserState, 'isLoggedIn' | 'accessToken' | 'createdAt' | 'updatedAt'>


export async function ProfileCard () : Promise<HTMLElement | null> {

	const profileCard = document.getElementById('profile-card');
	if (profileCard)
	{
		// console.log('profile card | before get user state = ', userStore.getUserInfo());
		try {
			await userService.getUserState();
		}
		catch (error) {
			console.log(error);
		}
		const userInfo = userStore.getUserInfo();
		console.log('user info ', userInfo);

		const avatarImg: string | null = 'http://localhost:3000' + userStore.getUserUserAvatar();
		// console.log('user avatar = ', userStore.getUserUserAvatar());
		profileCard.innerHTML = /*html*/`
			<div class="bg-white rounded-lg p-6">
				<div class="flex flex-col items-center">
					<img src=${avatarImg} class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0"></img>
					<h1 class="text-xl font-bold">${userInfo.displayName}</h1>
					<p>${userInfo.name} ${userInfo.surname}</p>
					<div class="mt-6 flex flex-wrap gap-4 justify-center">
						<a data-link href="/edit-profile" id='edit-btn' class="btn-primary bg-white hover:bg-black">Edit profile</a>
					</div>
				</div>
				<!-- <hr class="my-6 border-t border-gray-300">
				<div class="flex flex-col">
					<span class="text-gray-700 uppercase font-bold tracking-wider mb-2">Skills</span>
					<ul>
						<li class="mb-2">JavaScript</li>
						<li class="mb-2">React</li>
						<li class="mb-2">Node.js</li>
						<li class="mb-2">HTML/CSS</li>
						<li class="mb-2">Tailwind Css</li>
					</ul>
				</div> -->
			</div>

		`
	}

	return profileCard;
}
