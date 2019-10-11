import { Subscription, TeardownLogic } from 'rxjs/Subscription';
import { LiveObject, LiveList, LiveModel, RelationInput } from './../interfaces';
import { Subscriber } from 'rxjs/Subscriber';
import { BaseDataManager } from "./base-data-manager";
import { LiveDataObservable } from './live-data-observable';
import { Observable, Subscribable } from 'rxjs/Observable';
import { WrapLiveObject, WrapLiveList } from './wrap-live-object';
import { RefreshMethods } from '../interfaces/refresh-methods.interface';

export class BaseLiveObject<T> extends LiveModel<T> implements LiveObject<T> {

    constructor(
            protected dataManager: BaseDataManager,
            public type: string,
            methods: RefreshMethods<T>,
            public id?: string,
            public options?: any) {
        super(methods);
    }
    
    createIfNone(create: () => Promise<T>): LiveObject<T> {
        var createPromise: Promise<T>;
        return new WrapLiveObject<T>((setObj, subscriber) => {
            return this.live.first().subscribe((n) => {
                if (!n) {
                    if (!createPromise) {
                        createPromise = create();
                    }
                    createPromise.then((obj) => {
                        this.data = obj;
                        setObj(this)
                    }, (e) => {subscriber.error(e)});
                } else {
                    subscriber.next(n);
                    setObj(this);
                }
            }, (e) => {subscriber.error(e)});
        });
    }
    
    thenRefresh<R>(r: R): R {
        this.refresh();
        return r;
    }

    errorRefresh(err) {
        this.refresh();
        throw err;
    }
    
    save(obj?: T, options?: any): Promise<any> {
        return this.dataManager.save(this.type, obj, options);
    }

    delete(options?: any): Promise<any> {
        if (this.id !== undefined && this.id !== null) {
            return this.dataManager.delete(this.type, {id: this.id}, options);
        }
        return Promise.reject(new Error('Deleting object that doesn\'t have an ID)'));
    }

    toMany<R>(relation: RelationInput, options?: any): LiveList<R> {
        return this.dataManager.objToMany(this.type, this, relation, options);
        // return new WrapLiveList<R>((setList, subscriber): TeardownLogic => {
        //     return this.subscribe((next: T) => {
        //         return setList(next ? this.dataManager.toMany<R>(this.type, next, relationName, options) : null);
        //     }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        // });
    }
    toOne<R>(relation: RelationInput, options?: any): LiveObject<R> {
        return this.dataManager.objToOne(this.type, this, relation, options);
        // return new WrapLiveObject<R>((setObj, subscriber): TeardownLogic => {
        //     return this.subscribe((next: T) => {
        //         setObj(next ? this.dataManager.toOne<R>(this.type, next, relationName, options) : null);
        //     }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        // });
    }
    public static fromObservable<I, R>(observable: Subscribable<I>, map: (v: I) => LiveObject<R>) {
        return new WrapLiveObject<R>((setChild, subscriber) => {
            return observable.subscribe((value) => {
                try {
                    let obj = map(value);
                    if (obj) {
                        setChild(obj);
                    }
                } catch (e) {
                    subscriber.error(e);
                }
            }, (err) => {
                subscriber.error(err);
            }, () => {
                subscriber.complete();
            });
        });
    }
}