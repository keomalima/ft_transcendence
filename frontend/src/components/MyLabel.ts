class MyLabel extends HTMLElement {
	constructor() {
		super();

		const labelCustom = this.getAttribute('custom');
		const labelFor = this.getAttribute('labelFor');
		const text = this.textContent;
		
		const elem = document.createElement('label');
		elem.innerHTML = text;


		// define style
		elem.className = 'block text-sm/6' + labelCustom;

		if (labelFor)
			elem.setAttribute('for', labelFor);
		
		this.innerHTML = '';
		this.appendChild(elem);
	}
}

customElements.define('my-label', MyLabel);