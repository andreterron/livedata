import { } from 'rxjs/Rx';
import { ILiveList, ILiveObject } from "../interfaces";
import { Observable } from "rxjs/Observable";
import { Subscriber } from "rxjs/Subscriber";
import { TeardownLogic, Subscription } from "rxjs/Subscription";
import { LiveDataObservable } from "./live-data-observable";
import { BaseDataManager } from "./base-data-manager";
import { BaseLiveObject } from './base-live-object';
import { WrapLiveObject } from './wrap-live-object';

export class CombinedLiveList<S, T> extends LiveDataObservable<T[]> implements ILiveList<T> {

    private sourceList: S[];
    private sourceMap: {[key:string]: S} = {};
    private sourceDestMap: object = {}; // id to id
    private destSourceMap: object = {}; // id to id
    
    once(): Promise<T[]> {
        return this.first().toPromise();
    }

    constructor(public sourceLiveList: ILiveList<S>, public mapFn: (obj: S) => ILiveObject<T>) {
        super({subscribeOnce: (subscriber) => {
            return this.sourceLiveList.subscribe((srcList) => {
                this.sourceList = srcList;
                let observable = Observable.combineLatest(srcList.map((n) => this.mapFn(n)));
                observable.first((t) => !!t.length).toPromise().then((destList) => {
                    if (srcList.length === destList.length) {
                        for (var i = 0; i < srcList.length; i++) {
                            this.sourceMap[srcList[i]['id']] = srcList[i];
                            this.sourceDestMap[srcList[i]['id']] = destList[i]['id'];
                            this.sourceDestMap[destList[i]['id']] = srcList[i]['id'];
                        }
                    }
                });
                return observable.subscribe(subscriber);
            }, (e) => {subscriber.error(e)}, () => {subscriber.complete()});
        }});
    }

    refresh(): Promise<T[]> {
        return this.sourceLiveList.refresh().then((sources) => Promise.all(sources.map((n) => this.mapFn(n).first((t) => !!t).toPromise())));
    }
    
    create(data: any, extra?: any, options?: any): Promise<T> {
        return Promise.reject(new Error("Cannot create object on CombinedLiveList. This list doesn't have access to the models after the relation."));
    }
    add(obj: T, extra?: any, options?: any): Promise<any> {
        return Promise.reject(new Error("Cannot add object on CombinedLiveList. This list doesn't have access to the models after the relation."));
    }
    save(obj?: T, options?: any): Promise<any> {
        if (this.destSourceMap && this.destSourceMap[obj['id']] && this.sourceMap[this.destSourceMap[obj['id']]]) {
            let srcObj = this.sourceMap[this.destSourceMap[obj['id']]];
            return this.mapFn(srcObj).save(obj, options);
        }
        return Promise.reject(new Error("Couldn't save object, because it wasn't found on this list"));
    }
    reorder(list: T[], options?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let sortedSrc: S[] = [];
            for (var i = 0; i < list.length; i++) {
                let obj = list[i];
                if (this.destSourceMap && this.destSourceMap[obj['id']] && this.sourceMap[this.destSourceMap[obj['id']]]) {
                    sortedSrc[i] = this.sourceMap[this.destSourceMap[obj['id']]];
                } else {
                    reject(new Error("Trying to reorder list with an object that isn't on the list"));
                    return;
                }
            }
            resolve(this.sourceLiveList.reorder(sortedSrc));
        })
    }
    remove(obj: T, options?: any): Promise<any> {
        if (this.destSourceMap && this.destSourceMap[obj['id']] && this.sourceMap[this.destSourceMap[obj['id']]]) {
            let srcObj = this.sourceMap[this.destSourceMap[obj['id']]];
            return this.sourceLiveList.remove(srcObj, options);
        }
        return Promise.resolve(); // Object not found on list, already removed;
        // return Promise.reject("Couldn't remove object, because it wasn't found on this list");
    }
    delete(obj: T, options?: any): Promise<any> {
        var promise;
        if (this.destSourceMap && this.destSourceMap[obj['id']] && this.sourceMap[this.destSourceMap[obj['id']]]) {
            let srcObj = this.sourceMap[this.destSourceMap[obj['id']]];
            return this.mapFn(srcObj).delete(options);
        }
        // if (this.destSourceMap && this.destSourceMap[obj['id']] && this.sourceMap[this.destSourceMap[obj['id']]]) {
        //     let srcObj = this.sourceMap[this.destSourceMap[obj['id']]];
        //     return this.sourceLiveList.remove(srcObj, options);
        // }
        return Promise.resolve(); // Object not found on list, already deleted probably;
        // return Promise.reject("Couldn't remove object, because it wasn't found on this list");
    }
    mapToOne<R>(relationName: string, options?: any): ILiveList<R> {
        return new CombinedLiveList(this.sourceLiveList, (obj:S) => this.mapFn(obj).toOne(relationName, options));
    }

    index(index: number): ILiveObject<T> {
        return new WrapLiveObject<T>((setObj, subscriber) => {
            return this.sourceLiveList.subscribe((list) => {
                if (list && list[index]) {
                    setObj(this.mapFn(list[index]));
                } else {
                    subscriber.next(null);
                }
            });
        });
    }

    toId(id: string, options?: any): ILiveObject<T> {
        if (this.destSourceMap && this.destSourceMap[id] && this.sourceMap[this.destSourceMap[id]]) {
            return this.mapFn(this.sourceMap[this.destSourceMap[id]]);
        }
        throw new Error("Couldn't get object by ID, because it wasn't found on this list");
    }

}
