
### Description

Threading utility library to manage a queue of jobs and spread work loads across multiple CPUs.

Utilizes NodeJS worker_threads under the scenes.

### Caveats

NodeJS, and JS environments in general are not concurrency friendly. It does not have true threading support. In particular it doesn't have shared memory.

Data transferred to workers are copied and if you're copying large datasets back and fourth, you'll probably eliminating any actual performance gain by using NodeJS threads.

It's recommended to have a small dataset, such as an database ID that can be given to the worker thread and have the worker thread fetch and process the data. Processed data is not sent back to the main thread

### API

TBD
