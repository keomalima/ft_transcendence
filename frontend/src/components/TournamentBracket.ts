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
				if (game) {
					const card = game.gameUsers.length === 2 ? this.createMatchCard(game, false) : this.createEmptyCard(game, false);
	            	column.appendChild(card);
				}
	        }
	
	        matchCardsContainer.appendChild(column);
	    }
	}

	private findGame(roundNbr: number, matchNbr: number): TournamentGame | undefined {
		return this._tournamentGamesData?.find(
			game => game.roundNumber === roundNbr && game.matchNumber === matchNbr
		);
	}

	private createMatchCard(game: TournamentGame, isMirrored: boolean = false): HTMLElement {
		console.log('Game', game.gameUsers);
		const status = (game as any).status || 'PENDING';
		const currentUser = this._ctx?.userStore.get();
		const isMyGame = currentUser?.id && game.gameUsers.some((p: any) => p.user.id === currentUser?.id);

		let borderClass = 'border-gray-200';
		let bgClass = 'bg-white';
		let ringClass = '';
		let shadowClass = 'shadow-sm';

		if (status === 'IN_PROGRESS') {
			borderClass = 'border-blue-400';
			ringClass = 'ring-1 ring-blue-400';
		} else if (status === 'ABANDONED') {
			borderClass = 'border-red-200';
			bgClass = 'bg-red-50/30';
		} else if (status === 'COMPLETED') {
			borderClass = 'border-gray-300';
		}

		if (isMyGame) {
			borderClass = 'border-indigo-500';
			ringClass = 'ring-2 ring-offset-2 ring-indigo-500';
			shadowClass = 'shadow-lg';
		}

		const card = document.createElement('div');
		card.className = `w-64 overflow-hidden rounded-xl border ${borderClass} ${bgClass} ${shadowClass} transition-all hover:shadow-md ${isMirrored ? 'text-right' : ''} ${ringClass}`;

		if (status === 'IN_PROGRESS') {
			const badge = document.createElement('div');
			badge.className = 'bg-blue-50 px-2 py-1 text-center text-xs font-bold text-blue-600 border-b border-blue-100';
			badge.innerText = 'LIVE';
			card.appendChild(badge);
		} else if (status === 'ABANDONED') {
			const badge = document.createElement('div');
			badge.className = 'bg-red-50 px-2 py-1 text-center text-xs font-bold text-red-600 border-b border-red-100';
			badge.innerText = 'ABANDONED';
			card.appendChild(badge);
		} else if (status === 'PENDING') {
		    const badge = document.createElement('div');
		    badge.className = 'bg-yellow-50 px-2 py-1 text-center text-xs font-bold text-yellow-600 border-b border-yellow-100';
		    badge.innerText = 'PENDING';
		    card.appendChild(badge);
		} else if (status === 'COMPLETED') {
		    const badge = document.createElement('div');
		    badge.className = 'bg-green-50 px-2 py-1 text-center text-xs font-bold text-green-600 border-b border-green-100';
		    badge.innerText = 'FINISHED';
		    card.appendChild(badge);
		}

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

	private createEmptyCard(game: TournamentGame, isMirrored: boolean = false): HTMLElement {
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
	        name.innerText = game.gameUsers[i] ? game.gameUsers[i].user.displayName : 'TBD';
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