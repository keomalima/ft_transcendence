export function LastMatches() : HTMLElement | null {
	const lastMatches = document.getElementById('last-matches');
	if (lastMatches)
	{
		lastMatches.innerHTML = /*html*/`
		<div class="col-span-4 sm:col-span-9">
			<div class="bg-white rounded-lg p-6">
				<h1>Last Matches</h2>


		
			</div>
		</div>
		`;
	}
	return lastMatches;
}