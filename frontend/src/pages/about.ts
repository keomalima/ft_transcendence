import type { AppStores } from "../store/store.js";

export function About(ctx: AppStores): string {
    const user = ctx.user.get()    
    return `
        <a data-link href="/">Accueil</a>
        <a data-link href="/about">À propos</a>
        <h1>À propos</h1>
        <p>Une mini SPA sans bundler, avec TypeScript + history API.</p>
        <ul>
            <li>Router: liens avec data-link</li>
            <li>Navigation: history.pushState</li>
            <li>Rendu: innerHTML sur un outlet</li>
            <li>
            ${ctx.user.get()}
            </lI>
        </ul>
    `;
}
