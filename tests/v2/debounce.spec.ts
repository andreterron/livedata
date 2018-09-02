import { Observable, combineLatest, Subject } from 'rxjs';
import { map, debounce } from 'rxjs/operators';

let src = new Subject<number>();
let clock = new Subject<void>();

const add = (input: Observable<number>, n: number): Observable<number> => {
    return input.pipe(map(v => v + n));
}

let a = add(src, 2);
let b = add(src, 5);

let x = combineLatest([a, b]).pipe(debounce(() => clock), map(([m, n]) => m + n))
let y = combineLatest([a, b]).pipe(debounce(() => clock), map(([m, n]) => m - n))
let z = combineLatest([a, b]).pipe(debounce(() => clock), map(([m, n]) => m * n))

x.subscribe(next => console.log(next));

src.next(1)
src.next(2)
clock.next();
src.next(3)
clock.next();
src.next(4)
clock.next();
