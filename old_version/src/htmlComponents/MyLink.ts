class MyLink extends HTMLElement {
	constructor() {
		super();

		const linkCustom = this.getAttribute('custom');
		const linkId = this.getAttribute('lId');
		const linkHref = this.getAttribute('lHref');
		const text = this.textContent;
		
		const elem = document.createElement('a');
		elem.innerHTML = text || '';
		elem.href = linkHref || '#';
		elem.setAttribute('data-link', '');
		
		if (linkId) {
			elem.id = linkId; // Keep as string
		}
		
		elem.className = 'styled-link ' + linkCustom;
		
		this.innerHTML = '';
		this.appendChild(elem);
	}
}

customElements.define('my-link', MyLink);