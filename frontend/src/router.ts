import { AppContext } from "./types";

// Define a new function type to make sure that the function sent to route is well designed
// (here the function must take an AppContext parameter and return a string e.g. a HTML content)
type View = (ctx: AppContext) => string;

interface Route {
	path: string;
	view: View;
}

export class Router {

	private routes: Route[] = [];
	private app: HTMLElement; // HTML element where the page is rendered
	private ctx: AppContext; // Context with stores (user, friend, games, etc)

	constructor(appSelector: string, ctx: AppContext) {
		// Find the container element where pages will be rendered
		const elem = document.querySelector(appSelector);
		if (!elem) {
			throw new Error(`Router app not found: ${appSelector}`);
		}
		this.app = elem as HTMLElement;
		this.ctx = ctx;

		// Bind methods to preserve 'this' context when used as event listeners
		this.handleLinkClicks = this.handleLinkClicks.bind(this);
		this.onPopState = this.onPopState.bind(this);
	}

	// Add a new route the the route collection
	public add(path: string, view: View) {
		this.routes.push({ path, view });
		return this;
	}

	// Start the router: set up listeners and render initial page
	public start() {
		document.addEventListener("click", this.handleLinkClicks);	// listen for clicks
		window.addEventListener("popstate", this.onPopState);		// listen for bcak/forward on browser
		this.navigateTo(window.location.pathname, false);
	}

	// Route to the correct new path and add the path to history
	public navigateTo(path: string, push = true) {
		const route = this.match(path) ?? this.match("/404");
		if (!route) return;
		
		if (push) history.pushState({}, "", route.path); // update url except for back/forward navigation 
		this.app.innerHTML = route.view(this.ctx); // render the new path view
		
		// Emit a custom event so other code can react to page changes
		// document.dispatchEvent(new CustomEvent("route:render", { detail: { path: route.path } }));
	}

	// Handle browser back/forward buttons
	private onPopState() {
		this.navigateTo(window.location.pathname, true);
	}

	// Intercept clicks on <a data-link> elements for SPA navigation
	private handleLinkClicks(e: MouseEvent) {
		const target = e.target as HTMLElement | null;
		if (!target) return;
		
		if (target.matches('[data-link]')) {
			e.preventDefault();
			const href = target.getAttribute('href');
			if (href)
				this.navigateTo(href);
		}
	}

	// Find a route that matches the given path
	private match(path: string): Route | undefined {
		return this.routes.find(r => r.path === path);
	}
}

