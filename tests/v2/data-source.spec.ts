import { LiveDataSource, MemoryDataSource, SingleStateDataSource } from '../../src/v2/data-source';
import { AppState } from './test-types';
import { of, BehaviorSubject } from 'rxjs';

let appState: AppState = {
    openFiles: []
}

let subject = new BehaviorSubject<AppState>(undefined);

let dataSource: SingleStateDataSource<AppState> = new SingleStateDataSource<AppState>(subject.asObservable());

dataSource.root.subscribe(a => console.log('GOT NEXT', a), e => console.error(e), () => console.warn("FINISHED"));

dataSource.node(dataSource.root).openFiles.$.subscribe(a => console.log('GOT OPEN FILES', a), e => console.error(e), () => console.warn("FINISHED"));

setTimeout(() => {
    console.log("lets next")
    subject.next(appState)
}, 500);

// setTimeout(() => {
    
// }, 500)


// setTimeout(() => console.log("Timeout done"), 3000)


console.log('end of file');

