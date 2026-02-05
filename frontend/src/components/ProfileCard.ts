import { AppContext, UserState } from "../types.js";
import { BUTTON_WHITE_CLASSES } from "../styles/tailwindStyles.js";
import { API_BASE_URL } from "../config.js";

export class ProfileCard extends HTMLElement {

	private _ctx: AppContext | null = null;
	private _user: Partial<UserState> | null = null;
	private _uploadsUrl: string = API_BASE_URL;
	
	constructor() {
		super();
	}

	set ctx(value : AppContext)
	{
		this._ctx = value;
		this.render();
	}

	set user(value : Partial<UserState>)
	{
		this._user = value;
		this.render();
	}

	connectedCallback() {
		if (this._ctx && this._user) {
			this.render();
		}
	}

	private render() {
		const currentUser = this._ctx?.userStore.get();
		const avatarRaw = currentUser?.avatarUrl || '/uploads/avatars/default.jpg';
    	const avatarSrc = /^https?:\/\//i.test(avatarRaw) ? avatarRaw : `${API_BASE_URL}${avatarRaw}`;
		console.log('AvatarSrc', avatarSrc);
		if (this._user?.id === currentUser?.id) {
			this.innerHTML =
			/*html*/`
				<div class="bg-white rounded-lg p-6">
					<div class="flex flex-col items-center">
						<img src='${avatarSrc}' class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0 object-cover"></img>
						<h1 class="text-xl font-bold truncate">${currentUser?.displayName}</h1>
						<p class='truncate'>${currentUser?.name} ${currentUser?.surname}</p>
						<div class="mt-6 flex flex-wrap gap-4 justify-center">
							<a data-link href="/edit-profile" id='edit-btn' class="${BUTTON_WHITE_CLASSES} ">Edit profile</a>
						</div>
					</div>
				</div>
			`
		} else {
			this.innerHTML =
			/*html*/`
				<div class="bg-white rounded-lg p-6">
					<div class="flex flex-col items-center">
						<img src='${avatarSrc}' class="w-32 h-32 bg-gray-300 rounded-full mb-4 shrink-0 object-cover"></img>
						<h1 class="text-xl font-bold">${this._user?.displayName}</h1>
						<p>${this._user?.name} ${this._user?.surname}</p>
					</div>
				</div>
			`			
		}
	}
}

customElements.define('profile-card', ProfileCard);
