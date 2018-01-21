import { FirestoreQueryLiveList } from "./firestore-query-live-list";
import { BaseDataManager } from "../base/base-data-manager";
import { firestore } from 'firebase';
import { RelationSide } from "../interfaces/relations.interface";
import { mergeQueries } from "../utils/merge-queries";
import { LiveObject } from "../index";

export class FirestoreSubCollectionLiveList<T> extends FirestoreQueryLiveList<T> {
    constructor(
        dataManager: BaseDataManager,
        rootRef: firestore.DocumentReference,
        type: string,
        public srcRef: firestore.DocumentReference,
        public relation: RelationSide,
        options?: any) {
        super(dataManager, rootRef, type, mergeQueries(
                {orderBy: relation.indexField ? [[relation.indexField, 'ASC']] : undefined},
                options && options.query
            ), options);
        // super(dataManager, rootRef, type, (ref: firestore.CollectionReference): firestore.Query => {
        //     let q = ref.where(this.relation.foreignField, '==', srcRef)
        //     if (relation.indexField) {
        //         return q.orderBy(this.relation.indexField, 'asc');
        //     }
        //     return q;
        // }, options);
    }

    toId(id: string, options?: any): LiveObject<T> {
        return this.dataManager.liveObject(this.relation.type, id, Object.assign({}, options, {collectionRef: this.collectionRef()}));
    }

    collectionRef() {
        return this.srcRef.collection(this.relation.type);
    }

    add(obj: T, extra?: any, options?: any): Promise<any> {
        return this.dataManager.create(this.type, obj, Object.assign({}, options, {collectionRef: this.collectionRef()}));
    }
    remove(obj: T, options?: any): Promise<any> {
        return this.dataManager.delete(this.type, obj, Object.assign({}, options, {collectionRef: this.collectionRef()}));
    }
    create(data: any, extra?: any, options?: any): Promise<T> {
        return this.dataManager.create(this.type, data, Object.assign({}, options, {collectionRef: this.collectionRef()}));
    }
    save(obj?: T, options?: any): Promise<any> {
        return this.dataManager.save(this.type, obj, Object.assign({}, options, {collectionRef: this.collectionRef()}));
    }
    reorder(list: T[], options?: any): Promise<any> {
        // TODO: review this pls
        if (this.options && this.options.indexField) {
            let promises: Promise<any>[] = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i][this.options.indexField] !== i) {
                    list[i][this.options.indexField] = i;
                    promises.push(this.save(list[i]));
                }
            }
            return Promise.all(promises);
        }
        return Promise.reject("Cannot reorder this list");
    }
    delete(obj: T, options?: any): Promise<any> {
        return this.dataManager.delete(this.type, obj, Object.assign({}, options, {collectionRef: this.collectionRef()}));
    }
}