import { NavBar } from "../components/NavBar";
import { ProfileCard } from "../components/ProfileCard";
import { LastMatches } from "../components/LastMatches";

export function Profile() {
	const app = document.getElementById('app');
	if (app)
	{
		app.innerHTML = '';
		app.innerHTML = /*html*/`
			<header id='navigation-bar'></header>
			<h1>This is the profile page</h1>
			<p>learn more page</p>

			<div class="container mx-auto py-8">
				<div class="grid grid-cols-4 sm:grid-cols-12 gap-6 px-4">
					<div class="col-span-4 sm:col-span-3" id='profile-card'></div>
					<div class="col-span-4 sm:col-span-9" id='last-matches'></div>


				</div>
			</div>
		</div>
			<!-- <div class="container mx-auto py-8">
				<div class="grid grid-cols-4 sm:grid-cols-12 gap-6 px-4">
					<div id='profile-card' class="grid grid-cols-4 sm:grid-cols-12 gap-6 px-4"></div>
				</div>
			</div> -->

		`;
	}
	NavBar();
	ProfileCard();
	LastMatches();
}
