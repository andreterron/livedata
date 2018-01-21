import { Subscriber } from "rxjs/Subscriber";
import { TeardownLogic } from "rxjs/Subscription";
import { Subscribable } from "rxjs/Observable";

export interface RefreshMethods<T> {
    refresh?: (subscriber?: Subscriber<T>) => Promise<any>,
    subscribe?: (subscriber: Subscriber<T>) => TeardownLogic,
    subscribeOnce?: (subscriber: Subscriber<T>) => TeardownLogic,
    observable?: Subscribable<T> | (() => Subscribable<T>),
}