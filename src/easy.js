/**
 * 只处理同步调用
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
  // executor 是一个执行器，进入会立即执行 并传入 resolve 和 reject 方法
  constructor(executor) {
    // 储存状态的变量，初始值是 pending
    this.state = PENDING
    // 成功的值
    this.value = undefined
    // 失败原因
    this.reason = undefined

    // resolve 和 reject 为什么要用箭头函数？
    // 如果直接调用的话，普通函数 this 指向的是 window 或者 undefined
    // 用箭头函数就可以让 this 指向当前实例对象

    // 成功函数
    const resolve = (value) => {
      if (this.state === PENDING) {
        this.state = RESOLVED
        this.value = value
      }
    }

    // 失败函数
    const reject = (reason) => {
      if (this.state === PENDING) {
        this.state = REJECTED
        this.reason = reason
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
  }
}


module.exports = Promise

