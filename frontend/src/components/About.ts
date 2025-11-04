import { personalInfoData } from "../data/personalInfo";

export function createAbout() : HTMLElement {
	const section = document.createElement('section');
	section.className = 'p-8';

	const h2 = document.createElement('h2');
	h2.className = 'text-2xl font-bold mb-5';
	h2.textContent = 'About me';

	const info = document.createElement('div');
	info.className = 'text-lg';
	info.appendChild(createElement('p', 'text-lg font-bold', personalInfoData.name));
	info.appendChild(createElement('p', 'text-lg', personalInfoData.title));
	info.appendChild(createElement('p', 'text-lg', personalInfoData.bio));
	info.appendChild(createElement('p', 'text-lg', personalInfoData.email));
	info.appendChild(createElement('p', 'text-lg', personalInfoData.phone));
	info.appendChild(createElement('p', 'text-lg', personalInfoData.github));

	section.innerHTML = '';
	section.appendChild(h2);
	section.appendChild(info);

	return section;
}

function createElement(tag: string, className: string, text: string): HTMLElement {
	const element = document.createElement(tag);
	element.className = className;
	element.textContent = text;
	return element;
}