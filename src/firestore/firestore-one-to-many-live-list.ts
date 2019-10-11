import { FirestoreQueryLiveList } from "./firestore-query-live-list";
import { BaseDataManager } from "../base/base-data-manager";
import { RelationSide } from "../interfaces/relations.interface";
import { firestore } from 'firebase';
import { mergeQueries } from "../utils/merge-queries";

export class FirestoreOneToManyLiveList<T> extends FirestoreQueryLiveList<T> {

    public nextIndex: number = undefined;
    // private lastList: T[] = [];

    constructor(
            dataManager: BaseDataManager,
            rootRef: firestore.DocumentReference,
            type: string,
            public srcRef: firestore.DocumentReference,
            public relation: RelationSide,
            options?: any) {
        super(dataManager, rootRef, type, mergeQueries(
                {orderBy: relation.indexField ? [[relation.indexField, 'ASC']] : undefined},
                options && options.query,
                {where: {[relation.foreignField]: srcRef}}
            ), options);
        // super(dataManager, rootRef, type, (ref: firestore.CollectionReference): firestore.Query => {
        //     let q = ref.where(this.relation.foreignField, '==', srcRef)
        //     if (relation.indexField) {
        //         return q.orderBy(this.relation.indexField, 'asc');
        //     }
        //     return q;
        // }, options);
    }

    // refresh(): Promise<T[]> {
    //     return super.refresh().then((res) => {
    //         this.nextIndex = res.length;
    //         this.lastList = res;
    //         return res;
    //     });
    // }

    // TODO: fetch results at least once to update nextIndex
    async add(obj: T, extra?: any): Promise<any> {
        if (this.nextIndex === undefined) {
            if (!this.data) {
                await this.once();
            }
            this.nextIndex = this.data.length;
        }
        obj[this.relation.foreignField] = this.srcRef;
        if (this.relation.indexField) {
            obj[this.relation.indexField] = this.nextIndex++;
        }
        return this.save(obj, extra);
    }
    remove(obj: T): Promise<any> {
        obj[this.relation.foreignField] = null;
        return this.save(obj);
    }
    async create(data: any, extra?: any, options?: any): Promise<T> {
        if (this.nextIndex === undefined) {
            if (!this.data) {
                await this.once();
            }
            this.nextIndex = this.data.length;
        }
        data[this.relation.foreignField] = this.srcRef;
        if (this.relation.indexField) {
            data[this.relation.indexField] = this.nextIndex++;
        }
        return this.dataManager.create(this.type, data, options);
        // return this.store.create(this.type, data, extra).then(this.thenRefresh.bind(this));
    }
    async reorder(list: T[], addOrRemove?: boolean): Promise<any> {
        if (this.relation && this.relation.indexField) {
            let ids = this.data.map(item => item['id']);
            this.nextIndex = list.length;
            let batch = this.rootRef.firestore.batch();
            for (var i = 0; i < list.length; i++) {
                if (list[i][this.relation.indexField] !== i) {
                    list[i][this.relation.indexField] = i;
                    list[i][this.relation.foreignField] = this.srcRef;
                    batch.update(this.rootRef.collection(this.type).doc(list[i]['id']), {
                        [this.relation.indexField]: i,
                        [this.relation.foreignField]: this.srcRef
                    });
                }
                if (ids.indexOf(list[i]['id']) != -1) {
                    ids.splice(ids.indexOf(list[i]['id']), 1);
                }
            }
            ids.forEach((id) => {
                // return this.rootRef.collection(this.type).doc(id).update({[this.relation.foreignField]: null});
                batch.update(this.rootRef.collection(this.type).doc(id), {
                    [this.relation.foreignField]: null
                });
                // return this.store.update(this.type, id, {[this.relation.foreignField]: null});
            });
            return batch.commit();
            // return Promise.all(promises.concat(ids.map((id) => {
            //     // return this.rootRef.collection(this.type).doc(id).update({[this.relation.foreignField]: null});
            //     return batch.update(this.rootRef.collection(this.type).doc(list[i]['id']), {
            //         [this.relation.foreignField]: null
            //     });
            //     // return this.store.update(this.type, id, {[this.relation.foreignField]: null});
            // })));
        }
        throw new Error("Cannot reorder this list");
    }
}