export function createHeader(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'test-white p-8 text-center';

    const h1 = document.createElement('h1');
    h1.className = 'text-4xl font-bold';
    h1.textContent = 'Ly-Sha Than';

    const p = document.createElement('p');
    p.className = 'text-xl mt-2';
    p.textContent = 'Software Developer';

    header.appendChild(h1);
    header.appendChild(p);

    return header;
}