
import { Observable, ObservableInput } from "rxjs/Observable";
import { Subscription, TeardownLogic, AnonymousSubscription } from 'rxjs/Subscription';
import { PartialObserver } from "rxjs/Observer";
import { Subscribable } from "rxjs/Observable";
import { LiveModel } from "./live-model";
import { RelationInput } from './relations.interface';

export { RelationSide, RelationPartial, RelationsDefinition, RelationDefinition, RelationInputObject } from './relations.interface';
export { LiveModel, RelationInput };

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/switchMap';


export interface ILiveObservable<T> extends Observable<T> {
    
    alert(next: T): T

    alertError(err)

    // liveSwitchMap<I>(project: (value: T, index: number) => ObservableInput<I>): ILiveObservable<I>
    // switchLiveList<I>(project: (value: T, index: number) => ILiveList<I>): ILiveList<I>
    // switchLiveObject<I>(project: (value: T, index: number) => ILiveObject<I>): ILiveObject<I>

}

export interface ILiveModel<T> extends Subscribable<T> {
    live: Subscribable<T>
    data: T
    loading: boolean
    once(): Promise<T>
    refresh(): Promise<T>
}

export interface LiveList<T> extends ILiveModel<T[]> {

    liveObjects: Subscribable<LiveObject<T>[]>

    // Operations
    add(obj: T, extra?: any, options?: any): Promise<any>
    remove(obj: T, options?: any): Promise<any>
    delete(obj: T, options?: any): Promise<any>
    create(data: any, extra?: any, options?: any): Promise<T>
    save(obj?: T, options?: any): Promise<any>
    reorder(list: T[], addOrRemove?: boolean, options?: any): Promise<any>

    // Relationships
    index(index: number, options?: any): LiveObject<T>
    toId(id: string, options?: any): LiveObject<T>

}

export interface LiveObject<T> extends ILiveModel<T> {

    // Operations
    save(obj?: T, options?: any): Promise<any>
    delete(options?: any): Promise<any>

    // Relationships
    toMany<R>(relation: RelationInput, options?: any): LiveList<R>
    toOne<R>(relation: RelationInput, options?: any): LiveObject<R>

    // Mutators
    createIfNone(create: () => Promise<T>): LiveObject<T>

}
