import { LiveModel, LiveSnap } from "../../src";
import { of, Subject } from "rxjs";

let sub1 = new Subject<LiveSnap<number>>();

let liveModel = new LiveModel(sub1.asObservable());

let a = liveModel.subscribe(n => console.log('A', n))
let b = liveModel.subscribe(n => console.log('B', n))

console.log("SUBS", sub1.observers.length);

sub1.next({ref: null, value: 1});
sub1.next({ref: null, value: 2});
sub1.next({ref: null, value: 3});

let c = liveModel.subscribe(n => console.log('C', n))

sub1.next({ref: null, value: 4});

