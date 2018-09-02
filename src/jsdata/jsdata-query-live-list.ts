import { Subscriber } from 'rxjs/Subscriber';
import { Observable } from "rxjs/Observable";
import { TeardownLogic, Subscription } from 'rxjs/Subscription';
import { DataStore, SimpleStore, Mapper } from 'js-data';
import { BaseLiveList } from '../base/base-live-list';
import { BaseDataManager } from '../base/base-data-manager';

export class JSDataQueryLiveList<T> extends BaseLiveList<T> {

    constructor(dataManager: BaseDataManager, public store: SimpleStore, public type: string, public query?: any, public options?: any) {
        super(dataManager, type);
        if (this.options && this.options.indexField && (!this.query || !this.query.orderBy)) {
            this.query = this.query || {};
            this.query.orderBy = this.query.orderBy || [[this.options.indexField,'ASC'], ['id', 'ASC']];
        }
    }

    refresh(): Promise<T[]> {
        let mapper: Mapper = this.store.getMapper(this.type);
        return this.store.findAll(this.type, this.query, this.options)
            .then(this.alert.bind(this), this.alertError.bind(this)) as Promise<T[]>;
    }

    add(obj: T, extra?: any, options?: any): Promise<any> {
        if (!this.query || !this.query.where) {
            return this.store.create(this.type, obj, extra).then(this.thenRefresh.bind(this));
        }
        return Promise.reject("Cannot add to this list");
    }
    remove(obj: T, options?: any): Promise<any> {
        if (!this.query || !this.query.where) {
            return this.store.destroy(this.type, obj['id']).then(this.thenRefresh.bind(this));
        }
        return Promise.reject("Cannot remove from this list");
    }
    create(data: any, extra?: any, options?: any): Promise<T> {
        if (!this.query || !this.query.where) {
            return this.store.create(this.type, data, extra).then(this.thenRefresh.bind(this));
        }
        return Promise.reject("Cannot create on this list");
    }
    save(obj?: T, options?: any): Promise<any> {
        if (obj) {
            return this.store.update(this.type, obj['id'], obj, options);
        }
    }
    reorder(list: T[], options?: any): Promise<any> {
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
        return this.store.destroy(this.type, obj['id']).then(this.thenRefresh.bind(this));
    }

}