# Auth Guard & Session Hydration (Quick Notes)

- **Guarded navigation**: `router.useGuard` blocks protected routes unless the store says `isLoggedIn` or the session is hydrated successfully. Public routes (`/`, `/login`, `/register`, `/404`) stay open, but if a session exists we redirect them to `/profile`.
- **Single hydration call**: On first guard run without a known session, we call `/api/users/me` via `userService.getUserState`. Flags `hasHydratedSession`/`hydratingSession` ensure we try only once per load to avoid loops.
- **Store ownership**: Successful `/me` sets `isLoggedIn` and user details in `userStore`. Failure keeps the user unauthenticated.
- **Unauthorized handling**: Axios interceptor listens for `401` and treats it as session expiry. It:
  - clears `userId` in `localStorage`
  - broadcasts `session-cleared` (for other tabs)
  - emits `session:unauthorized` (local tab)
  - redirects to `/`
- **Cross-tab sync**: `storage` listener in `main.ts` responds to `session-cleared` by clearing the user store and navigating to `/`. Logout writes the same flag so all tabs sign out together.
