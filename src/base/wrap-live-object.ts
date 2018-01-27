import { LiveDataObservable } from "./live-data-observable";
import { LiveList, LiveObject } from "../interfaces";
import { WrapLiveModel } from "./wrap-live-model";
import { Subscription, TeardownLogic, AnonymousSubscription } from "rxjs/Subscription";
import { Subscriber } from "rxjs/Subscriber";
import { Observable } from "rxjs/Observable";
import { WrapLiveList } from "./wrap-live-list";


export class WrapLiveObject<T> extends WrapLiveModel<T, T, LiveObject<T>> implements LiveObject<T> {

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
    toMany<R>(relationName: string, options?: any): LiveList<R> {
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
    toOne<R>(relationName: string, options?: any): LiveObject<R> {
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

    createIfNone(create: () => Promise<T>): LiveObject<T> {
        return new WrapLiveObject<T>((setChild, subscriber) => {
            return this.childObservable.subscribe(() => {
                if (this.child) {
                    setChild(this.child.createIfNone(create));
                }
            }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        });
    }

}
