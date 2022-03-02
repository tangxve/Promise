/**
 * 支持链式调用
 */


/**
 * Promise 三个状态
 */

// 等待状态
const PENDING = 'PENDING'
// 成功状态
const RESOLVED = 'RESOLVED'
// 失败状态
const REJECTED = 'REJECTED'


class Promise {
  /**
   * executor 是一个执行器，进入会立即执行 并传入 resolve 和 reject 方法
   * state 储存状态的变量，初始值是 pending
   * value  成功的值
   * reason 失败原因
   * resolvedCallbacks 存储成功的函数
   * rejectedCallbacks 存储失败的函数
   * @param executor
   */
  constructor(executor) {
    this.state = PENDING
    this.value = undefined
    this.reason = undefined

    this.resolvedCallbacks = []
    this.rejectedCallbacks = []

    /**
     * resolve 和 reject 为什么要用箭头函数？
     * 如果直接调用的话，普通函数 this 指向的是 window 或者 undefined
     * 用箭头函数就可以让 this 指向当前实例对象
     * @param value
     */
      // 成功函数
    const resolve = (value) => {
        if (this.state === PENDING) {
          this.state = RESOLVED
          this.value = value
          // 执行所有的回调函数
          this.resolvedCallbacks.forEach(fn => fn())
        }
      }

    // 失败函数
    const reject = (reason) => {
      if (this.state === PENDING) {
        this.state = REJECTED
        this.reason = reason
        // 执行所有的回调函数
        this.rejectedCallbacks.forEach(fn => fn())
      }
    }

    /**
     * 执行器 (executor) 接收两个参数，分别是 resolve, reject
     * 为了防止执行器 (executor) 在执行时出错，需要进行错误捕获，并将错误传入 reject 函数
     */
    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  /**
   * then 方法接收两个参数 onFulfilled 和 onFulfilled
   * @param onFulfilled 成功状态的调用
   * @param onRejected  失败状态的调用
   */
  then(onFulfilled, onRejected) {
    /**
     * 链式调用需要返回一个新的 promise
     * 在 then 函数中，无论成功还是失败，只要返回了结果就会传到下一个 then 的成功回调
     * 如果出现错误就会传入下一个 then 的失败回调
     * 即：下一个 then 的状态和上一个 then 执行时候状态无关
     * 所以在 then 执行的时候 onFulfilled, onRejected 可能会出现报错，需要捕获错误，并执行失败回调（处理成失败状态）
     */
    return new Promise((resolve, reject) => {
      if (this.state === RESOLVED) {
        // 成功状态的调用
        try {
          // 为了链式调用，需要获取 onFulfilled 函数执行的返回值，通过 resolve 返回
          const x = onFulfilled(this.value)
          resolve(x)
        } catch (error) {
          reject(error)
        }
      }

      if (this.state === REJECTED) {
        // 失败状态的调用
        try {
          // 为了链式调用，需要获取 onRejected 函数执行的返回值，通过 resolve 返回
          const x = onRejected(this.reason)
          resolve(x)
        } catch (e) {
          reject(e)
        }
      }

      /**
       * 当 Promise 状态为等待中（pending）时，大多数是异步情况下
       * 将 onFulfilled 和 onRejected 存入对应的回调队列
       * 到执行到异步的回调函数时，会执行 resolve 或 reject 静态方法，然后循环执行存储的回调队列
       */
      if (this.state === PENDING) {
        // 存入成功函数
        this.resolvedCallbacks.push(() => {
          try {
            onFulfilled(this.value)
          } catch (e) {
            reject(e)
          }
        })

        // 存入失败函数
        this.rejectedCallbacks.push(() => {
          try {
            onRejected(this.reason)
          } catch (e) {
            reject(e)
          }
        })
      }
    })
  }
}


module.exports = Promise

