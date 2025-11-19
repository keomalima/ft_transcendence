class MyButton extends HTMLElement {
	constructor() {
		super();

		const btnCustom = this.getAttribute('custom');
		const btnType = this.getAttribute('btnType');
		const text = this.textContent;
		
		const elem = document.createElement('button');
		elem.innerHTML = text;


		// define style
		elem.className = 'btn-primary ' + btnCustom;
		const validTypes: Array<'button' | 'submit' | 'reset'> = ['button', 'submit', 'reset'];

		// define type
		elem.type = (btnType && validTypes.includes(btnType as any)) 
			? btnType as 'button' | 'submit' | 'reset' 
			: 'button';
		
		this.innerHTML = '';
		this.appendChild(elem);
	}
}

customElements.define('my-button', MyButton);