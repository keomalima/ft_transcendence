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
			<h1>Statistics</h1>
			<div class='flex gap-10 justify-center'>
				<div id="win-lose-chart"></div>
				<div id="types-chart"></div>
				<div>status (completed, abandoned)</div>
				<div>most frequent opponent</div>
				<div>games played per day/week/month</div>
			</div>
		`
	}

	private chart() {
		this.winLoseChart();
		this.typesChart();
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
