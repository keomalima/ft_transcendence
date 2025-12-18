import { AppContext, TournamentData, TournamentGame } from "../types.js";

export class TournamentBracket extends HTMLElement {
	private _tournamentData: TournamentData | null = null;
	private _tournamentGamesData: TournamentGame[] | null = null;
	private _imageUrl: string = 'http://localhost:3000';
	private _ctx: AppContext | null = null;

	constructor() {
		super();
		this.render();
	}

	set ctx(value: AppContext) {
		this._ctx = value;
	}

	set tournamentGamesData(value : TournamentGame[] | null) {
		this._tournamentGamesData = value;
		if (value){
			this.loadAndRender();
		}
	}

	set tournamentData(value: TournamentData | null) {
		this._tournamentData = value;
		if (value) {
			this.loadAndRender();
		}
	}

	private async loadAndRender() {
		this.render();
		this.displayMatchCards();
	}

	private render() {
		this.innerHTML = /*html*/`
			<div class="flex w-full overflow-x-auto py-8 font-sans">
			  <div id='match-cards' class="mx-auto flex w-max items-center gap-10 px-4"> </div>
			</div>
		`;
	}

	private displayMatchCards(): void {
	    const matchCardsContainer = document.getElementById('match-cards');
	    if (!matchCardsContainer || !this._tournamentData) return;
	
	    matchCardsContainer.innerHTML = '';
		matchCardsContainer.className = 'flex flex-row gap-10 px-4 w-max mx-auto';
	
	    const totalRounds = this._tournamentData.totalRounds;
	
	    for (let currentRound = 1; currentRound <= totalRounds; currentRound++) {
	        
	        const gamesInThisRound = Math.pow(2, totalRounds - currentRound);
	        const column = document.createElement('div');
	        
	        if (currentRound === 1) {
	            column.className = 'flex flex-col gap-8';
	        } else {
	            column.className = 'flex flex-col justify-around py-10';
	        }
	
	        for (let i = 1; i <= gamesInThisRound; i++) {
	            const game = this.findGame(currentRound, i);
	            const card = game ? this.createMatchCard(game, false) : this.createEmptyCard(false);
	            column.appendChild(card);
	        }
	
	        matchCardsContainer.appendChild(column);
	    }
	}
	 
	// Mirrored brackets
	// private displayMatchCards(): void {
	// 	const matchCardsContainer = document.getElementById('match-cards');
	// 	if (!matchCardsContainer || !this._tournamentData ) return;

	// 	matchCardsContainer.innerHTML = '';
	// 	const totalRounds = this._tournamentData.totalRounds;
	// 	const visualColumns:HTMLElement[] = new Array((totalRounds * 2) - 1);

	// 	for (let currentRound = 1; currentRound <= totalRounds; currentRound++) {
	// 		const gamesInThisRound = Math.pow(2, totalRounds - currentRound);
	// 		const isFinal = currentRound === totalRounds;
			
	// 		if (isFinal) {
	// 			const centerCol = document.createElement('div');
	// 			centerCol.className = 'relative z-10 scale-110 transform shadow-2xl flex flex-col justify-center';

	// 			const game = this.findGame(currentRound, 1);
	// 			if (game) {
	// 				centerCol.appendChild(this.createMatchCard(game));
	// 			} else {
	// 				centerCol.appendChild(this.createEmptyCard());
	// 			}
	// 			visualColumns[totalRounds - 1] = centerCol;
	// 		} else {
	// 			const [leftCol, rigthCol] = this.createCol(currentRound, gamesInThisRound);
	// 			const leftIndex = currentRound - 1;
	// 			const rightIndex = visualColumns.length - currentRound;

	// 			visualColumns[leftIndex] = leftCol;
	// 			visualColumns[rightIndex] = rigthCol;
	// 		}
	// 	}
	// 	visualColumns.forEach(col => {
	// 		if (col) matchCardsContainer.appendChild(col);
	// 	})
	// }

	// private createCol(currentRound: number, gamesInThisRound: number): HTMLElement[] {
	// 	let className = '';
		
	// 	if (currentRound === 1) {
	// 		className = 'flex flex-col gap-8';
	// 	} else {
	// 		className = 'flex flex-col justify-around py-10';
	// 	}
	// 	const leftCol = document.createElement('div');
	// 	leftCol.className = className;

	// 	const rightCol = document.createElement('div');
	// 	rightCol.className = className;

