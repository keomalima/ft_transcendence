export function LearnMore() {
	const root = document.getElementById('root');
	if (root)
	{
		root.innerHTML = '';
		root.innerHTML = /*html*/
		`
			<h1>This is the learn more page</h1>
			<p>learn more page</p>
		`;
	}
}
