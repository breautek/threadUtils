
import { EventEmitter } from 'events';
import * as Thread from 'worker_threads';
import {WorkerStatus} from './WorkerStatus';

export enum WorkerContextEvent {
    IDLE = 'idle',
    RUNNING = 'running',
    ERROR = 'error',
    EXIT = 'exit'
}

export class WorkerContext extends EventEmitter {
    private $api: Thread.Worker;
    private $state: WorkerStatus;

    public constructor(api: Thread.Worker) {
        super();
        this.$api = api;

        this.$api.addListener('message', (d) => {
            if (d === WorkerStatus.IDLE) {
                this.$state = WorkerStatus.IDLE;
                this.emit(WorkerContextEvent.IDLE);
            }
        });

        this.$api.addListener('error', (error: Error) => {
            this.emit(WorkerContextEvent.ERROR, error);
        });

        this.$api.addListener('messageerror', (error: Error) => {
            this.emit(WorkerContextEvent.ERROR, error);
        });

        this.$api.addListener('exit', (exitCode: number) => {
            this.emit(WorkerContextEvent.EXIT, exitCode);
        });
    }

    public send(data: any): void {
        if (this.$state === WorkerStatus.RUNNING) {
            throw new Error('Worker is busy');
        }

        this.$state = WorkerStatus.RUNNING;
        this.$api.postMessage(data);
    }

    public async destroy(): Promise<number> {
        return this.$api.terminate();
    }
}
