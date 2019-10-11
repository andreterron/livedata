import { SimpleStore } from "js-data";
import { BaseLiveList } from "../base/base-live-list";
import { RelationSide } from "../interfaces/relations.interface";
import { BaseDataManager } from "../base/base-data-manager";
import { mergeQueries } from "../utils/merge-queries";

export class JSDataManyToManyLiveList<T> extends BaseLiveList<T> {

    public nextIndex: number = 0;

    constructor(
            dataManager: BaseDataManager,
            public store: SimpleStore,
            type: string,
            public id: string,
            public relation: RelationSide,
            public reverseRelation: RelationSide,
            public options?: any) {
        super(dataManager, type);
    }
    
    async refresh(): Promise<T[]> {
        try {
            var resMap: {[k: string]: T} = {};
            var ids: any[];
            // let where = Object.assign({}, this.options && this.options.query && this.options.query.where || {}, {[this.relation.foreignKey]: this.id});
            let query = mergeQueries(
                {orderBy: this.relation.indexField ? [[this.relation.indexField, 'ASC']] : undefined},
                this.options && this.options.query,
                {where: {[this.relation.foreignKey]: this.id}});
            // let query = Object.assign(
            //     {orderBy: this.relation.indexField ? [[this.relation.indexField, 'ASC']] : undefined},
            //     this.options && this.options.query || {});
            // query.where = Object.assign({}, query.where || {}, {[this.relation.foreignKey]: this.id});
            // if (!query.orderBy) {
            //     query.orderBy = this.relation.indexField ? [[this.relation.indexField, 'ASC']] : undefined;
            // }
            let edges = await this.store.findAll(this.relation.edge, query);
                    // {
                    //     with: [this.reverseRelation.foreignField] // Not working :(
                    // })
                // .then((edges) => {
            this.nextIndex = edges.length;
            ids = edges.map(e => e[this.reverseRelation.foreignKey]);
                    // return edges.map((edge) => edge[this.reverseRelation.foreignField]) // 'with' not working :(
            let list: any[] = await this.store.findAll(this.relation.type, {
                where: {id: {in: ids}}
            });
                // })
                // .then((list: any[]) => {
            list.forEach((item) => {
                resMap[item.id] = item;
            });
            let res = ids.map((id) => resMap[id]).filter(item => !!item);
                // })
                // .then(this.alert.bind(this), this.alertError.bind(this));
            this.alert(res);
            return res;
        } catch (e) {
            this.alertError(e);
            throw e;
        }
    }

    create(data: any, extra?: any, options?: any): Promise<T> {
        var created:T;
        return this.store
            .create(this.relation.type, data, options)
            .then((c) => {
                created = c;
                if (!this.options || !this.options.noAddOnCreate) {
                    return this._add(c, undefined, options);
                }
            })
            .then(() => {
                this.refresh();
                return created;
            });
    }
    _add(obj: T, extra?: any, options?: any): Promise<any> {
        let edge = {};
        if (this.relation.indexField) {
            edge[this.relation.indexField] = this.nextIndex++;
        }
        let q = {
            [this.relation.foreignKey]: this.id,
            [this.reverseRelation.foreignKey]: obj['id'],
        };
        Object.assign(edge, extra || {}, q);
        return this.store.findAll(this.relation.edge, {where: q})
            .then((edgeList) => {
                if (!edgeList || !edgeList.length) {
                    return this.dataManager.create(this.relation.edge, edge, options);
                }
                return edgeList[0];
            });
        // return this.store.create(this.relation.edge, edge, options);
    }
    add(obj: T, extra?: any, options?: any): Promise<any> {
        return this._add(obj, extra, options)
            .then(() => {this.refresh(); return obj}, (err) => {this.refresh(); throw err});
    }
    save(obj?: T, options?: any): Promise<any> {
        var promise = this.store.update(this.type, obj['id'], obj, options);
        if (options && options.edgeData) {
            return Promise.all([promise, this.saveEdge(options.edgeData, options)]);
        }
        return promise.then(this.thenRefresh.bind(this));
    }
    saveEdge(edge: any, options?: any): Promise<any> {
        return this.store.update(this.relation.edge, edge['id'], edge, options).then(this.thenRefresh.bind(this));
    }
    reorder(list: T[], options?: any): Promise<any> {
        if (this.relation.indexField) {
            let ids = list.map(i => i['id']);
            let indexMap = {};
            ids.forEach((id, i) => {indexMap[id] = i;});
            return this.store.findAll(this.relation.edge, {where: {[this.reverseRelation.foreignKey]: {in: ids}}})
                .then((edges) => {
                    let promises: Promise<any>[] = [];
                    for (var i = 0; i < edges.length; i++) {
                        let revId = edges[i][this.reverseRelation.foreignKey];
                        if (typeof indexMap[revId] !== 'number') {
                            // Edge is connected to an object not present in the list
                            promises.push(this.store.remove(this.relation.edge, edges[i].id, options));
                        } else  {
                            if (edges[i][this.relation.indexField] !== indexMap[revId]) {
                                // Edge exists, but index is different
                                edges[i][this.relation.indexField] = indexMap[revId];
                                promises.push(this.saveEdge(edges[i], options));
                            }
                            if (ids.indexOf(revId) !== -1) {
                                ids.splice(ids.indexOf(revId), 1);
                            }
                        }
                    }
                    promises = promises.concat(ids.map((id) => {
                        return this.add(list[indexMap[id]], {[this.relation.indexField]: indexMap[id]}, options);
                    }));
                    return Promise.all(promises);//.then(this.thenRefresh.bind(this));
                });
        }
        return Promise.reject("Cannot reorder this list");
    }
    remove(obj: T, options?: any): Promise<any> {
        let where = {[this.reverseRelation.foreignKey]: obj['id']};
        if (options && options.index) {
            where[this.relation.indexField] = options.index;
        }
        return this.store.destroyAll(this.relation.edge, {where: where, limit: 1}, options).then(this.thenRefresh.bind(this));
    }
    delete(obj: T, options?: any): Promise<any> {
        let where = {[this.reverseRelation.foreignKey]: obj['id']};
        if (options && options.index) {
            where[this.relation.indexField] = options.index;
        }
        return Promise.all([
            this.store.destroyAll(this.relation.edge, {where: where, limit: 1}, options),
            this.store.destroy(this.relation.type, obj['id'], options)
        ]).then(this.thenRefresh.bind(this));
    }
}