import { AppContext, GameHistory } from "../types";

// Declare ApexCharts as a global type
declare const ApexCharts: any;

export class Statistics extends HTMLElement {

	private _ctx: AppContext | null = null;
	private _gameHistory: GameHistory[] | null = null;
	private _totalWonGame: number = 0;
	private _winningStreak: number = 0;
	private _totalGamePlayed: number = 0;
	private _totalPlayingTime: number = 0;
	private _amber = "#F2C533";
	private _cinnamon = "#D69000";
	private _ochre = "#F7F16F";
	private _timeGameHistory = new Map<number, Map<number, Map<number, GameHistory[]>>>();
	//							year 			month(12) 	days(31)  	
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
			}
			this._totalGamePlayed++;
			this._totalPlayingTime += match.duration!;
		});
		this._winningStreak = maxStreak;
	}

	private async loadAndRender() {
		this.calculate();
		this.render();
		this.chart();
		// Add dropdown event listeners after rendering
		setTimeout(() => this.setupDropdownListeners(), 0);
	}
	private setupDropdownListeners() {
		const dropdownButton = this.querySelector('#dropdownLastDaysButton');
		const dropdownMenu = this.querySelector('#LastDaysdropdown');
		if (!dropdownButton || !dropdownMenu) return;

		// Toggle dropdown visibility
		dropdownButton.addEventListener('click', (e) => {
			e.preventDefault();
			dropdownMenu.classList.toggle('hidden');
		});

		// Add listeners to each option
		dropdownMenu.querySelectorAll('a[data-range]').forEach((a) => {
			a.addEventListener('click', (e) => {
				e.preventDefault();
				const type = (a as HTMLElement).getAttribute('data-range');
				// Update button label
				dropdownButton.childNodes[0].textContent = a.textContent;
				// Hide dropdown
				dropdownMenu.classList.add('hidden');
				// Update chart (implement logic for each range)
				this.timeChart(type);
			});
		});
	}


	private render() {
		let onlineGames = 0;
		this._gameHistory?.map((game) => {
			if (game.type != 'LOCAL')
				onlineGames++;
		});
		if (this._gameHistory?.length == 0 || onlineGames === 0) {
			this.innerHTML =
			/*html*/`
				<h1>Statistics</h1>
				<div class='flex gap-10 justify-center'>
					<div id="time-chart"></div>
					<div>games played per day/week/month</div>
				</div>
			`
		} else {
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
				<h1>Statistics</h1>
				<div class='flex gap-10 justify-center'>
					<div id="win-lose-chart"></div>
					<div id="types-chart"></div>
					<div id="time-chart"></div>
					<div class="grid grid-cols-1 items-center justify-between">
						<div class="flex justify-between items-center pt-4 md:pt-6">
							<!-- Button -->
							<button id="dropdownLastDaysButton" data-dropdown-toggle="LastDaysdropdown" data-dropdown-placement="bottom" class="text-sm font-medium text-body hover:text-heading text-center inline-flex items-center" type="button">
								Last 7 days
								<svg class="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
							</button>
							<!-- Dropdown menu -->
							<div id="LastDaysdropdown" class="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-44">
								<ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdownLastDaysButton">
									<li>
									<a href="#" data-range="week" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Last weeks</a>
									</li>
									<li>
									<a href="#" data-range="month" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Last months</a>
									</li>
									<li>
									<a href="#" data-range="year" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">This year</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			`
		}
	}

	private chart() {
		this.winLoseChart();
		this.typesChart();
		this.timeChart('week');
	}

	private parseTimeGameHistory() {

		if (!this._gameHistory)
			return;

		this._gameHistory.map((game) => {
			const gameDate = new Date(game.date!);
			const year = gameDate.getFullYear();
			const month = gameDate.getMonth() + 1;
			const day = gameDate.getDate();

			if (!this._timeGameHistory.has(year)) {
				this._timeGameHistory.set(year, new Map<number, Map<number, GameHistory[]>>());
			}
			const yearMap = this._timeGameHistory.get(year)!;
			if (!yearMap.has(month)) {
				yearMap.set(month, new Map<number, GameHistory[]>());
			}
			const monthMap = yearMap.get(month)!;
			if (!monthMap.has(day)) {
				monthMap.set(day, []);
			}
			monthMap.get(day)!.push(game);
		})
	}

	private getWeekGameHistory() {
		const today = new Date();
		// Get Monday of current week
		const startCurrentWeek = new Date(today);
		const dayOfWeek = startCurrentWeek.getDay();
		const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		startCurrentWeek.setDate(startCurrentWeek.getDate() + diffToMonday);
		// Get Monday of last week
		const startLastWeek = new Date(startCurrentWeek);
		startLastWeek.setDate(startCurrentWeek.getDate() - 7);

		// Initialize counts for all days (0=Sun, 1=Mon, ..., 6=Sat)
		const currentWeekGames = new Map<number, number>();
		const lastWeekGames = new Map<number, number>();
		for (let i = 0; i < 7; i++) {
			currentWeekGames.set(i, 0);
			lastWeekGames.set(i, 0);
		}

		this._gameHistory?.forEach((game) => {
			const gameDate = new Date(game.date!);
			// Remove time for comparison
			gameDate.setHours(0, 0, 0, 0);
			if (gameDate >= startCurrentWeek) {
				const day = gameDate.getDay();
				currentWeekGames.set(day, currentWeekGames.get(day)! + 1);
			} else if (gameDate >= startLastWeek && gameDate < startCurrentWeek) {
				const day = gameDate.getDay();
				lastWeekGames.set(day, lastWeekGames.get(day)! + 1);
			}
		});

		// Return as arrays for charting
		const result = [currentWeekGames, lastWeekGames];
		return result;
	}

	private timeChart(type: string | null) {
		if (!type)
			type = 'week';
		this.parseTimeGameHistory();
		const weekGameHistory = this.getWeekGameHistory();
		const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		const currentData = dayLabels.map((label, i) => ({ x: label, y: weekGameHistory[0].get(i) || 0 }));
		const lastData = dayLabels.map((label, i) => ({ x: label, y: weekGameHistory[1].get(i) || 0 }));
		console.log('📆 timeGameHistory ', this._timeGameHistory);
		const options = {
			colors: [this._amber, this._cinnamon],
			series: [
			{ name: "last", color: this._ochre, data: lastData },
			{ name: "current", color: this._amber, data: currentData },
			],
			chart: {
			type: "bar",
			height: "320px",
			fontFamily: "Inter, sans-serif",
			toolbar: {
				show: false,
			},
			},
			plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: "70%",
				borderRadiusApplication: "end",
				borderRadius: 8,
			},
			},
			tooltip: {
			shared: true,
			intersect: false,
			style: {
				fontFamily: "Inter, sans-serif",
			},
			},
			states: {
			hover: {
				filter: {
				type: "darken",
				value: 1,
				},
			},
			},
			stroke: {
			show: true,
			width: 0,
			colors: ["transparent"],
			},
			grid: {
			show: false,
			strokeDashArray: 4,
			padding: {
				left: 2,
				right: 2,
				top: -14
			},
			},
			dataLabels: {
			enabled: false,
			},
			legend: {
			show: false,
			},
			xaxis: {
			floating: false,
			labels: {
				show: true,
				style: {
				fontFamily: "Inter, sans-serif",
				cssClass: 'text-xs font-normal fill-body'
				}
			},
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},
			},
			yaxis: {
			show: false,
			},
			fill: {
			opacity: 1,
			},
		}

		if(document.getElementById("time-chart") && typeof ApexCharts !== 'undefined') {
			const chart = new ApexCharts(document.getElementById("time-chart"), options);
			chart.render();
		}
	}

	private typesChart() {
		const labels = ['online', 'local', 'tournament'];
		let series = [0, 0, 0];
		this._gameHistory?.map((game) => {
			if (game.type === 'ONLINE')
				series[0]++;
			else if (game.type === 'LOCAL')
				series[1]++;
			else if (game.type === 'TOURNAMENT')
				series[2]++;
		});

		const getChartOptions = () => {
			return {
 				series: series,
 				colors: [this._amber, this._cinnamon, this._ochre],
 				chart: {
 					height: 320, // Chart height in pixels
 					width: "100%", // Chart width (responsive)
 					type: "donut", // Chart type
 				},
 				stroke: {
 					colors: ["transparent"], // No border between segments
 					lineCap: "", // Default line cap
 				},
 				plotOptions: {
 					pie: {
 						donut: {
 							labels: {
 								show: true, // Show labels inside donut
 								name: {
 									show: true, // Show label name (e.g. 'Wins')
 									fontFamily: "Inter, sans-serif",
 									offsetY: 20, // Move label down
 								},
 								total: {
 									showAlways: true, // Always show total in center
 									show: true,
 									label: "Total Games", // Center label
 									fontFamily: "Inter, sans-serif",
 									// Show the sum of all segments in the center
 									formatter: function (w: any) {
 										const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
 										return sum;
 									},
 								},
 								value: {
 									show: true, // Show value for each segment
 									fontFamily: "Inter, sans-serif",
 									offsetY: -20, // Move value up
 									formatter: function (value: any) {
 										return value; // Show raw value (not 'k')
 									},
 								},
 							},
 							size: "80%", // Donut thickness
 						},
 					},
 				},
 				grid: {
 					padding: {
 						top: -2, // Reduce top padding
 					},
 				},
 				labels: labels, // The labels for each segment
 				dataLabels: {
 					enabled: false, // Hide data labels outside chart
 				},
 				legend: {
 					position: "bottom", // Legend below chart
 					fontFamily: "Inter, sans-serif",
 				},
 				yaxis: {
 					labels: {
 						formatter: function (value: any) {
 							return value; // Show raw value
 						},
 					},
 				},
 				xaxis: {
 					labels: {
 						formatter: function (value: any) {
 							return value; // Show raw value
 						},
 					},
 					axisTicks: {
 						show: false,
 					},
 					axisBorder: {
 						show: false,
 					},
 				},
 			};
		}

		if (document.getElementById("types-chart") && typeof ApexCharts !== 'undefined') {
			const chart = new ApexCharts(document.getElementById("types-chart"), getChartOptions());
			chart.render();
		}
	}

	private winLoseChart() {
		const labels = ['wins', 'loses'];
		let series = [0, 0];
		this._gameHistory?.map((game) => {
			if (game.isWinner)
				series[0]++;
			else
				series[1]++;
		});

		const getChartOptions = () => {
			return {
 				// The data for each segment of the donut chart
 				series: series,
 				// The colors for each segment (from your theme)
 				colors: [this._amber, this._cinnamon],
 				chart: {
 					height: 320, // Chart height in pixels
 					width: "100%", // Chart width (responsive)
 					type: "donut", // Chart type
 				},
 				stroke: {
 					colors: ["transparent"], // No border between segments
 					lineCap: "", // Default line cap
 				},
 				plotOptions: {
 					pie: {
 						donut: {
 							labels: {
 								show: true, // Show labels inside donut
 								name: {
 									show: true, // Show label name (e.g. 'Wins')
 									fontFamily: "Inter, sans-serif",
 									offsetY: 20, // Move label down
 								},
 								total: {
 									showAlways: true, // Always show total in center
 									show: true,
 									label: 'rate of wins', // Center label
 									fontFamily: "Inter, sans-serif",
 									// Show the sum of all segments in the center
 									formatter: function (w: any) {
										const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
										const wins = w.globals.seriesTotals[0];
										if (sum === 0) return "0%";
										const rate = ((wins / sum) * 100).toFixed(1);
										return `${rate}%`;
									},
 								},
 								value: {
 									show: true, // Show value for each segment
 									fontFamily: "Inter, sans-serif",
 									offsetY: -20, // Move value up
 									formatter: function (value: any) {
 										return value; // Show raw value (not 'k')
 									},
 								},
 							},
 							size: "80%", // Donut thickness
 						},
 					},
 				},
 				grid: {
 					padding: {
 						top: -2, // Reduce top padding
 					},
 				},
 				labels: labels, // The labels for each segment
 				dataLabels: {
 					enabled: false, // Hide data labels outside chart
 				},
 				legend: {
 					position: "bottom", // Legend below chart
 					fontFamily: "Inter, sans-serif",
 				},
 				yaxis: {
 					labels: {
 						formatter: function (value: any) {
 							return value; // Show raw value
 						},
 					},
 				},
 				xaxis: {
 					labels: {
 						formatter: function (value: any) {
 							return value; // Show raw value
 						},
 					},
 					axisTicks: {
 						show: false,
 					},
 					axisBorder: {
 						show: false,
 					},
 				},
 			};
		}

		if (document.getElementById("win-lose-chart") && typeof ApexCharts !== 'undefined') {
			const chart = new ApexCharts(document.getElementById("win-lose-chart"), getChartOptions());
			chart.render();
		}
	}
}

customElements.define('game-statistics', Statistics);
