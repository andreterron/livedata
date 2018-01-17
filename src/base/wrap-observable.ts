import { TeardownLogic, AnonymousSubscription, Subscription } from "rxjs/Subscription";
import { LiveDataObservable } from "./live-data-observable";
import { ILiveObject, ILiveList } from "../interfaces";
import { Subscriber } from "rxjs/Subscriber";
import { Observable } from "rxjs/Observable";
import { Promise } from 'bluebird';

export abstract class WrapObservable<T, S, L extends ILiveList<S> | ILiveObject<S>> extends LiveDataObservable<T> {
    childReceivedSubscription: Subscription;
    public child: L = null;
    protected childPromise = new Promise((resolve, reject) => {
        this.resolveChildPromise = resolve;
    });

    public childSubscriptions: TeardownLogic[] = [];
    public childSubscribers: Subscriber<L>[] = [];
    private resolveChildPromise: (value?: {} | PromiseLike<{}>) => void;

    constructor(subscribe: (setChild: (list: L, subscribe?: (wrap: WrapObservable<T, S, L>, subscriber: Subscriber<T>) => TeardownLogic) => L, subscriber: Subscriber<T>) => TeardownLogic) {
        super({subscribeOnce: (subscriber) => {
            return subscribe(this.setChild.bind(this), subscriber);
        }});
    }

    public childObservable: Observable<L> = new Observable<L>((subscriber: Subscriber<L>) => {
        this.childSubscribers.push(subscriber);
        subscriber.add(() => {
            // remove subscriber from list if it's done
            if (this.childSubscribers.indexOf(subscriber) !== -1) {
                this.childSubscribers.splice(this.childSubscribers.indexOf(subscriber), 1);
            }
            // if (this.childSubscribers.length === 0 && this.childReceivedSubscription) {
            //     this.childReceivedSubscription.unsubscribe();
            //     this.childReceivedSubscription = null;
            // }
        });
        // this.refresh();
        // console.log('WRAP - child sub');
        if (this.child) {
            subscriber.next(this.child);
        } else if (!this.childReceivedSubscription) {
            this.childReceivedSubscription = this.subscribe();
        }
        return subscriber;
    });

    private setChild(child: L, subscribe?: (wrap: WrapObservable<T, S, L>, subscriber: Subscriber<T>) => TeardownLogic) {
        this.resetCache();
        this.childSubscriptions.forEach(s => {
            if (s) {
                if ((s as AnonymousSubscription).unsubscribe) {
                    (s as AnonymousSubscription).unsubscribe();
                } else {
                    (s as Function)();
                }
            }
        }); // Teardown previous subscriptions
        this.child = child;
        this.childSubscribers.forEach(s => s.next(this.child));
        if (this.child) {
            if (subscribe) {
                this.childSubscriptions = this.subscribers.map((sub) => subscribe(this, sub));
            } else {
                this.childSubscriptions = this.subscribeToChild(); //this.subscribers.map(s => this.child.subscribe(n => s.next(n), (e) => {s.error(e)}))
            }
            if (this.resolveChildPromise) {
                this.resolveChildPromise();
            }
        } else {
            this.childSubscriptions = [];
        }
        return this.child;
    }

    waitForChild(): Promise<any> {
        if (!this.subscribers.length && !this.childReceivedSubscription) {
            this.childReceivedSubscription = this.first().subscribe();
        }
        return this.childPromise;
    }

    abstract subscribeToChild(): TeardownLogic[];
}