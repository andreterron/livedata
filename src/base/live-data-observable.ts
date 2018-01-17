import { Subscription, TeardownLogic, AnonymousSubscription } from 'rxjs/Subscription';
import { ILiveObject, ILiveList } from './../interfaces';
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

    // switchMap<T, R>(this: Observable<T>, project: (value: T, index: number) => ObservableInput<R>): Observable<R>
    // liveSwitchMap<I>(project: (value: T, index: number) => ObservableInput<I>): LiveDataObservable<I> {
    //     return new LiveDataObservable<I>((subscriber): TeardownLogic => {
    //         var i = 0;
    //         var lastSub = null;
    //         subscriber.add(() => {
    //             if (lastSub) {
    //                 lastSub.unsubscribe();
    //             }
    //         });
    //         return this.subscribe((next: T) => {
    //             if (lastSub) {
    //                 lastSub.unsubscribe();
    //             }
    //             let observableInput = project(next, i++);
    //             if (observableInput['subscribe']) {
    //                 lastSub = (observableInput as Subscribable<I>).subscribe(subscriber)
    //             } else {
    //                 lastSub = null;
    //                 (observableInput as PromiseLike<I>).then(value => {
    //                     subscriber.next(value);
    //                     subscriber.complete();
    //                 }, (e) => {subscriber.error(e)});
    //             }
    //         }, (e) => {subscriber.error(e)});
    //     });
    // }

    // switchLiveList<I>(project: (value: T, index: number) => ILiveList<I>): ILiveList<I> {
    //     return new WrapLiveList<I>((setList, subscriber): TeardownLogic => {
    //         var i = 0;
    //         // var lastSub = null;
    //         // subscriber.add(() => {
    //         //     if (lastSub) {
    //         //         lastSub.unsubscribe();
    //         //     }
    //         // });
    //         return this.subscribe((next: T) => setList(project(next, i++)), (e) => {subscriber.error(e)}, () => {subscriber.complete()});
    //     });
    // }
    
    // switchLiveObject<I>(project: (value: T, index: number) => ILiveObject<I>): ILiveObject<I> {
    //     return new WrapLiveObject<I>((setObj, subscriber): TeardownLogic => {
    //         var i = 0;
    //         // var lastSub = null;
    //         // subscriber.add(() => {
    //         //     if (lastSub) {
    //         //         lastSub.unsubscribe();
    //         //     }
    //         // });
    //         return this.subscribe((next: T) => setObj(project(next, i)), (e) => {subscriber.error(e)}, () => {subscriber.complete()});
    //     });
    // }

    static subscribeOnce<R>(observable: Subscribable<R>): LiveDataObservable<R> {
        return new LiveDataObservable<R>({subscribeOnce: (subscriber) => {
            observable.subscribe(n => subscriber.next(n), e => subscriber.error(e), () => subscriber.complete());
        }});
    }

}

// export class WrapLiveList<T> extends LiveDataObservable<T[]> implements ILiveList<T> {
    
//     private childLiveList: ILiveList<T> = null;
//     private resolveChildPromise: (value?: {} | PromiseLike<{}>) => void;
//     private rejectChildPromise: (reason?: any) => void
//     private childPromise = new Promise((resolve, reject) => {
//         this.resolveChildPromise = resolve;
//         this.rejectChildPromise = reject;
//     });
//     private childReceivedSubscription: Subscription;
//     private childSubscriptions: TeardownLogic[] = [];
//     private childSubscribers: Subscriber<ILiveList<T>>[] = [];
//     // private childObservable: Observable<ILiveObject<T>> = new Observable<ILiveObject<T>>((subscriber: Subscriber<ILiveObject<T>>) => {
//     //     this.childSubscribers.push(subscriber);
//     //     if (this.childLiveObject) {
//     //         subscriber.next(this.childLiveObject);
//     //     }
//     //     subscriber.add(() => {
//     //         // remove subscriber from list if it's done
//     //         if (this.childSubscribers.indexOf(subscriber) !== -1) {
//     //             this.childSubscribers.splice(this.childSubscribers.indexOf(subscriber), 1);
//     //         }
//     //         // if (this.childSubscribers.length === 0 && this.childReceivedSubscription) {
//     //         //     this.childReceivedSubscription.unsubscribe();
//     //         //     this.childReceivedSubscription = null;
//     //         // }
//     //     });
//     //     this.refresh();
//     //     console.log('WRAP - child sub');
//     //     // if (!this.childReceivedSubscription) {
//     //     //     // this.childReceivedSubscription.unsubscribe(); // no
//     //     //     // this.childReceivedSubscription = this.subscribe((next) => {
//     //     //     //     if (this.childLiveObject) {
//     //     //     //         this.childSubscribers.forEach((subscriber) => {
//     //     //     //             subscriber.next(this.childLiveObject);
//     //     //     //         });
//     //     //     //     }
//     //     //     // });
//     //     // }
//     //     return subscriber;
//     // });
//     private childObservable: Observable<ILiveList<T>> = new Observable<ILiveList<T>>((subscriber: Subscriber<ILiveList<T>>) => {
//         this.childSubscribers.push(subscriber);
//         if (this.childLiveList) {
//             subscriber.next(this.childLiveList);
//         }
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
//         if (!this.childReceivedSubscription) {
//             this.childReceivedSubscription = this.subscribe((next) => {
//                 if (this.childLiveList) {
//                     this.childSubscribers.forEach((subscriber) => {
//                         subscriber.next(this.childLiveList);
//                     });
//                 }
//             });
//         }
//         // if (!this.childReceivedSubscription) {
//         //     this.childReceivedSubscription = this.subscribe((next) => {
//         //         if (this.childLiveObject) {
//         //             sub.next(this.childLiveObject);
//         //         }
//         //     }, sub.error, () => {sub.error()});
//         // }
//         return subscriber;
//     });
    
