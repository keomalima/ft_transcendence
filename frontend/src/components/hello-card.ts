export class HelloCard extends HTMLElement {
    static get observedAttributes() { return ["list"]; }

    private root: ShadowRoot;
    private list: string[];

    constructor() {
        super();
        this.list = [];
        this.root = this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        console.log('==>', this.getAttribute("list"))
        if (this.hasAttribute("list") && Array.isArray(this.getAttribute("list")?.split(','))) this.list = this.getAttribute("list")?.split(',') || this.list;
        this.render();
    }

    attributeChangedCallback(attrName: string, _oldVal: string | null, newVal: string | null) {
        console.log(attrName, _oldVal, newVal)
        if (attrName === "list") { this.list = newVal?.split(',') ?? []; this.render(); }
    }

    private render() {
        this.root.innerHTML = `
            <style>
                :host {
                    display: block;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 12px 16px;
                    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
                }
                header { font-weight: 600; margin-bottom: 8px; }
                button {
                    margin-top: 8px;
                    padding: 6px 10px;
                    border-radius: 6px;
                    border: 1px solid #d1d5db;
                    background: #f9fafb;
                    cursor: pointer;
                }
                button:hover { background: #f3f4f6; }
            </style>
            <pre>Bonjour, ${this.list?.join(' - ')} !</pre>
        `;
    }
}

const tag = "hello-card";
if (!customElements.get(tag)) customElements.define(tag, HelloCard);
