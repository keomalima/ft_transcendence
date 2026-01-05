import { AppContext, GameHistory } from "../types";

export class BigStats extends HTMLElement {

	private _ctx: AppContext | null = null;
	private _gameHistory: GameHistory[] | null = null;
	private _totalWonGame: number = 0;
	private _winningStreak: number = 0;
	private _totalGamePlayed: number = 0;
	private _totalPlayingTime: number = 0;

	constructor() {
		super();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
		if (this.isConnected && this._ctx && this._gameHistory)
			this.loadAndRender();
	}

	set gameHistory(value: GameHistory[]) {
		this._gameHistory = value;
		if (this.isConnected && this._ctx && this._gameHistory)
			this.loadAndRender();
	}

	connectedCallback() {
		if (this.isConnected && this._ctx && this._gameHistory)
			this.loadAndRender();
	}

	private calculate() {
		let currentStreak = 0;
		let maxStreak = 0;
		this._gameHistory?.forEach((match) => {
			if (match.isWinner === true) {
				this._totalWonGame++;
				currentStreak++;
				if (currentStreak > maxStreak) {
					maxStreak = currentStreak;
				}
			} else {
				currentStreak = 0;
			}
			this._totalGamePlayed++;
			this._totalPlayingTime += match.duration!;
		});
		this._winningStreak = maxStreak;
	}

	private async loadAndRender() {
		this.calculate();
		this.render();

	}


	private render() {

		let playingTime: string;
		if (this._totalPlayingTime >= 60) {
			const hour = Math.floor(this._totalPlayingTime / 60);
			const min = this._totalPlayingTime % 60;
			playingTime = `${hour}h`;
			if (min != 0)
				playingTime += `${min}`;
		} else {
			playingTime = `${this._totalPlayingTime}'`;
		}

		this.innerHTML =
		/*html*/`
			<div class="mx-auto max-w-7xl px-6 lg:px-8 ">
				<dl class="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
					<div class="mx-auto flex max-w-xs flex-col gap-y-1">
						<dt class="text-base/7 text-black">total won games</dt>
						<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">${this._totalWonGame}</dd>
					</div>
					<div class="mx-auto flex max-w-xs flex-col gap-y-1">
						<dt class="text-base/7 text-black">winning streak</dt>
						<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">${this._winningStreak}</dd>
					</div>
					<div class="mx-auto flex max-w-xs flex-col gap-y-1">
						<dt class="text-base/7 text-black">total games played</dt>
						<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">${this._totalGamePlayed}</dd>
					</div>
					<div class="mx-auto flex max-w-xs flex-col gap-y-1">
						<dt class="text-base/7 text-black">Total playing time </dt>
						<dd class="font-[Calistoga] order-first text-5xl tracking-tight text-black sm:text-8xl">${playingTime}</dd>
					</div>
				</dl>
			</div>
		`
	}
}

customElements.define('big-stats', BigStats);
