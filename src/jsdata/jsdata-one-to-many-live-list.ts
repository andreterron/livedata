import { JSDataQueryLiveList } from "./jsdata-query-live-list";
import { SimpleStore } from "js-data";
import { BaseDataManager } from "../base/base-data-manager";
import { RelationSide } from "../interfaces/relations.interface";
import { mergeQueries } from "../utils/merge-queries";

export class JSDataOneToManyLiveList<T> extends JSDataQueryLiveList<T> {

    public nextIndex: number = 0;
    private lastList: T[] = [];

    constructor(
            dataManager: BaseDataManager,
            store: SimpleStore,
            type: string,
            public fkValue: string | number,
            public relation: RelationSide,
            options?: any) {
        super(dataManager, store, type, mergeQueries(
            {orderBy: relation.indexField ? [[relation.indexField, 'ASC']] : undefined},
            options && options.query,
            {where: {[relation.foreignKey]: fkValue}})
            // where: {
            //     [relation.foreignKey]: fkValue
            // },
            // orderBy: relation.indexField ? [[relation.indexField, 'ASC']] : undefined
            // }
        , options);

    }

    refresh(): Promise<T[]> {
        return super.refresh().then((res) => {
            this.nextIndex = res.length;
            this.lastList = res;
            return res;
        });
    }

    add(obj: T, extra?: any): Promise<any> {
        obj[this.relation.foreignKey] = this.fkValue;
        if (this.relation.indexField) {
            obj[this.relation.indexField] = this.nextIndex++;
        }
        return this.save(obj, extra).then(this.thenRefresh.bind(this));
    }
    remove(obj: T): Promise<any> {
        obj[this.relation.foreignKey] = null;
        return this.save(obj).then(this.thenRefresh.bind(this));
    }
    create(data: any, extra?: any): Promise<T> {
        data[this.relation.foreignKey] = this.fkValue;
        if (this.relation.indexField) {
            data[this.relation.indexField] = this.nextIndex++;
        }
        return this.store.create(this.type, data, extra).then(this.thenRefresh.bind(this));
    }
    reorder(list: T[], addOrRemove?: boolean): Promise<any> {
        if (this.relation && this.relation.indexField) {
            let promises: Promise<any>[] = [];
            let ids = this.lastList.map(item => item['id']);
            for (var i = 0; i < list.length; i++) {
                if (list[i][this.relation.indexField] !== i) {
                    list[i][this.relation.indexField] = i;
                    list[i][this.relation.foreignKey] = this.fkValue;
                    promises.push(this.save(list[i]));
                }
                if (ids.indexOf(list[i]['id']) != -1) {
                    ids.splice(ids.indexOf(list[i]['id']), 1);
                }
            }
            return Promise.all(promises.concat(ids.map((id) => {
                return this.store.update(this.type, id, {[this.relation.foreignKey]: null});
            }))).then(this.thenRefresh.bind(this));
        }
        return Promise.reject("Cannot reorder this list");
    }
}