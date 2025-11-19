import { AppContext } from "../types";

export function About(ctx: AppContext): string {
    const user = ctx.userStore.get()    
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
            ${ctx.userStore.get()}
            </lI>
        </ul>
    `;
}