//     once(): Promise<T[]> {
//         var sub: Subscription;
//         let p = new Promise<T[]>((resolve, reject) => {
//             sub = this.subscribe((next: T[]) => {
//                 resolve(next);
//             }, (err) => {
//                 reject(err);
//             }, () => {
//                 resolve([]);
//             });
//         });
//         p.then(sub.unsubscribe, sub.unsubscribe);
//         return p;
//     }

//     constructor(subscribe: (setLiveList: (list: ILiveList<T>) => ILiveList<T>, subscriber: Subscriber<T[]>) => TeardownLogic) {
//         super((subscriber) => {
//             return subscribe(this.setChild.bind(this), subscriber);
//         });
//     }
    
//     private setChild(list: ILiveList<T>) {
//         this.childSubscriptions.forEach(s => {
//             if (s) {
//                 if ((s as AnonymousSubscription).unsubscribe) {
//                     (s as AnonymousSubscription).unsubscribe();
//                 } else {
//                     (s as Function)();
//                 }
//             }
//         }); // Teardown previous subscriptions
//         this.childLiveList = list;
//         this.childSubscribers.forEach(s => s.next(list));
//         if (list) {
//             this.childSubscriptions = this.subscribers.map(s => list.subscribe(n => s.next(n), (e) => {s.error(e)}, () => {s.complete()}))
//             this.resolveChildPromise();
//         } else {
//             this.childSubscriptions = [];
//         }
//     }

//     waitForChild(): Promise<any> {
//         if (!this.subscribers.length && !this.childReceivedSubscription) {
//             this.childReceivedSubscription = this.first().subscribe();
//         }
//         return this.childPromise;
//     }

//     refresh(): Promise<T[]> {
//         if (this.childLiveList) {
//             return this.childLiveList.refresh();
//         }
//         return this.waitForChild().then(() => this.childLiveList.refresh());
//     }
    
//     create(data: any, extra?: any, options?: any): Promise<T> {
//         console.log('WRAP - CREATE')
//         if (this.childLiveList) {
//             return this.childLiveList.create(data, extra, options);
//         }
//         console.log('WRAP - NO CHILD');
//         return this.waitForChild().then(() => {
//             console.log('WRAP - HAS CHILD');
//             return this.childLiveList.create(data, extra, options)
//         });
//     }
//     add(obj: T, extra?: any, options?: any): Promise<any> {
//         if (this.childLiveList) {
//             return this.childLiveList.add(obj, extra, options);
//         }
//         return this.waitForChild().then(() => this.childLiveList.add(obj, extra, options));
//     }
//     save(obj?: T, options?: any): Promise<any> {
//         if (this.childLiveList) {
//             return this.childLiveList.save(obj, options);
//         }
//         return this.waitForChild().then(() => this.childLiveList.save(obj, options));
//     }
//     reorder(list: T[], options?: any): Promise<any> {
//         if (this.childLiveList) {
//             return this.childLiveList.reorder(list, options);
//         }
//         return this.waitForChild().then(() => this.childLiveList.reorder(list, options));
//     }
//     remove(obj: T, options?: any): Promise<any> {
//         if (this.childLiveList) {
//             return this.childLiveList.remove(obj, options);
//         }
//         return this.waitForChild().then(() => this.childLiveList.remove(obj, options));
//     }
//     delete(obj: T, options?: any): Promise<any> {
//         if (this.childLiveList) {
//             return this.childLiveList.delete(obj, options);
//         }
//         return this.waitForChild().then(() => this.childLiveList.delete(obj, options));
//     }
//     mapToOne<R>(relationName: string, options?: any): ILiveList<R> {
//         return new WrapLiveList<R>((setList, subscriber) => {
//             return this.childObservable.subscribe((list) => {
//                 if (list) {
//                     setList(list.mapToOne(relationName, options));
//                 } else {
//                     subscriber.next([]);
//                 }
//             });
//         });
//     }
//     index(index: number): ILiveObject<T> {
//         return new WrapLiveObject<T>((setObj, subscriber) => {
//             return this.childObservable.subscribe((list) => {
//                 if (list) {
//                     setObj(list.index(index));
//                 } else {
//                     subscriber.next(null);
//                 }
//             });
//         });
//     }
// }