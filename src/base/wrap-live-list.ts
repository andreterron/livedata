import { LiveDataObservable } from "./live-data-observable";
import { ILiveList, ILiveObject } from "../interfaces";
import { Subscription, TeardownLogic, AnonymousSubscription } from "rxjs/Subscription";
import { Subscriber } from "rxjs/Subscriber";
import { Observable } from "rxjs/Observable";
import { WrapLiveObject } from "./wrap-live-object";
import { WrapObservable } from "./wrap-observable";


export class WrapLiveList<T> extends WrapObservable<T[], T, ILiveList<T>> implements ILiveList<T> {

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
    mapToOne<R>(relationName: string, options?: any): ILiveList<R> {
        return new WrapLiveList<R>((setList, subscriber) => {
            return this.childObservable.subscribe(() => {
                if (this.child) {
                    setList(this.child.mapToOne(relationName, options));
                } else {
                    console.error('no child after child observable');
                    subscriber.next([]);
                }
            });
        });
    }
    index(index: number): ILiveObject<T> {
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

    toId(id: string, options?: any): ILiveObject<T> {
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