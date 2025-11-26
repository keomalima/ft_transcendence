import { UserState } from "../types";

export interface UserStore {
	init(value: UserState | null): void;
    get(): UserState | null;
    set(value: UserState | null): void;
    update(updater: (prev: UserState) => UserState | null): void;
    subscribe(fn: () => void): void;
}

export function createUserStore(initial: UserState | null): UserStore {
    let state = initial;
    const listeners: Array<() => void> = [];

    return {
		init(value: UserState | null): void {
			if (!value) {
				this.set({
					id: null,
					email: null,
					name: null,
					surname: null,
					displayName: null,
					isLoggedIn: false,
					accessToken: null,
					isOnline: false,
					createdAt: null,
					updatedAt: null,
					avatarFile: null,
					avatarUrl: null
				});
			} else {
				this.set(value);
			}
		},
        get() {
            return state;
        },
        set(value: UserState | null) {
            state = value;
            listeners.forEach(fn => fn());
        },
        update(updater: (prev: UserState) => UserState | null) {
            // Safety: if state is null, provide a default empty UserState
            if (state === null) {
                state = {
                    id: null,
                    email: null,
                    name: null,
                    surname: null,
                    displayName: null,
                    isLoggedIn: false,
                    accessToken: null,
                    isOnline: false,
                    createdAt: null,
                    updatedAt: null,
                    avatarFile: null,
                    avatarUrl: null
                };
            }
            state = updater(state);
            listeners.forEach(fn => fn());
        },
        subscribe(fn: () => void) {
            listeners.push(fn);
        }
    };
}