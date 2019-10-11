import { LiveList, LiveObject, LiveModel } from "../interfaces";
import { Observable, Subscribable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";
import { TeardownLogic, Subscription } from "rxjs/Subscription";
import { LiveDataObservable } from "./live-data-observable";
import { BaseDataManager } from "./base-data-manager";
import { BaseLiveObject } from './base-live-object';
import { WrapLiveObject, WrapLiveList } from './wrap-live-object';
import { RefreshMethods } from '../interfaces/refresh-methods.interface';

export abstract class BaseLiveList<T> extends LiveModel<T[]> implements LiveList<T> {

    constructor(protected dataManager: BaseDataManager, public type: string, methods?: RefreshMethods<T[]>) {
        super(methods);
    }

    liveObjects: Subscribable<LiveObject<T>[]> = null;

    index(index: number): LiveObject<T> {
        let obj = new BaseLiveObject<T>(this.dataManager, this.type, {subscribeOnce: (subscriber) => {
            return this.subscribe(n => {
                if (n[index]) {
                    obj.id = n[index]['id'];
                    subscriber.next(n[index]);
                } else {
                    subscriber.next(null);
                }
            }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
            // this.refresh();
        }});
        return obj;
    }

    toId(id: string, options?: any): LiveObject<T> {
        return this.dataManager.liveObject(this.type, id, options);
    }
    
    thenRefresh<R>(r: R): R {
        this.refresh();
        return r;
    }

    errorRefresh(err) {
        this.refresh();
        throw err;
    }

    abstract create(data: any, extra?: any, options?: any): Promise<T>
    abstract add(obj: T, extra?: any, options?: any): Promise<any>
    abstract save(obj?: T, options?: any): Promise<any>
    abstract reorder(list: T[], options?: any): Promise<any>
    abstract remove(obj: T, options?: any): Promise<any>
    abstract delete(obj: T, options?: any): Promise<any>

    public static fromObservable<I, R>(observable: Subscribable<I>, map: (v: I) => LiveList<R>) {
        console.log('FROM OBSERVABLE');
        return new WrapLiveList<R>((setChild, subscriber) => {
            return observable.subscribe((value) => {
                try {
                    let list = map(value);
                    if (list) {
                        setChild(list);
                    } else {
                        console.error("FROM OBSERVABLE - NO LIST");
                    }
                } catch (e) {
                    subscriber.error(e);
                }
            }, (err) => {
                console.error("FROM OBSERVABLE", err);
                subscriber.error(err);
            }, () => {
                subscriber.complete();
            });
        });
    }
}
