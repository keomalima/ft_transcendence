import { AppContext, GameHistory, UserState } from "../types.js";

export class FriendProfilePopUp extends HTMLElement {
	private _ctx: AppContext | null = null;
	private _friend: Partial<UserState>|null = null;
	private _friendHistory: GameHistory[] = []; 

	constructor() {
		super();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		this.render();
	}

	set friend(value: Partial<UserState>) {
		// console.log('friend : ', value);
		this._friend = value;
		this.render();
	}

	set friendHistory(value: GameHistory[]) {
		// console.log('friend history : ', value);
		this._friendHistory = value;
		this.render();
	}

	connectedCallback() {
		this.render();
	}

	private render() {

		this.innerHTML = /*html*/`
		<div class='flex flex-col'>
			<div>
				<button onclick="this.closest('dialog').close()" class="outline-none float-right pt-10 pr-10">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="flex flex-col w-full mx-auto p-10 gap-10">
				<h1 class='text-3xl'>Friend profile</h1>
				<!-- profile card + last matches -->
				<div class="w-full mt-10 flex flex-col md:flex-row gap-8 ">
					<div class="flex lg:w-1/4">
						<profile-card id='friend-profile-card-component' class='w-full overflow-hidden rounded-lg bg-white shadow-sm'></profile-card>
					</div>
					<div class="flex-1">
						<latest-match id='friend-latest-match-component' class="w-full overflow-hidden rounded-lg bg-white shadow-sm"></latest-match>
					</div>
				</div>

				<!-- Match history -->
				<div class="w-full mx-auto">
					<match-history id='friend-match-history-component' class="bg-white p-10 shadow-sm rounded-lg h-full flex flex-col gap-3 max-h-[80vh] lg:max-h-[50vh]"></match-history>
				</div>
			</div>
		</div>
        `;
		
		this.passContext();

	}

	private passContext() {
		const profileCardComponent = document.getElementById('friend-profile-card-component') as any;
		if (profileCardComponent) {
			profileCardComponent.ctx = this._ctx;
			profileCardComponent.user = this._friend;
		}
		const latestMatchComponent = document.getElementById('friend-latest-match-component') as any;
		if (latestMatchComponent) {
			latestMatchComponent.ctx = this._ctx;
			latestMatchComponent.gameHistory = this._friendHistory;
			latestMatchComponent.user = this._friend;
		}
		const matchHistoryComponent = document.getElementById('friend-match-history-component') as any;
		if (matchHistoryComponent) {
			matchHistoryComponent.ctx = this._ctx;
			matchHistoryComponent.gameHistory = this._friendHistory;
		}

	}

}

customElements.define('friend-profile-pop-up', FriendProfilePopUp);