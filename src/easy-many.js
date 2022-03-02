/**
 * 支持多次 then 方法调用
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
    if (this.state === RESOLVED) {
      // 成功状态的调用
      onFulfilled(this.value)
    }

    if (this.state === REJECTED) {
      // 失败状态的调用
      onRejected(this.reason)
    }

    // 当 Promise 状态为等待中（pending）时，
    if (this.state === PENDING) {
      // 存入成功函数
      this.resolvedCallbacks.push(() => {
        onFulfilled(this.value)
      })

      // 存入失败函数
      this.rejectedCallbacks.push(() => {
        onRejected(this.reason)
      })
    }
  }
}


module.exports = Promise

