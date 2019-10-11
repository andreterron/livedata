import { LiveDataObservable } from './../base/live-data-observable';
import { RefreshMethods } from './refresh-methods.interface';
import { Subscribable } from "rxjs/Observable";
import { Observable } from "rxjs/Observable";
import { AnonymousSubscription, TeardownLogic, Subscription } from "rxjs/Subscription";
import { Subscriber } from 'rxjs/Subscriber';
import { PartialObserver } from 'rxjs/Observer';

export class LiveModel<T> implements Subscribable<T> {

    public static logErrors: boolean = true;
    public static defaultErrorHandler: (e) => void = (e) => console.error(e);

    // Should cache and subscribers control be implemented here?
    public live: Observable<T> // const
    public data: T = null;
    public loading: boolean = false;

    protected subscribers: Subscriber<T>[] = [];
    protected isCached: boolean = false;

    private teardownOnce: TeardownLogic = null;
    private refreshPromise: Promise<any> = null;
    // private lmo: LiveDataObservable<T>;

    constructor(private methods: RefreshMethods<T> = {}) { //, subscribe?: (subscriber: Subscriber<T>) => TeardownLogic) {
        // super((subscriber) => {
        //     console.log('SUBSCRIBED! WTF???')
        //     // if (this.live) {
        //     //     return this.live.subscribe(n => subscriber.next(n), e => subscriber.error(e), () => subscriber.complete());
        //     // }
        //     // console.error('SUBSCRIBING BEFORE CONSTRUCTOR - WAAAAT?');
        //     // subscriber.error(new Error("Subscribing before constructor is finished"));
        // });
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
            } else if (methods.refresh) {
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
    }

    protected alertErrorAndThrow(err) {
        this.alertError(err);
        throw err;
    }
    
    protected alertComplete() {
        this.subscribers.forEach((sub) => {
            sub.complete();
        });
    }

    // constructor(private methods: RefreshMethods<T> = {}) {
    //     this.lmo = new LiveDataObservable(methods);
    //     this.live = Observable.from(this.lmo);
    // }
    once(): Promise<T> {
        return this.live.first().toPromise();
    }
    refresh(): Promise<T> {
        if (this.methods && this.methods.refresh) {
            var promise = this.refreshPromise;
            if (!promise) {
                this.loading = true;
                promise = this.methods.refresh()
                    .then(n => this.alert(n), e => this.alertErrorAndThrow(e));
                this.refreshPromise = promise;
                promise.then(() => {
                    this.refreshPromise = null;
                });
            }
            return promise;
        }
        if (this.isCached) {
            return Promise.resolve(this.data);
        }
        return this.once();
    }
    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription {
        if (typeof observerOrNext === 'function' || error || complete) {
            if (LiveModel.logErrors) {
                if (!error) {
                    error = LiveModel.defaultErrorHandler;
                } else {
                    let handler = error
                    error = (e) => {
                        try {
                            handler(e);
                        } catch (err) {
                            LiveModel.defaultErrorHandler(err);
                        }
                    }
                }
                if (typeof observerOrNext === 'function') {
                    let unhandled = observerOrNext
                    observerOrNext = (n) => {
                        try {
                            unhandled(n)
                        } catch(e) {
                            LiveModel.defaultErrorHandler(e);
                        }
                    }
                } else {
                    let unhandled = observerOrNext.next
                    observerOrNext.next = (n) => {
                        try {
                            unhandled(n)
                        } catch(e) {
                            LiveModel.defaultErrorHandler(e);
                        }
                    }
                }
            }
            return this.live.subscribe(observerOrNext as ((value: T) => void), error, complete);
        } else if (!observerOrNext) {
            return this.live.subscribe();
        } else {
            if (LiveModel.logErrors) {
                if (!observerOrNext.error) {
                    observerOrNext.error = (e) => console.error(e);
                } else {
                    let handler = observerOrNext.error;
                    observerOrNext.error = (e) => {
                        try {
                            handler(e);
                        } catch(err) {
                            LiveModel.defaultErrorHandler(err);
                        }
                    }
                }
                let unhandled = observerOrNext.next
                observerOrNext.next = (n) => {
                    try {
                        unhandled(n)
                    } catch(e) {
                        LiveModel.defaultErrorHandler(e);
                    }
                }
            }
            return this.live.subscribe(observerOrNext);
        }
    }
}
