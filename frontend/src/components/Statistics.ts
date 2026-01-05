import { AppContext, GameHistory } from "../types";

// Declare ApexCharts as a global type
declare const ApexCharts: any;

export class Statistics extends HTMLElement {

	private _ctx: AppContext | null = null;
	private _gameHistory: GameHistory[] | null = null;
	private _totalWonGame: number = 0;
	private _totalGamePlayed: number = 0;
	private _totalPlayingTime: number = 0;
	private _amber = "#F2C533";
	private _cinnamon = "#D69000";
	private _ochre = "#F7F16F";
	private _timeGameHistory = new Map<number, Map<number, Map<number, GameHistory[]>>>();
	private _chartType = 'week';

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
	}

	private loadAndRender() {
		this.calculate();
		this.parseTimeGameHistory();
		this.render();
		this.chart();
		setTimeout(() => this.setupDropdownListeners(), 0);
	}


	private render() {
		if (this._gameHistory?.length == 0) {	
			this.innerHTML =
			/*html*/`
				<h1>Statistics</h1>
				<div class="flex-1 overflow-auto min-h-0 flex items-center justify-center">
					<div class="text-center py-12 px-4">
						<!-- Icon/Illustration -->
						<div class="w-20 h-20 mx-auto mb-6 text-gray-300">
							<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</div>
						
						<!-- Message -->
						<p class="text-gray-500 mb-6 max-w-sm mx-auto">No matches yet.</p>
					</div>
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
				<div class='flex flex-wrap gap-10 justify-center'>
					<div id="win-lose-chart"></div>
					<div id="types-chart"></div>
					<div class="relative w-full justify-center" id="time-chart-parent">
						<div id="time-chart" class="w-full"></div>
						<div class="flex justify-center items-center pt-4 md:pt-6">
							<!-- Button -->
							<button id="dropdown-button" data-dropdown-toggle="LastDaysdropdown" data-dropdown-placement="bottom" class="text-sm font-medium text-body text-center inline-flex items-center" type="button">
								Last weeks
								<svg class="w-4 h-4 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7"/></svg>
							</button>
							<!-- Overlay backdrop -->
							<div id="dropdown-backdrop" class="hidden fixed inset-0 bg-black bg-opacity-20 z-40"></div>
							<!-- Dropdown menu -->
							<div id="dropdown" class="absolute left-0 top-full mt-2 z-50 hidden border border-default-medium rounded-base shadow-lg w-44 bg-white">
								<ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdown-button">
									<li time-chart-type="week" class="inline-flex items-center w-full p-2 hover:bg-stone-100 hover:font-semibold rounded">Last weeks</li>
									<li time-chart-type="month" class="inline-flex items-center w-full p-2 hover:bg-stone-100 hover:font-semibold rounded">Last months</li>
									<li time-chart-type="year" class="inline-flex items-center w-full p-2 hover:bg-stone-100 hover:font-semibold rounded">This year</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			`
		}
	}

	private setupDropdownListeners() {
		const dropdownButton = this.querySelector('#dropdown-button');
		const dropdownMenu = this.querySelector('#dropdown');
		const dropdownBackdrop = this.querySelector('#dropdown-backdrop');
		if (!dropdownButton || !dropdownMenu || !dropdownBackdrop) return;

		// Toggle dropdown visibility and backdrop
		dropdownButton.addEventListener('click', (e) => {
			e.preventDefault();
			const isOpen = dropdownMenu.classList.contains('hidden') === false;
			if (isOpen) {
				dropdownMenu.classList.add('hidden');
				dropdownBackdrop.classList.add('hidden');
			} else {
				dropdownMenu.classList.remove('hidden');
				dropdownBackdrop.classList.remove('hidden');
			}
		});

		// Hide dropdown when clicking on backdrop
		dropdownBackdrop.addEventListener('click', () => {
			dropdownMenu.classList.add('hidden');
			dropdownBackdrop.classList.add('hidden');
		});

		// Add listeners to each option
		dropdownMenu.querySelectorAll('li[time-chart-type]').forEach((li) => {
			li.addEventListener('click', (e) => {
				e.preventDefault();
				this._chartType = (li as HTMLElement).getAttribute('time-chart-type')!;
				// Update button label
				dropdownButton.childNodes[0].textContent = li.textContent;
				// Hide dropdown and backdrop
				dropdownMenu.classList.add('hidden');
				dropdownBackdrop.classList.add('hidden');
				// Ensure chart rerenders after DOM update
				this.timeChart();
			});
		});
	}

	private chart() {
		this.winLoseChart();
		this.typesChart();
		this.timeChart();
	}

	private parseTimeGameHistory() {

		if (!this._gameHistory)
			return;

		this._gameHistory.map((game) => {
			const gameDate = new Date(game.date!);
			const year = gameDate.getFullYear();
			const month = gameDate.getMonth();
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
		console.log('📆 timeGameHistory ', this._timeGameHistory);
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

	private getMonthGameHistory() {
		const todayYear = new Date().getFullYear();
		const todayMonth = new Date().getMonth();
		const currentMonthGames = new Map<number, number>();
		const lastMonthGames = new Map<number, number>();
	
		const currentMonthData = this._timeGameHistory.get(todayYear)?.get(todayMonth);
		for (let day = 1; day <= 31; day++) {
			let count = 0;
			const dayMap = currentMonthData?.get(day);
			if (dayMap) {
				dayMap.forEach(() => {
					count ++;
				});
			}
			currentMonthGames.set(day, count);
		}

		let lastMonthData;
		if (todayMonth === 0)
			lastMonthData = this._timeGameHistory.get(todayYear - 1)?.get(11);
		else
			lastMonthData = this._timeGameHistory.get(todayYear - 1)?.get(todayMonth);
		for (let day = 1; day <= 31; day++) {
			let count = 0;
			const dayMap = lastMonthData?.get(day);
			if (dayMap) {
				dayMap.forEach(() => {
					count ++;
				});
			}
			lastMonthGames.set(day, count);
		}
		const data = [currentMonthGames, lastMonthGames];
		console.log(data);
		return data;
	}

	private getYearGameHistory() {
		const todayYear = new Date().getFullYear();
		const currentYearGames = new Map<number, number>();
		const lastYearGames = new Map<number, number>();
	
		const currentYearData = this._timeGameHistory.get(todayYear);
		for (let month = 1; month <= 12; month++) {
			let count = 0;
			const monthMap = currentYearData?.get(month);
			if (monthMap) {
				monthMap.forEach((gamesArr) => {
					count += gamesArr.length;
				});
			}
			currentYearGames.set(month, count);
		}

		const lastYearData = this._timeGameHistory.get(todayYear - 1);
		for (let month = 1; month <= 12; month++) {
			let count = 0;
			const monthMap = lastYearData?.get(month);
			if (monthMap) {
				monthMap.forEach((gamesArr) => {
					count += gamesArr.length;
				});
			}
			lastYearGames.set(month, count);
		}
		const data = [currentYearGames, lastYearGames];
		console.log(data);
		return data;
	}
	
	private timeChart() {
		const chartContainer = document.getElementById("time-chart");
		if (!chartContainer)
			return;
		let currentData = null;
		let lastData = null;
		if (this._chartType === 'week'){
			const weekGameHistory = this.getWeekGameHistory();
			const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
			currentData = dayLabels.map((label, i) => ({ x: label, y: weekGameHistory[0].get(i) || 0 }));
			lastData = dayLabels.map((label, i) => ({ x: label, y: weekGameHistory[1].get(i) || 0 }));
		} else if (this._chartType === 'month') {
			const dayLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
			const monthGameHistory = this.getMonthGameHistory();
			currentData = dayLabels.map((label, i) => ({ x: label, y: monthGameHistory[0].get(i) || 0 }));
			lastData = dayLabels.map((label, i) => ({ x: label, y: monthGameHistory[1].get(i) || 0 }));
		} else if (this._chartType === 'year') {
			const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			const yearGameHistory = this.getYearGameHistory();
			currentData = monthLabels.map((label, i) => ({ x: label, y: yearGameHistory[0].get(i) || 0 }));
			lastData = monthLabels.map((label, i) => ({ x: label, y: yearGameHistory[1].get(i) || 0 }));
		}
		
		const isMonth = this._chartType === 'month';

		// Set max width for chart parent
		const chartParent = document.getElementById('time-chart-parent');
		if (chartParent) {
			if (isMonth) {
				chartParent.style.maxWidth = '400px';
			} else {
				chartParent.style.maxWidth = '320px';
			}
		}

		const options = {
			chart: {
				height: "320px",
				width: "100%",
				type: isMonth ? "area" : "bar",
				fontFamily: "Inter, sans-serif",
				dropShadow: {
					enabled: false,
				},
				toolbar: {
					show: false,
				},
			},
			tooltip: {
				enabled: true,
				x: {
					show: false,
				},
			},
			plotOptions: {
				bar: {
					horizontal: false,
					columnWidth: this._chartType === 'year' ? "50%" : "70%",
					borderRadiusApplication: "end",
					borderRadius: this._chartType === 'year' ? "2" : "6",
				},
			},
			fill: isMonth
				? {
					type: "gradient",
					gradient: {
						opacityFrom: 0.55,
						opacityTo: 0,
						shade: this._amber,
						gradientToColors: [this._amber],
					},
				}
				: {
					type: "solid",
					opacity: 1,
				},
			dataLabels: {
				enabled: false,
			},
			stroke: isMonth
				? { width: 2 }
				: { width: 0 },
			grid: {
				show: false,
				strokeDashArray: 4,
				padding: {
					left: 2,
					right: 2,
					top: 0
				},
			},
			series: [
				{ name: `last ${this._chartType}`, color: this._ochre, data: lastData },
				{ name: `current ${this._chartType}`, color: this._amber, data: currentData },
			],
			xaxis: {
				floating: false,
				labels: {
					show: true,
					style: {
						fontFamily: "Inter, sans-serif",
						cssClass: 'text-xs font-normal fill-body'
					},
					formatter: isMonth
						? function(value: string) {
							const day = parseInt(value, 10);
							return day % 2 != 0 ? value : '';
						}
						: undefined
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
		}

		// Remove previous chart instance if present
		const parent = chartContainer?.parentElement;
		if (chartContainer)
			parent?.removeChild(chartContainer)

		let tmp = document.createElement('div') as HTMLDivElement;
		tmp.id = 'time-chart';
		parent?.prepend(tmp);
		new ApexCharts(tmp, options).render();
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

		const options = () => {
			return {
 				series: series,
 				colors: [this._amber, this._cinnamon, this._ochre],
 				chart: {
 					height: 320, // Chart height in pixels
 					width: "100%", // Chart width (responsive)
 					type: "donut", // Chart type
 				},
 				stroke: {
					width: 6,
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
			const chart = new ApexCharts(document.getElementById("types-chart"), options());
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

		const options = () => {
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
			const chart = new ApexCharts(document.getElementById("win-lose-chart"), options());
			chart.render();
		}
	}
}

customElements.define('game-statistics', Statistics);
