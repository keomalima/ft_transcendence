export function renderBackendStatus(root: HTMLElement) {
	root.innerHTML = '';

	const section = document.createElement('section');
	section.className = 'p-8 space-y-4';

	const title = document.createElement('h2');
	title.className = 'text-2xl font-bold';
	title.textContent = 'Backend Status';

	const button = document.createElement('button');
	button.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition';
	button.textContent = 'Fetch status';

	const output = document.createElement('pre');
	output.className = 'bg-stone-900 text-stone-100 p-4 rounded min-h-[6rem] whitespace-pre-wrap';
	output.textContent = 'Click the button to fetch data from the backend.';

	button.addEventListener('click', async () => {
		output.textContent = 'Loading…';
		try {
			const response = await fetch('http://localhost:3000');
			if (!response.ok) {
				throw new Error(`Request failed with ${response.status}`);
			}
			const data = await response.json();
			output.textContent = JSON.stringify(data, null, 2);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			output.textContent = `Error: ${message}`;
		}
	});

	section.appendChild(title);
	section.appendChild(button);
	section.appendChild(output);
	root.appendChild(section);
}
