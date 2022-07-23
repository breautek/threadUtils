
import * as Thread from 'worker_threads';
import {WorkerStatus} from './WorkerStatus';

export abstract class Worker {
    public constructor() {
        if (Thread.isMainThread) {
            throw new Error('Worker cannot be constructed from the main thread.');
        }

        Thread.parentPort.on('message', (d: any) => {
            this.$onData(d);
        });

        setTimeout(() => {
            Thread.parentPort.postMessage(WorkerStatus.IDLE);
        }, 0);
    }

    protected abstract _onData(d: any): Promise<void>;

    private async $onData(d: any): Promise<void> {
        Thread.parentPort.postMessage(WorkerStatus.RUNNING);
        await this._onData(d);
        Thread.parentPort.postMessage(WorkerStatus.IDLE);
    }
}
