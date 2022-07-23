
import {Worker} from '../src/Worker';

export class CalculateFibonacci extends Worker {
    private $calculate(n: number): number {
        let a: number = 0, b: number = 1, c: number = n;
  
        for (let i = 2; i <= n; i++) {
            c = a + b;
            a = b;
            b = c;
        }
        
        return c;
    }

    protected override async _onData(d: number): Promise<void> {
        console.log('Fibonacci number for', d, 'is', this.$calculate(d));
    }
}

new CalculateFibonacci();
