import { AppContext, TournamentGame } from "../types.js";

export class TournamentBracket extends HTMLElement {
	private _tournamentGamesData: TournamentGame | null = null;
	private _ctx: AppContext | null = null;

	constructor() {
		super();
		this.render();
		console.log(this._tournamentGamesData);
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		this.attachEventListener(this._ctx);
	}

	set tournamentGamesData(value : TournamentGame | null)
	{
		this._tournamentGamesData = value;
		if (value){
			this.loadAndRender();
		}
	}

	private async loadAndRender() {
		this.render();
	}

	private render() {
		this.innerHTML = /*html*/`
			<div class="px-6 py-12 sm:rounded-lg sm:px-12">
				<h1>${this._tournamentGamesData}<\h1>
			</div>

		`;
	}

	
	
	// ======== EVENT LISTENER ============

	private attachEventListener(ctx: AppContext | null) {

	}
}

customElements.define('tournament-bracket', TournamentBracket);