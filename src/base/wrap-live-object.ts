import { LiveDataObservable } from "./live-data-observable";
import { ILiveList, ILiveObject } from "../interfaces";
import { WrapObservable } from "./wrap-observable";
import { Subscription, TeardownLogic, AnonymousSubscription } from "rxjs/Subscription";
import { Subscriber } from "rxjs/Subscriber";
import { Observable } from "rxjs/Observable";
import { WrapLiveList } from "./wrap-live-list";


export class WrapLiveObject<T> extends WrapObservable<T, T, ILiveObject<T>> implements ILiveObject<T> {

    subscribeToChild(): TeardownLogic[] {
        return [this.child.subscribe((n) => this.alert(n), (err) => this.alertError(err))];
    }

    refresh(): Promise<T> {
        if (this.child) {
            return this.child.refresh();
        }
        return this.waitForChild().then(() => this.child.refresh());
    }
    save(obj?: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.save(obj, options);
        }
        return this.waitForChild().then(() => this.child.save(obj, options));
    }
    delete(options?: any): Promise<any> {
        if (this.child) {
            return this.child.delete(options);
        }
        return this.waitForChild().then(() => this.child.delete(options));
    }
    toMany<R>(relationName: string, options?: any): ILiveList<R> {
        return new WrapLiveList<R>((setList, subscriber: Subscriber<any>): TeardownLogic => {
            return this.childObservable.subscribe(() => {
                if (this.child) {
                    setList(this.child.toMany(relationName, options));
                } else {
                    console.error('no child after child observable');
                    subscriber.next([]);
                }
            }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        })
    }
    toOne<R>(relationName: string, options?: any): ILiveObject<R> {
        return new WrapLiveObject<R>((setObj, subscriber) => {
            return this.childObservable.subscribe(() => {
                if (this.child) {
                    setObj(this.child.toOne(relationName, options));
                } else {
                    console.error('no child after child observable');
                    subscriber.next(null);
                }
            }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        });
    }
    
    createIfNone(create: () => Promise<T>): ILiveObject<T> {
        var createPromise: Promise<T>;
        return new WrapLiveObject<T>((setObj, subscriber) => {
            return this.first().subscribe((n) => {
                if (!n) {
                    if (!createPromise) {
                        createPromise = create();
                    }
                    createPromise.then((obj) => {
                        this.lastData = obj;
                        // subscriber.next(obj);
                        setObj(this, (wrap, sub): TeardownLogic => {
                            // sub.next()
                            this.subscribe(n => wrap.alert(n || obj), e => wrap.alertError(e));
                        });
                        // console.log('NEXT', obj);
                        // console.log('WRAP - SET OBJ', obj);
                        // setObj(this);
                        // console.log('WRAP - NEXT', obj);
                        // subscriber.next(obj);
                        // subscriber.next(obj);
                        // setObj(this);
                    }, (e) => {subscriber.error(e)});
                } else {
                    console.log('WRAP - HAVE OBJ', n);
                    subscriber.next(n);
                    setObj(this);
                    // subscriber.next(n);
                    // setObj(this);
                }
                // if (!createPromise) {
                //     if (!n) {
                //         createPromise = create();
                //         createPromise.then((obj) => {
                //             subscriber.next(obj);
                //             setObj(this);
                //         }, (e) => {subscriber.error(e)});
                //     } else {
                //         subscriber.next(n);
                //         setObj(this);
                //     }
                // }
            }, (e) => {subscriber.error(e)}); // No complete, because we are using the first() method
        });
    }

}