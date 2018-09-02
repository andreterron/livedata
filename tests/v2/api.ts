import { Observable, range, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ILive } from '../../src/v2/v2';
import { OpenFile, AppState } from './test-types';
// import { combineLatest } from '../../node_modules/rxjs/operator/combineLatest';

// let root: any
// let renderer: any

// let manager: any // TODO: don't use a manager

// function addTransformation<T>(req: T, cb: (...T) => any) {
    
// }

class Card {
    name: string
    children: Card[]
}

// interface Position {
//     index: number,
//     line: number,
//     column: number
// }

// // -------

// interface AppState {
//     openFiles: OpenFile[]
// }

// interface OpenFile {
//     path: string
//     snippets: OpenSnippet[]
// }

// interface OpenSnippet {
//     range: {
//         start: Position,
//         end: Position
//     }
//     file?: OpenFile
// }

let file: OpenFile = {
    path: '',
    snippets: []
};

file.snippets.push({
    range: {
        start: null,
        end: null
    },
    file: file
});

let stt: AppState = {
    openFiles: [
        {
            path: '',
            snippets: []
        },
        {
            path: '',
            snippets: []            
        }
    ]
};

// --------

// interface LiveCopy2<T> (node: any) {

// }

// type LiveArray<T extends Array<A>, A> = Array<LiveCopy<A>>

// type SubscribeParam = 'subscribe';

// type LiveLiteral = {
//     __query: () => string
// }

// type LiveQuery<T> = {
//     // [P in keyof T]: T[P] extends Array<any> ? AbcArray<T[P]> : Abc<T[P]>;
//     [P in keyof T]: P extends '__query' ? () => any : (T[P] extends object ? LiveQuery<T[P]> : LiveLiteral)
//     // [P in keyof T]: () => T[P]
//     // subscribe: number,
//     // [P in keyof T | 'subscribe']: P is 'subscribe' ? () => number : LiveCopy<T[P]>
    
//     // subscribe: () => void;
// } & {__query: () => string};

// function query<T>(path: string = ''): LiveQuery<T> {
//     return new Proxy<object>({}, {
//         get: <PK extends keyof T>(target: object, p: PK, receiver: any) => {
//             if (p === "__query") {
//                 return () => path;
//             }
//             return query<T[PK]>(`${path}.${p}`);
//         }
//     }) as LiveQuery<T>;
// }

// type BoxedMe = {subscribe: () => void, omg: number}

// function mainTest() {
//     root.openFiles.openSnippets.range

//     renderer.register(root.openFiles)

//     addTransformation([1], (openFiles: string): any => {

//     })

//     let lc: LiveQuery<Card>;

//     // lc.children[0].children[1]
//     query<Card>().children[1].children[0].__query();

//     manager.addTransformation("Card", (card) => {
//         // let abc: Abc<Card> = root.card
//         // abc.children.ea
//     })
// }

// let state = query<AppState>();

// // state.openFiles

// let card = query<Card>();
// let child = card.children[0];

// console.log(card.children[0].children[1].__query());

export interface ILive<T> {
    subscribe(next: (v: T) => void)
    ref(): LiveRef<T>
    observable: Observable<T>
}


let state: LiveFn<AppState>;


// state.openFiles

let a: any, b: any;

b.start - a.start;

// a.start.pipe(subtract(a.end))

// combineLatest(a, b).pipe(map(([x,y]) => x + y));



let subtract: (x: ILive<number>, y: ILive<number>) => ILive<number>;

subtract(a.start, b.start).subscribe(v => v);



// map(state.openFiles(), () => 1).snippets.subscribe((snippets) => {
    
// })



// state.toMany<OpenFile>().toMany<OpenSnippet>()







// interface LiveArray<T> extends ILive<Array<LiveFn<T>>> {
    
// }
type LiveArray<T> = {
    [P in keyof T]: T[P] extends Array<infer A> ? LiveArray<A> : (T[P] extends object ? LiveArray<T[P]> : ILive<Array<T[P]>>)
} & ILive<Array<T>> & {
    
}

type LiveFn<T> = {
    // [P in keyof T]: <A>() => (T[P] extends Array<A> ? LiveArray<LiveFn<A>> : (T[P] extends object ? LiveFn<T[P]> : LiveLiteral))
    [P in keyof T]: T[P] extends Array<infer A> ? LiveArray<A> : (T[P] extends object ? LiveFn<T[P]> : ILive<T[P]>)
} & ILive<T>


type LiveRef<R> = {
    id?: string
    path?: string
}

type Snap<T> = {
    id?: string
    data?: T
}


let fn: LiveFn<AppState>

// let a = fn.openFiles.subscribe((files) => {
//     files[0].snippets.subscribe(snippets => {
//         snippets[0].range.start.column.subscribe(n => console.log(n));
//     })
// })

fn.openFiles.snippets.range.start.index.subscribe(indexes => {

})

type LiveQuery<T> = {
    [P in keyof T]?: T[P] extends Array<infer A> ? LiveQuery<A> : (T[P] extends object ? LiveQuery<T[P]> : true)
}

type LiveQueryDef<T> = {
    [P in keyof T]?: T[P]
}


// let registerAction: <T extends any[] = any[]>(name: string, query: LiveQueryDef<T>, cb: (...args: T) => void) => {}

let callAction: <T>(ref: LiveRef<T>, action: string, ...params) => Promise<void>;

let editAction = (openFile: LiveFn<OpenFile>, content: string /* diff maybe> */) => {

}

// let act = registerAction('edit', [], () => {});

type ActionQuery<T> = {

}

type Action<R, U extends any[]> = (req: R, ...args: U) => void

type ActionDefinition<A extends Action<T, U>, T, U extends any[]> = (query: LiveQuery<T>, action: A) => A

let registerAction: <T, U extends any[]>(query: LiveQuery<T>, action: Action<T, U>) => Action<T, U>

let action = (file: OpenFile) => {}

let newAction = registerAction({ path: true }, action);


newAction(file)


// let action = (file: Snap<{file: OpenFile, other: OpenFile}>) => {};

// registerAction<OpenFile>('edit',
//     {
//         path: true,
//         snippets: {
//             range: {
//                 start: {index: true},
//                 end: {index: true}
//             }
//         }
//         // openFiles: {
//         //     path: true,
//         //     snippets: {
//         //         range: {
//         //             start: {index: true},
//         //             end: {index: true}
//         //         }
//         //     }
//         // }
//     }, (file: OpenFile): OpenFile => {
//         file.snippets.forEach(snippet => snippet.range.start.index += 10);
//         return file;
//     }
// )

let openFile: LiveFn<OpenFile>;

// callAction(openFile, 'edit', "let hello = 1;");
// openFile().action.edit("let hello = 1");

// openFile.content = "bla";


// let sum = (a: ILive<number>, b: ILive<number>);
let strLen: (str: ILive<string>) => ILive<number>; // = (str: ILive<string>): ILive<number> => new Live<number>(str.observable.pipe(map(s => s.length)));


type ActionFn<U extends any[]> = (...args: U) => Promise<any>

type ActionWrap<A extends ActionFn<B>, B extends any[]> = (f: ActionFn<B>) => void



let liveWith = <T>(live: ILive<T>, children: (l: ILive<T>) => ILive<any>[]): ILive<T> => {

    return live;
}

liveWith(fn.openFiles, (file) => [])