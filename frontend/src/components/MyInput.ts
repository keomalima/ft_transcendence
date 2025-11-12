class MyInput extends HTMLElement {
	constructor() {
		super();

		const inputCustom = this.getAttribute('custom');
		const inputType = this.getAttribute('inputType');
		const inputName = this.getAttribute('inputName');
		const inputAutoComplete = this.getAttribute('inputAutoComplete');
		const inputId = this.getAttribute('inputId');
		const isRequired = this.hasAttribute('required');
		const inputPlaceholder: string | null = this.getAttribute('inputPlaceholder') as string;

		const elem = document.createElement('div');
		elem.className = 'mt-2';

		const input = document.createElement('input');
		input.className = 'input-style outline-creamgrey ' + inputCustom;

		if (inputName)
			input.name = inputName;
		if (inputId)
			input.id = inputId;
		if (inputAutoComplete)
			input.setAttribute('autocomplete', inputAutoComplete);
		if (inputType)
			input.setAttribute('type', inputType);
		if (isRequired) {
            input.required = true;
        }
		if (inputPlaceholder) {
			input.placeholder = inputPlaceholder;
		}

		elem.appendChild(input);
		this.appendChild(elem);
	}
}

customElements.define('my-input', MyInput);
