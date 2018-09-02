import { RefreshMethods } from './refresh-methods.interface';
import { Subscribable } from "rxjs/Observable";
import { Observable } from "rxjs/Observable";
import { AnonymousSubscription, TeardownLogic } from "rxjs/Subscription";
import { Subscriber } from 'rxjs/Subscriber';
import { PartialObserver } from 'rxjs/Observer';

export class LiveModel<T> implements Subscribable<T> {
    // Should cache and subscribers control be implemented here?
    public live: Observable<T> // const
    public data: T = null;
    public loading: boolean = false;

    protected subscribers: Subscriber<T>[] = [];

    private isCached: boolean = false;
    private teardownOnce: TeardownLogic = null;
    private refreshPromise: Promise<any> = null;

    constructor(private methods: RefreshMethods<T> = {}) { //, subscribe?: (subscriber: Subscriber<T>) => TeardownLogic) {
        this.live = new Observable((subscriber: Subscriber<T>): TeardownLogic => {
            var needsSubscribeOnce = (this.subscribers.length === 0);

            this.subscribers.push(subscriber);

            subscriber.add(() => {
                // Removes the subscriber from the subscribers list if it unsubscribes
                let i = this.subscribers.indexOf(subscriber);
                if (i >= 0) {
                    this.subscribers.splice(i, 1);
                }
                if (this.subscribers.length === 0 && this.teardownOnce) {
                    if (typeof this.teardownOnce === 'function') {
                        this.teardownOnce();
                    } else {
                        this.teardownOnce.unsubscribe();
                    }
                }
            });

            if (this.isCached) {
                subscriber.next(this.data);
            }
            if (needsSubscribeOnce) {
                if (methods.subscribeOnce) {
                    this.teardownOnce = methods.subscribeOnce(new Subscriber((next) => this.alert(next), (err) => this.alertError(err), () => this.alertComplete()));
                } else if (methods.observable) {
                    if (typeof methods.observable === 'function') {
                        this.teardownOnce = methods.observable().subscribe((next) => this.alert(next), (err) => this.alertError(err), () => this.alertComplete());
                    } else {
                        this.teardownOnce = methods.observable.subscribe((next) => this.alert(next), (err) => this.alertError(err), () => this.alertComplete());
                    }
                }
            }
            if (methods.subscribe) {
                return methods.subscribe(new Subscriber((next) => {
                    this.data = next;
                    this.isCached = true;
                    subscriber.next(next);
                }, (err) => subscriber.error(err), () => subscriber.complete()));
            } else {
                this.refresh();
            }
        });
    }

    protected resetCache() {
        this.data = undefined;
        this.isCached = false;
    }
    
    protected alert(next: T): T {
        this.data = next;
        this.isCached = true;
        this.loading = false;
        this.subscribers.forEach((sub) => {
            sub.next(next);
        });
        return next;
    }

    protected alertError(err) {
        this.subscribers.forEach((sub) => {
            sub.error(err);
        });
        throw err;
    }
    
    protected alertComplete() {
        this.subscribers.forEach((sub) => {
            sub.complete();
        });
    }

    once(): Promise<T> {
        return this.live.first().toPromise();
    }
    refresh(): Promise<T> {
        if (this.methods && this.methods.refresh) {
            var promise = this.refreshPromise;
            if (!promise) {
                this.loading = true;
                promise = this.methods.refresh()
                    .then(n => this.alert(n), e => this.alertError(e));
                this.refreshPromise = promise;
                promise.then(() => {
                    this.refreshPromise = null;
                });
            }
            return promise;
        }
        return Promise.resolve(this.data);
        // return this.lmo.refresh();
    }
    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): AnonymousSubscription {
        if (typeof observerOrNext === 'function') {
            return this.live.subscribe(observerOrNext, error, complete);
        } else {
            return this.live.subscribe(observerOrNext);
        }
    }
}
