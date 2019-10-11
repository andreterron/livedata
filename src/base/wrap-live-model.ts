import { TeardownLogic, AnonymousSubscription, Subscription } from "rxjs/Subscription";
import { LiveDataObservable } from "./live-data-observable";
import { LiveObject, LiveList, LiveModel } from "../interfaces";
import { Subscriber } from "rxjs/Subscriber";
import { Observable } from "rxjs/Observable";
import { Promise } from 'bluebird';

// import 'rxjs/add/observable/from';

export abstract class WrapLiveModel<T, S, L extends LiveList<S> | LiveObject<S>> extends LiveModel<T> {
    childReceivedSubscription: AnonymousSubscription;
    public child: L = null;
    protected childPromise = new Promise<void>((resolve, reject) => {
        this.resolveChildPromise = resolve;
    });

    public childSubscriptions: TeardownLogic[] = [];
    public childSubscribers: Subscriber<L>[] = [];
    private resolveChildPromise: (value?: void | PromiseLike<void>) => void;

    constructor(subscribe: (setChild: (list: L, subscribe?: (wrap: WrapLiveModel<T, S, L>, subscriber: Subscriber<T>) => TeardownLogic) => L, subscriber: Subscriber<T>) => TeardownLogic, public depth: number = 0) {
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
        if (this.child) {
            subscriber.next(this.child);
        } else if (!this.childReceivedSubscription) {
            this.childReceivedSubscription = this.subscribe();
        }
        return subscriber;
    });

    private setChild(child: L, subscribe?: (wrap: WrapLiveModel<T, S, L>, subscriber: Subscriber<T>) => TeardownLogic) {
        if (child instanceof WrapLiveModel) {
            var d = this.depth + 1
            var c = child
            while (c) {
                c.depth = d
                c = c.child
                d += 1
            }
        }
        // console.log('WRAP SET CHILD', this.depth);
        this.resetCache();
        this.childSubscriptions.forEach(s => {
            if (s) {
                if (typeof s === 'function') {
                    s()
                } else {
                    s.unsubscribe();
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
        // if (this.childPromise) {
        //     return this.childPromise
        // }
        // return this.refresh();
        if (!this.subscribers.length && !this.childReceivedSubscription) {
            this.childReceivedSubscription = this.live.first().subscribe();
        }
        return this.childPromise;
    }

    abstract subscribeToChild(): TeardownLogic[];
}