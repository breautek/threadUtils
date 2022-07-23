
import {Context} from '../src/Context';

console.log('Preparing example dataset')

let ds: Array<number> = [];

for (let i: number = 0; i < 100000; i++) {
    ds.push(i);
}

ds = ds.reverse();

(async () => {
    let c1: Context = new Context('calculateFibonacci');
    console.log('Executing...');
    let startTime: number = new Date().getTime();
    await c1.execute(ds);
    let endTime: number = new Date().getTime();

    console.log('Finished after', endTime - startTime, 'ms');
    await c1.destroy();
})();

