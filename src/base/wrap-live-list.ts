import { LiveDataObservable } from "./live-data-observable";
import { LiveList, LiveObject } from "../interfaces";
import { Subscription, TeardownLogic, AnonymousSubscription } from "rxjs/Subscription";
import { Subscriber } from "rxjs/Subscriber";
import { Observable } from "rxjs/Observable";
import { WrapLiveObject } from "./wrap-live-object";
import { WrapLiveModel } from "./wrap-live-model";


export class WrapLiveList<T> extends WrapLiveModel<T[], T, LiveList<T>> implements LiveList<T> {

    liveObjects: Observable<LiveObject<T>[]> = this.childObservable.switchMap(() => {
        if (this.child) {
            return this.child.liveObjects;
        } else {
            return Observable.of([]);
        }
    });

    subscribeToChild(): TeardownLogic[] {
        return [this.child.subscribe((n) => this.alert(n), (err) => this.alertError(err))];
    }

    refresh(): Promise<T[]> {
        if (this.child) {
            return this.child.refresh();
        }
        return this.waitForChild().then(() => this.child.refresh());
    }
    
    create(data: any, extra?: any, options?: any): Promise<T> {
        if (this.child) {
            return this.child.create(data, extra, options);
        }
        return this.waitForChild().then(() => this.child.create(data, extra, options));
    }
    add(obj: T, extra?: any, options?: any): Promise<any> {
        if (this.child) {
            return this.child.add(obj, extra, options);
        }
        return this.waitForChild().then(() => this.child.add(obj, extra, options));
    }
    save(obj?: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.save(obj, options);
        }
        return this.waitForChild().then(() => this.child.save(obj, options));
    }
    reorder(list: T[], options?: any): Promise<any> {
        if (this.child) {
            return this.child.reorder(list, options);
        }
        return this.waitForChild().then(() => this.child.reorder(list, options));
    }
    remove(obj: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.remove(obj, options);
        }
        return this.waitForChild().then(() => this.child.remove(obj, options));
    }
    delete(obj: T, options?: any): Promise<any> {
        if (this.child) {
            return this.child.delete(obj, options);
        }
        return this.waitForChild().then(() => this.child.delete(obj, options));
    }
    index(index: number): LiveObject<T> {
        return new WrapLiveObject<T>((setObj, subscriber) => {
            return this.childObservable.subscribe(() => {
                if (this.child) {
                    setObj(this.child.index(index));
                } else {
                    console.error('no child after child observable');
                    subscriber.next(null);
                }
            });
        });
    }
    toId(id: string, options?: any): LiveObject<T> {
        return new WrapLiveObject<T>((setObj, subscriber) => {
            return this.childObservable.subscribe(() => {
                if (this.child) {
                    setObj(this.child.toId(id, options));
                } else {
                    console.error('no child after child observable');
                    subscriber.next(null);
                }
            });
        });
    }
}
