import profilePicture from '../images/ProfilePictureSquared.png';
import { userData } from '../data/userData';
import { navigateTo } from "../main";


export function ProfileCard () : HTMLElement | null {

	const user = userData;
	const profileCard = document.getElementById('profile-card');
	if (profileCard)
	{
		profileCard.innerHTML = /*html*/`
			<div class="bg-white rounded-lg p-6">
				<div class="flex flex-col items-center">
					<img src="${profilePicture}" class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0"></img>
					<h1 class="text-xl font-bold">${user.username}</h1>
					<p>${user.firstname} ${user.surname}</p>
					<p>${user.age} years old</p>
					<p>From ${user.city}</p>
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
