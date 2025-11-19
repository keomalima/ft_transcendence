import { AppContext } from "../types.js";
import { BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";

export class ProfileCard extends HTMLElement {

	private _ctx: AppContext | null = null;
	private _uploadsUrl: string = 'http://localhost:3000';
	
	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
		if (this.isConnected) {
			this.render();
		}
	}

	connectedCallback() {
		if (this._ctx) {
			this.render();
		}
	}

	private render() {
		const currentUser = this._ctx?.userStore.get();
		const profilePicture: string = `${this._uploadsUrl}${currentUser?.avatarUrl}`;
		this.innerHTML =
		/*html*/`
			<div class="bg-white rounded-lg p-6">
				<div class="flex flex-col items-center">
					<img src='${profilePicture}' class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0"></img>
					<h1 class="text-xl font-bold">${currentUser?.displayName}</h1>
					<p>${currentUser?.name} ${currentUser?.surname}</p>
					<div class="mt-6 flex flex-wrap gap-4 justify-center">
						<a data-link href="/edit-profile" id='edit-btn' class="${BUTTON_WHITE_CLASSES} ">Edit profile</a>
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
}

customElements.define('profile-card', ProfileCard);
