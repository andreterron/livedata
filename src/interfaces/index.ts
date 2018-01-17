import { Observable, ObservableInput } from "rxjs/Observable";
import { Subscription } from 'rxjs/Subscription';

export { RelationsDefinition, RelationSide } from './relations.interface';

export interface ILiveObservable<T> extends Observable<T> {
    
    alert(next: T): T

    alertError(err)

    // liveSwitchMap<I>(project: (value: T, index: number) => ObservableInput<I>): ILiveObservable<I>
    // switchLiveList<I>(project: (value: T, index: number) => ILiveList<I>): ILiveList<I>
    // switchLiveObject<I>(project: (value: T, index: number) => ILiveObject<I>): ILiveObject<I>

}

export interface ILiveList<T> extends ILiveObservable<T[]> {

        refresh(): Promise<T[]>
        once(): Promise<T[]>

        add(obj: T, extra?: any, options?: any): Promise<any>
        remove(obj: T, options?: any): Promise<any>
        delete(obj: T, options?: any): Promise<any>
        create(data: any, extra?: any, options?: any): Promise<T>
        save(obj?: T, options?: any): Promise<any>
        reorder(list: T[], addOrRemove?: boolean, options?: any): Promise<any>

        mapToOne<R>(relationName: string, options?: any): ILiveList<R>
        index(index: number): ILiveObject<T>
        toId(id: string, options?: any): ILiveObject<T>

}

export interface ILiveObject<T> extends ILiveObservable<T> {
    
    refresh(): Promise<T>
    once(): Promise<T>

    save(obj?: T, options?: any): Promise<any>
    delete(options?: any): Promise<any>

    toMany<R>(relationName: string, options?: any): ILiveList<R>
    toOne<R>(relationName: string, options?: any): ILiveObject<R>
    createIfNone(create: () => Promise<T>): ILiveObject<T>

}
