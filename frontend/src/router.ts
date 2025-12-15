import { AppContext } from "./types";
import { cleanWaitingRoomWS } from "./pages/GameRoom.js";
import { cleanGameWS } from "./pages/Game.js";

// Define a new function type to make sure that the function sent to route is well designed
// (here the function must take an AppContext parameter and return a string e.g. a HTML content)
type View = (ctx: AppContext, params?: Record<string, string>) => string;

type Guard = (path: string, ctx: AppContext) => Promise<boolean> | boolean;
interface Route {
	path: string;
	view: View;
}

export class Router {

	private routes: Route[] = [];
	private app: HTMLElement; // HTML element where the page is rendered
	private ctx: AppContext; // Context with stores (user, friend, games, etc)
	private guard?: Guard;

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

	public useGuard(guard: Guard) {
		this.guard = guard;
		return this;
	}

	// Route to the correct new path and add the path to history
	public async navigateTo(path: string, push = true) {
		const currentPath = window.location.pathname;
		if (currentPath.startsWith('/game-room')) {
			cleanWaitingRoomWS();
		}
		if (currentPath.startsWith('/game')) {
			cleanGameWS();
		}
		const route = this.match(path) ?? this.match("/404");
		if (!route) return;

		if (this.guard) {
			const ok = await this.guard(path, this.ctx);
			if (!ok) return;
		}

		if (push) history.pushState({}, "", path); // update url except for back/forward navigation
		this.app.innerHTML = route.view(this.ctx, route.params); // render the new path view

		// Emit a custom event so other code can react to page changes
		// document.dispatchEvent(new CustomEvent("route:render", { detail: { path: route.path } }));
	}

	// Handle browser back/forward buttons
	private onPopState() {
		this.navigateTo(window.location.pathname, false);
	}

	// Intercept clicks on <a data-link> elements for SPA navigation
	private handleLinkClicks(e: MouseEvent) {
		const target = e.target as HTMLElement | null;
		if (!target) return;

		// Use closest() to handle clicks on nested elements (e.g., <p> inside <a>)
		const link = target.closest('[data-link]') as HTMLElement | null;
		if (link) {
			e.preventDefault();
			const href = link.getAttribute('href');
			if (href)
				this.navigateTo(href);
		}
	}

	private match(search: string): (Route & { params?: Record<string, string> }) | undefined {

		// 1. Try exact match first
		const perfectMatch = this.routes.find((r) => r.path === search);
		if (perfectMatch)
			return perfectMatch;

		// 2. Remove trailing slash for consistency
		if (search.endsWith('/')) {
			search = search.replace(/\/$/, '');
		}

		// 3. Try to match dynamic routes
		for (const route of this.routes) {
			const splitSearch: string[] = search.split('/').slice(1);
			const splitPath: string[] = route.path.split('/').slice(1);

			if (splitPath.length !== splitSearch.length)
				continue; // Different number of segments, can't match

			let params: Record<string, string> = {};
			let matched = true;

			for (let i = 0; i < splitPath.length; i++) {
				const routeSegment = splitPath[i];
				const searchSegment = splitSearch[i];
				if (routeSegment.startsWith(':')) {
					// Dynamic segment: store in params
					const paramName = routeSegment.slice(1);
					params[paramName] = searchSegment;
				} else if (routeSegment !== searchSegment) {
					// Segment does not match
					matched = false;
					break;
				}
			}

			if (matched) {
				// Return the route and the extracted params
				return { ...route, params };
			}
		}

		// 4. No match found
		return undefined;
	}
}

