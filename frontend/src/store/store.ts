import { UserState } from "../types";

export type Unsubscribe = () => void;

export interface Store<T> {
    get(): T;
    set(value: T): void;
    update(updater: (prev: T) => T): void;
    subscribe(fn: (value: T) => void): Unsubscribe;
}

function createStore<T>(initial: T): Store<T> {
    let state = initial;
    const bus = new EventTarget();

    return {
        get() {
            return state;
        },
        set(value: T) {
            state = value;
            bus.dispatchEvent(new CustomEvent("change", { detail: state }));
        },
        update(updater: (prev: T) => T) {
            state = updater(state);
            bus.dispatchEvent(new CustomEvent("change", { detail: state }));
        },
        subscribe(fn: (value: T) => void): Unsubscribe {
            const handler = (e: Event) => {
                const ce = e as CustomEvent<T>;
                fn(ce.detail);
            };
            bus.addEventListener("change", handler);
            queueMicrotask(() => fn(state));
            return () => bus.removeEventListener("change", handler);
        }
    };
}

export interface AppStores {
    user: Store<UserState | null>;
}


export function createStores(): AppStores {
    const user = createStore<UserState | null>(null);
    return { user };
}
