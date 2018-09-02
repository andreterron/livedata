import {curry} from '../../src/v2/curry';

function add(x: number, y: number): number {
    return x + y;
}

let cadd = curry(add);

console.log(cadd(1,2));
// console.log(cadd(1)(2));

let add1 = cadd(1)
console.log(cadd.length, add1.length);
