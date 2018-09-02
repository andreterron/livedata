import { ILiveModel, PipeFunction, LiveSnap } from "./base";
import { Observable, Subscriber, TeardownLogic, PartialObserver, SubscriptionLike, BehaviorSubject, Subject, isObservable, of } from "rxjs";
import { filter } from "rxjs/operators";

// import { RefreshMethods } from './refresh-methods.interface';
// import { Subscribable } from "rxjs/Observable";
// import { Observable } from "rxjs/Observable";
// import { AnonymousSubscription, TeardownLogic } from "rxjs/Subscription";
// import { Subscriber } from 'rxjs/Subscriber';
// import { PartialObserver } from 'rxjs/Observer';


export class LiveModel<T> implements ILiveModel<T> {
    // Should cache and subscribers control be implemented here?
    public observable: Observable<T> // const
    public snap: Observable<LiveSnap<T>>
    protected subject: BehaviorSubject<T> = new BehaviorSubject<T>(undefined);

    // public ref: any


    // private data: T = null;
    // private loading: boolean = false;

    // protected subscribers: Subscriber<LiveSnap<T>>[] = [];

    // private isCached: boolean = false;
    // private teardownOnce: TeardownLogic = null;
    // private refreshPromise: Promise<any> = null;

    static of<T>(input: T | Observable<T> | ILiveModel<T>): LiveModel<T> {
        if (isObservable(input)) {
            return new LiveModel<T>(input);
        }
        if (LiveModel.isLiveModel<T>(input)) {
            return input;
        }
        return new LiveModel<T>(of(input as T));
    }

    static isLiveModel<T>(obj): obj is LiveModel<T> {
        return !!obj.observable
    }

    constructor(observable: Observable<T> = null) {
        observable.subscribe(next => this.subject.next(next), err => this.subject.error(err));
        this.observable = this.subject.asObservable().pipe(filter(n => n !== undefined));
    }

    // constructor(private methods: RefreshMethods<LiveSnap<T>> = {}) { //, subscribe?: (subscriber: Subscriber<T>) => TeardownLogic) {

    //     this.observable = new Observable<LiveSnap<T>>((subscriber: Subscriber<LiveSnap<T>>): TeardownLogic => {
    //         var needsSubscribeOnce = (this.subscribers.length === 0);

    //         this.subscribers.push(subscriber);

    //         subscriber.add(() => {
    //             // Removes the subscriber from the subscribers list if it unsubscribes
    //             let i = this.subscribers.indexOf(subscriber);
    //             if (i >= 0) {
    //                 this.subscribers.splice(i, 1);
    //             }
    //             if (this.subscribers.length === 0 && this.teardownOnce) {
    //                 if (typeof this.teardownOnce === 'function') {
    //                     this.teardownOnce();
    //                 } else {
    //                     this.teardownOnce.unsubscribe();
    //                 }
    //             }
    //         });

    //         if (this.isCached) {
    //             subscriber.next({ref: this.ref, value: this.data});
    //         }
    //         if (needsSubscribeOnce) {
    //             if (methods.subscribeOnce) {
    //                 this.teardownOnce = methods.subscribeOnce(new Subscriber<LiveSnap<T>>((next) => this.subject.next(next), (err) => this.subject.error(err), () => this.subject.complete()));
    //             } else if (methods.observable) {
    //                 if (typeof methods.observable === 'function') {
    //                     this.teardownOnce = methods.observable().subscribe((next) => this.subject.next(next), (err) => this.subject.error(err), () => this.subject.complete());
    //                 } else {
    //                     console.log("SUBSCRIBED TO OBSERVABLE");
    //                     this.teardownOnce = methods.observable.subscribe((next) => {console.log('got val', next); this.subject.next(next)}, (err) => this.subject.error(err));
    //                 }
    //             }
    //             this.subject.subscribe()
    //         }
    //         if (methods.subscribe) {
    //             return methods.subscribe(new Subscriber((next: LiveSnap<T>) => {
    //                 this.data = next.value;
    //                 this.ref = next.ref;
    //                 this.isCached = true;
    //                 subscriber.next(next);
    //             }, (err) => subscriber.error(err), () => subscriber.complete()));
    //         } else {
    //             // Remove refesh from here
    //             this.refresh();
    //         }
    //     });
    //     // this.observable = this.behavior.asObservable();
    // }

    // constructor(observable: Observable<LiveSnap<T>>) {
    //     this.observable = new Observable<LiveSnap<T>>((subscriber: Subscriber<LiveSnap<T>>) => {
    //         var needsSubscribeOnce = (this.subscribers.length === 0);
    //         this.subscribers.push(subscriber);
    //     });
    // }

    // protected resetCache() {
    //     this.data = undefined;
    //     this.ref = undefined;
    //     this.isCached = false;
    // }
    
    // protected alert(next: T): T {
    //     this.data = next;
    //     this.isCached = true;
    //     this.loading = false;
    //     this.subscribers.forEach((sub) => {
    //         sub.next(next);
    //     });
    //     return next;
    // }

    // protected alertError(err) {
    //     this.subscribers.forEach((sub) => {
    //         sub.error(err);
    //     });
    //     throw err;
    // }
    
    // protected alertComplete() {
    //     this.subscribers.forEach((sub) => {
    //         sub.complete();
    //     });
    // }

    // constructor(private methods: RefreshMethods<T> = {}) {
    //     this.live = Observable.from(this.lmo);
    // }
    // once(): Promise<LiveSnap<T>> {
    //     return this.observable.pipe(first()).toPromise();
    // }

    // refresh(): Promise<T> {
    //     if (this.methods && this.methods.refresh) {
    //         var promise = this.refreshPromise;
    //         if (!promise) {
    //             this.loading = true;
    //             promise = this.methods.refresh()
    //                 .then(n => this.subject.next(n), e => this.subject.error(e));
    //             this.refreshPromise = promise;
    //             promise.then(() => {
    //                 this.refreshPromise = null;
    //             });
    //         }
    //         return promise;
    //     }
    //     return Promise.resolve(this.data);
    //     // return this.lmo.refresh();
    // }

    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): SubscriptionLike {
        if (typeof observerOrNext === 'function') {
            return this.observable.subscribe(observerOrNext, error, complete);
        } else {
            return this.observable.subscribe(observerOrNext);
        }
    }

    pipe<R>(...args: PipeFunction<any, any>[]): ILiveModel<R> {
        let res: ILiveModel<any> = this;
        for (let pipeFn of args) {
            res = pipeFn(res);
        }
        return res as ILiveModel<R>;
    }
}
