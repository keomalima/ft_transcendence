export function learnMore() {
	const app = document.getElementById('app');
	if (app)
	{
		app.innerHTML = '';
		app.innerHTML = /*html*/
		`
			<h1>This is the learn more page</h1>
			<p>learn more page</p>
		`;
	}
}
