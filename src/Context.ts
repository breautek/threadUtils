
import * as OS from 'os';
import {WorkerContext, WorkerContextEvent} from './WorkerContext'
import * as Thread from 'worker_threads';
import * as Path from 'path';

console.log(__filename);

type PromiseResolveFunction<T> = (data: T | PromiseLike<T>) => void;
type PromiseRejectFunction = (reason?: any) => void;

class PromiseWrapper<T> {
    private $resolve: PromiseResolveFunction<T>;
    private $reject: PromiseRejectFunction;

    public constructor(resolve: PromiseResolveFunction<T>, reject: PromiseRejectFunction) {
        this.$reject = reject;
        this.$resolve = resolve;
    }

    public resolve(data: T): void {
        this.$resolve(data);
    }

    public reject(reason?: any): void {
        this.$reject(reason);
    }
}

export class Context {
    private $workerName: string;
    private $workerPool: Array<WorkerContext>;
    private $idling: Array<WorkerContext>;
    private $idleWaitPromise: Promise<void>;
    private $idlePromiseWrapper: PromiseWrapper<void>;
    private $isActive: boolean;

    /**
     * 
     * @param workerName    The name of the script to launch for the worker context, minus the extension.
     *                      If ran from a TS environment, the .ts extension will automatically be appended.
     *                      Otherwise, .js will be appended.
     * @param processors    Number of workers to use. Default is to use available core count of the machine.
     */
    public constructor(workerName: string, processors: number = OS.cpus().length) {
        if (!Thread.isMainThread) {
            throw new Error('Context can only be constructed from the main thread.');
        }

        this.$workerName = workerName;
        this.$workerPool = [];
        this.$idling = [];

        this.$idleWaitPromise = null;
        this.$isActive = false;

        let isTS: boolean = /\.ts$/.test(__filename);

        for (let i: number = 0; i < processors; i++) {
            this.$workerPool.push(this.$buildWorker(isTS));
        }
    }

    private $buildWorker(isTS: boolean): WorkerContext {
        let ext: string = isTS ? '.ts' : '.js';
        let worker: WorkerContext = new WorkerContext(
            new Thread.Worker(Path.resolve(this.$workerName + ext))
        );

        worker.addListener(WorkerContextEvent.IDLE, () => {
            console.log('WORKER IDLE?');
            this.$idling.push(worker);

            if (this.$idlePromiseWrapper) {
                this.$idlePromiseWrapper.resolve();
                this.$idlePromiseWrapper = null;
                this.$idleWaitPromise = null;
            }
        });

        worker.addListener(WorkerContextEvent.EXIT, () => {
            let idx: number = this.$workerPool.indexOf(worker);
            if (idx > -1) {
                this.$workerPool.splice(idx, 1);
            }
        });

        worker.addListener(WorkerContextEvent.ERROR, (err) => {
            console.error(err);
            worker.destroy();
        });

        return worker;
    }

    /**
     * 
     * @param data  A list of data to process. Each data entry will be copied to the worker context
     *              that assumes responsibility to process the data.
     * @param assumeOwnership   If true, the data array will not be copied. If false, the data array will be shallow copied.
     *                          
     * The data array will be modified over time to remove entries as they are processed.
     * Setting `assumeOwnership` to `true` may yield some performance improvements if the dataset
     * is large and it's eventual deconstruction is not a concern.
     */
    public async execute(data: Array<any>, assumeOwnership?: boolean): Promise<void> {
        let queue = assumeOwnership ? data : data.slice();
        this.$isActive = true;
        console.log('Q Length', queue.length);
        while (queue.length > 0) {
            if (this.$idling.length === 0) {
                await this.$waitForAvailableWorker();
            }

            let worker: WorkerContext = this.$idling.pop();
            console.log('Sending job...');
            worker.send(queue.pop());
        }
        this.$isActive = false;
    }

    private async $waitForAvailableWorker(): Promise<void> {
        if (this.$idleWaitPromise === null) {
            this.$idleWaitPromise = new Promise<void>((resolve, reject) => {
                this.$idlePromiseWrapper = new PromiseWrapper(resolve, reject);
            });
        }

        return this.$idleWaitPromise;
    }

    public isActive(): boolean {
        return this.$isActive;
    }

    public async destroy(): Promise<void> {
        let p: Array<Promise<number>> = [];
        for (let i: number = 0; i < this.$workerPool.length; i++) {
            p.push(this.$workerPool[i].destroy());
        }
        await Promise.all(p);
    }
}
