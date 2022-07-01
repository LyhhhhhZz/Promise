const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
    FULFILLED_CALLBACK_LIST = [];
    REJECTED_CALLBACK_LIST = [];
    _status = PENDING;

    constructor(executor) {
        this.status = PENDING
        this.value = null
        this.reason = null

        try {
            executor(this.reslove.bind(this), this.reject.bind(this))
        } catch (error) {
            this.reject(error)
        }
    }

    get status() {
        return this._status
    }

    set status(newStatus) {
        this._status = newStatus
        switch(newStatus) {
            case FULFILLED: {
                this.FULFILLED_CALLBACK_LIST.forEach(cb => cb(this.value))
                break
            }
            case REJECTED: {
                this.REJECTED_CALLBACK_LIST.forEach(cb => cb(this.reason))
                break
            }
        }
    }

    reslove(value) {
        if(this.status === PENDING) {
            this.status = FULFILLED
            this.value = value
        }
    }

    reject(reason) {
        if(this.status === PENDING) {
            this.status = REJECTED
            this.reason = reason
        }
    }

    then(onFulfilled, onRejected) {
        const realOnFulfilled = typeof onFulfilled === 'function'? onFulfilled : value => value
        const realOnRejected = typeof onRejected === 'function'? onRejected : reason => { throw reason }

        const promise2 = new MyPromise((resolve, reject) => {
            const fulfilledMicrotask = () => {
                queueMicrotask(() => {
                    try {
                        const x = realOnFulfilled(this.value)
                        this.resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                })
            }
            const rejectedMicrotask = () => {
                queueMicrotask(() => {
                    try {
                        const x = realOnRejected(this.reason)
                        this.resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        reject(error)
                    }
                })
            }

            switch(this.status) {
                case FULFILLED: {
                    fulfilledMicrotask()
                    break
                }
                case REJECTED: {
                    rejectedMicrotask()
                    break
                }
                case PENDING: {
                    this.FULFILLED_CALLBACK_LIST.push(fulfilledMicrotask)
                    this.REJECTED_CALLBACK_LIST.push(rejectedMicrotask)
                }
            }
        }) 

        return promise2
    }

    catch(onRejected) {
        return this.then(null, onRejected)
    }

    resolvePromise(promise2, x, resolve, reject) {
        // 如果 newPromise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 newPromise
        // 这是为了防止死循环
        if (promise2 === x) {
            return reject(new TypeError('The promise and the return value are the same'));
        }

        if (x instanceof MyPromise) {
            // 如果 x 为 Promise ，则使 newPromise 接受 x 的状态
            // 也就是继续执行x，如果执行的时候拿到一个y，还要继续解析y
            queueMicrotask(() => {
                x.then((y) => {
                    this.resolvePromise(promise2, y, resolve, reject);
                }, reject);
            })
        } else if (typeof x === 'object' || typeof x === 'function') {
            // 如果 x 为对象或者函数
            if (x === null) {
                // null也会被判断为对象
                return resolve(x);
            }

            let then = null;

            try {
                // 把 x.then 赋值给 then 
                then = x.then;
            } catch (error) {
                // 如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise
                return reject(error);
            }

            // 如果 then 是函数
            if (typeof then === 'function') {
                let called = false;
                // 将 x 作为函数的作用域 this 调用
                // 传递两个回调函数作为参数，第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise
                try {
                    then.call(
                        x,
                        // 如果 resolvePromise 以值 y 为参数被调用，则运行 resolvePromise
                        (y) => {
                            // 需要有一个变量called来保证只调用一次.
                            if (called) return;
                            called = true;
                            this.resolvePromise(promise2, y, resolve, reject);
                        },
                        // 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
                        (r) => {
                            if (called) return;
                            called = true;
                            reject(r);
                        });
                } catch (error) {
                    // 如果调用 then 方法抛出了异常 e：
                    if (called) return;

                    // 否则以 e 为据因拒绝 promise
                    reject(error);
                }
            } else {
                // 如果 then 不是函数，以 x 为参数执行 promise
                resolve(x);
            }
        } else {
            // 如果 x 不为对象或者函数，以 x 为参数执行 promise
            resolve(x);
        }
    }
    
    static resolve(value) {
        if(value instanceof MyPromise) {
            return value
        }

        return new MyPromise(resolve => {
            resolve(value)
        })
    }

    static reject(reason) {
        return new MyPromise(reject => {
            reject(reason)
        })
    }
}








