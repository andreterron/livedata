// import { TeardownLogic, Subscriber, Observable, SubscriptionLike } from "rxjs";
// import { LiveModel } from "../v2/live-model";
// import { LiveSnap } from "../v2/base";
// import { first } from "rxjs/operators";

// export class WrapLiveModel<T> extends LiveModel<T> {
//     childReceivedSubscription: SubscriptionLike;
//     public child: LiveModel<T> = null;
//     protected childPromise = new Promise<void>((resolve, reject) => {
//         this.resolveChildPromise = resolve;
//     });

//     public childSubscriptions: TeardownLogic[] = [];
//     public childSubscribers: Subscriber<LiveModel<T>>[] = [];
//     private resolveChildPromise: (value?: void | PromiseLike<void>) => void;

//     constructor(subscribe: (setChild: (live: LiveModel<T>, subscribe?: (wrap: WrapLiveModel<T>, subscriber: Subscriber<LiveSnap<T>>) => TeardownLogic) => LiveModel<T>, subscriber: Subscriber<LiveSnap<T>>) => TeardownLogic) {
//         super(new Observable((subscriber) => {
//             return subscribe(this.setChild.bind(this), subscriber);
//         }));
//     }

//     public childObservable: Observable<LiveModel<T>> = new Observable<LiveModel<T>>((subscriber: Subscriber<LiveModel<T>>) => {
//         this.childSubscribers.push(subscriber);
//         subscriber.add(() => {
//             // remove subscriber from list if it's done
//             if (this.childSubscribers.indexOf(subscriber) !== -1) {
//                 this.childSubscribers.splice(this.childSubscribers.indexOf(subscriber), 1);
//             }
//             // if (this.childSubscribers.length === 0 && this.childReceivedSubscription) {
//             //     this.childReceivedSubscription.unsubscribe();
//             //     this.childReceivedSubscription = null;
//             // }
//         });
//         // this.refresh();
//         if (this.child) {
//             subscriber.next(this.child);
//         } else if (!this.childReceivedSubscription) {
//             this.childReceivedSubscription = this.subscribe();
//         }
//         return subscriber;
//     });

//     private setChild(child: LiveModel<T>, subscribe?: (wrap: WrapLiveModel<T>, subscriber: Subscriber<LiveSnap<T>>) => TeardownLogic) {
//         // this.resetCache(); // TODO: review this
//         this.childSubscriptions.forEach(s => {
//             if (s) {
//                 if (typeof s === 'function') {
//                     s()
//                 } else {
//                     s.unsubscribe();
//                 }
//             }
//         }); // Teardown previous subscriptions
//         this.child = child;
//         this.childSubscribers.forEach(s => s.next(this.child));
//         if (this.child) {
//             if (subscribe) {
//                 this.childSubscriptions = this.subscribers.map((sub) => subscribe(this, sub));
//             } else {
//                 this.childSubscriptions = this.subscribeToChild(); //this.subscribers.map(s => this.child.subscribe(n => s.next(n), (e) => {s.error(e)}))
//             }
//             if (this.resolveChildPromise) {
//                 this.resolveChildPromise();
//             }
//         } else {
//             this.childSubscriptions = [];
//         }
//         return this.child;
//     }

//     waitForChild(): Promise<any> {
//         if (!this.subscribers.length && !this.childReceivedSubscription) {
//             this.childReceivedSubscription = this.observable.pipe(first()).subscribe();
//         }
//         return this.childPromise;
//     }

//     subscribeToChild(): TeardownLogic[] {
//         return [this.child.subscribe((n) => this.subject.next(n), (err) => this.subject.error(err))];
//     }
// }