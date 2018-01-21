import { Subscription, TeardownLogic, AnonymousSubscription } from 'rxjs/Subscription';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscribable } from "rxjs/Observable";
import { ObservableInput } from 'rxjs/Observable';
import { Observable } from 'rxjs/Rx';
import { RefreshMethods } from '../interfaces/refresh-methods.interface';

export class LiveDataObservable<T> extends Observable<T> {

    public subscribers: Subscriber<T>[] = [];
    public lastData: T = undefined;
    public isCached: boolean = false;

    private teardownOnce: TeardownLogic = null;
    private refreshPromise: Promise<any> = null;

    private notConsistent = false;

    constructor(private methods: RefreshMethods<T> = {}) { //, subscribe?: (subscriber: Subscriber<T>) => TeardownLogic) {
        super((subscriber: Subscriber<T>): TeardownLogic => {
            var needsSubscribeOnce = false;
            if (this.subscribers.length === 0) {
                needsSubscribeOnce = true;
            }

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
                subscriber.next(this.lastData);
            }
            if (needsSubscribeOnce && methods.subscribeOnce) {
                this.teardownOnce = methods.subscribeOnce(new Subscriber((next) => this.alert(next), (err) => this.alertError(err), () => this.alertComplete()));
            }
            if (!needsSubscribeOnce && methods.subscribeOnce && !this.isCached) {
                this.notConsistent = true;
            }
            if (methods.subscribe) {
                return methods.subscribe(new Subscriber((next) => {
                    this.lastData = next;
                    this.isCached = true;
                    subscriber.next(next);
                }, (err) => subscriber.error(err), () => subscriber.complete()));
            } else {
                this.refresh();
            }
        });
    }

    resetCache() {
        this.lastData = undefined;
        this.isCached = false;
    }

    refresh(): Promise<T> {
        if (this.methods && this.methods.refresh) {
            var promise = this.refreshPromise;
            if (!promise) {
                promise = this.methods.refresh()
                    .then(this.alert.bind(this), this.alertError.bind(this));
                this.refreshPromise = promise;
                promise.then(() => {
                    this.refreshPromise = null;
                });
            }
            return promise;
        }
        return Promise.resolve(this.lastData);
    }
    
    once(): Promise<T> {
        return this.first().toPromise();
    }
    
    alert(next: T): T {
        this.lastData = next;
        this.isCached = true;
        this.subscribers.forEach((sub) => {
            sub.next(next);
        });
        return next;
    }

    alertError(err) {
        this.subscribers.forEach((sub) => {
            sub.error(err);
        });
        throw err;
    }
    
    alertComplete() {
        this.subscribers.forEach((sub) => {
            sub.complete();
        });
    }

    static subscribeOnce<R>(observable: Subscribable<R>): LiveDataObservable<R> {
        return new LiveDataObservable<R>({subscribeOnce: (subscriber) => {
            observable.subscribe(n => subscriber.next(n), e => subscriber.error(e), () => subscriber.complete());
        }});
    }

}