	// 	for (let i = 1; i <= gamesInThisRound; i++) {
	// 		const game = this.findGame(currentRound, i);

	// 		if (i <= gamesInThisRound / 2) {
	// 			const card = game ? this.createMatchCard(game) : this.createEmptyCard();
	// 			leftCol.appendChild(card);
	// 		} else {
	// 			const card = game ? this.createMatchCard(game, true) : this.createEmptyCard();
	// 			rightCol.appendChild(card);
	// 		}
	// 	}
	// 	return [leftCol, rightCol]
	// }

	private findGame(roundNbr: number, matchNbr: number): TournamentGame | undefined {
		return this._tournamentGamesData?.find(
			game => game.roundNumber === roundNbr && game.matchNumber === matchNbr
		);
	}

	private createMatchCard(game: TournamentGame, isMirrored: boolean = false): HTMLElement {
		const card = document.createElement('div');
		card.className = `w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md ${isMirrored ? 'text-right' : ''}`;

		const innerContainer = document.createElement('div');
		innerContainer.className = 'flex flex-col divide-y divide-gray-100';

		const [player1, player2] = game.gameUsers;
		let winnerIndex = null;
		if (player1.score > player2.score) winnerIndex = 0;
		else if (player2.score > player1.score) winnerIndex = 1;
		
		game.gameUsers.forEach((player, idx) => {
			const isWinner = idx === winnerIndex;
			const isLoser = winnerIndex !== null && !isWinner;

			// row content ==============
			const row = document.createElement('div');
        	row.className = `flex items-center justify-between px-4 py-3 ${isMirrored ? 'flex-row-reverse' : ''} ${isWinner ? 'bg-indigo-50/30' : ''}`;

			// player content ==============
			const playerInfo = document.createElement('div');
			playerInfo.className = `flex items-center gap-3 ${isMirrored ? 'flex-row-reverse' : ''}`;

			// avatar content ==============
			const avatar = document.createElement('img');
	        avatar.src = `${this._imageUrl}${player.user.avatarUrl}`;
	        avatar.className = `h-8 w-8 rounded-full object-cover ring-2 ${isWinner ? 'ring-indigo-100' : 'ring-gray-100'}`;

			// name content ==============
	        const name = document.createElement('span');
	        name.innerText = player.user.displayName;
	        name.className = `text-sm font-medium ${isWinner ? 'text-indigo-900' : 'text-gray-600'} ${isLoser ? 'opacity-75' : ''}`;

	        // score content  ==============
	        const score = document.createElement('span');
	        score.innerText = player.score.toString();
	        score.className = `font-mono text-lg font-bold ${isWinner ? 'text-indigo-600' : 'text-gray-400'}`;
			
	        playerInfo.appendChild(avatar);
	        playerInfo.appendChild(name);
	        row.appendChild(playerInfo);
	        row.appendChild(score);
	
	        innerContainer.appendChild(row)
		})

		card.appendChild(innerContainer);
		return card;
	}

	private createEmptyCard(isMirrored: boolean = false): HTMLElement {
		const card = document.createElement('div');
    	card.className = `w-64 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-4 ${isMirrored ? 'text-right' : ''}`;
	
		const innerContainer = document.createElement('div');
    	innerContainer.className = 'flex flex-col gap-3 opacity-50';
		
		for (let i = 0; i < 2; i++ ) {
	
			// row content ==============
			const row = document.createElement('div');
        	row.className = `flex items-center justify-between ${isMirrored ? 'flex-row-reverse' : ''}`;

			// player content ==============
			const playerInfo = document.createElement('div');
			playerInfo.className = `flex items-center gap-3 ${isMirrored ? 'flex-row-reverse' : ''}`;

			// avatar content ==============
			const avatar = document.createElement('div');
	        avatar.className = 'h-8 w-8 rounded-full bg-gray-200';

			// name content ==============
	        const name = document.createElement('span');
	        name.innerText = 'TBD';
	        name.className = 'text-sm font-medium text-gray-400';

			// score content  ==============
			const score = document.createElement('span');
	        score.innerText = '-';
	        score.className = 'font-mono text-lg text-gray-300';
			
	        playerInfo.appendChild(avatar);
	        playerInfo.appendChild(name);
	        row.appendChild(playerInfo);
			row.appendChild(score);

	        innerContainer.appendChild(row);
		}

		card.appendChild(innerContainer);
		return card;
	}
}

customElements.define('tournament-bracket', TournamentBracket);