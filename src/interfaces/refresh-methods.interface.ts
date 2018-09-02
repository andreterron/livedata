import { Subscriber, Subscribable, TeardownLogic } from "rxjs";

export interface RefreshMethods<T> {
    refresh?: (subscriber?: Subscriber<T>) => Promise<any>,
    subscribe?: (subscriber: Subscriber<T>) => TeardownLogic,
    subscribeOnce?: (subscriber: Subscriber<T>) => TeardownLogic,
    observable?: Subscribable<T> | (() => Subscribable<T>),
    value?: T
}