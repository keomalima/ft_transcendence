import profilePicture from '../images/profilePicture.webp';
import { userData } from '../data/userData';


export function ProfileCard () : HTMLElement | null {

	const user = userData;
	const profileCard = document.getElementById('profile-card');
	if (profileCard)
	{
		profileCard.innerHTML = /*html*/`
			<div class="bg-white shadow rounded-lg p-6">
				<div class="flex flex-col items-center">
					<img src="${profilePicture}" class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0">

					</img>
					<h1 class="text-xl font-bold">John Doe</h1>
					<p class="text-gray-700">Software Developer</p>
					<div class="mt-6 flex flex-wrap gap-4 justify-center">
						<a href="#" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">Contact</a>
						<a href="#" class="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded">Resume</a>
					</div>
				</div>
				<hr class="my-6 border-t border-gray-300">
				<div class="flex flex-col">
					<span class="text-gray-700 uppercase font-bold tracking-wider mb-2">Skills</span>
					<ul>
						<li class="mb-2">JavaScript</li>
						<li class="mb-2">React</li>
						<li class="mb-2">Node.js</li>
						<li class="mb-2">HTML/CSS</li>
						<li class="mb-2">Tailwind Css</li>
					</ul>
				</div>
			</div>

		`
	}
	return profileCard;
}
