import { BaseLiveObject } from "../base/base-live-object";

export class FirestoreLiveObject<T> extends BaseLiveObject<T> {
    
    save(obj?: T, options?: any): Promise<any> {
        if (this.options && this.options.collectionRef) {
            options = Object.assign({}, options, {collectionRef: this.options.collectionRef});
        }
        return super.save(obj, options);
    }
    delete(options?: any): Promise<any> {
        if (this.options && this.options.collectionRef) {
            options = Object.assign({}, options, {collectionRef: this.options.collectionRef});
        }
        return super.delete(options);
    }

    // toMany<R>(relationName: string, options?: any): ILiveList<R>
    // toOne<R>(relationName: string, options?: any): ILiveObject<R>
    // createIfNone(create: () => Promise<T>): ILiveObject<T>
}