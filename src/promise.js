/**
 * Promise A+ 规范实现
 **/

/**
 * Promise 三个状态
 */

// 等待状态
const PENDING = 'pending'
// 成功状态
const FULFILLED = 'fulfilled'
// 失败状态
const REJECTED = 'rejected'


/**
 * 工具方法
 */

function isFunction(value) {
  return typeof value === 'function'
}

function isObject(value) {
  return typeof value === 'object' && value !== null
}

// 是否可以迭代
function isIterator(value) {
  return value && isFunction(value[Symbol.iterator])
}

//  为了确保 onFulfilled 和 onRejected 方法异步执行，且应该在 then 方法被调用的那一轮事件循环之后的新执行栈中执行
function nextTick(fn) {
  if (typeof window !== 'undefined') {
    window.queueMicrotask(fn)
  } else {
    process.nextTick(fn)
  }
}

/**
 * 规范 2.3
 * 实现兼容多种 Promise 的 resolutionProcedure 函数
 */

/**
 *
 * @param promise2  当前要返回的 promise
 * @param x 执行 onFulfilled 返回值
 * @param resolve
 * @param reject
 * @returns {*}
 */
function resolutionProcedure(promise2, x, resolve, reject) {
  /**
   * 规范 2.3.1
   * promise2 返回结果 x 为自身，应该直接执行 reject
   */
  if (promise2 === x) {
    return reject(new TypeError('循环引用'))
  }

  // 规范 2.3.2 如果 x 是 Promise 实例，就执行 then
  if (x instanceof Promise) {
    x.then(/**
     * 继续调用 resolutionProcedure 解析
     * 防止 value 的返回值还是一个 Promise
     */(value) => resolutionProcedure(promise2, value, resolve, reject), reject)
  }


  // 设置一个标志位，防止重复调用
  let called = false

  /**
   * 规范 2.3.3 判断 x 是不是对象或者函数
   */
  if (isObject(x) || isFunction(x)) {
    // 防止取值时出错 try  catch
    try {
      // 2.3.3.1 让 x 作为 x.then
      let then = x.then

      if (isFunction(then)) {
        // 2.3.3.3 如果 then 是一个方法，把 x 当作 this 来调用
        // 其中第一个参数为 resolvePromise，第二个参数为 rejectPromise
        then.call(x, (y) => {
          if (called) return
          called = true
          // 防止 y 的返回值还是一个 Promise
          resolutionProcedure(promise2, y, resolve, reject)
        }, (r) => {
          // 失败结果会向下传递
          if (called) return
          called = true
          reject(r)
        })
      } else {
        // 2.3.3.4 如果 then 不是一个函数，用 x 完成 promise
        resolve(x)
      }
    } catch (e) {
      // 2.3.3.2 如果取 x.then 的值时抛出错误 e 则以 e 为据因执行 reject
      if (called) return
      called = true
      reject(e)
    }
  } else {
    // 2.3.4 x 是一个普通的值，直接调用 resolve(x)
    resolve(x)
  }
}

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
        nextTick(() => {
          if (this.state === PENDING) {
            this.state = FULFILLED
            this.value = value
            // 执行所有的回调函数
            this.resolvedCallbacks.forEach(fn => fn())
          }
        })
      }

    // 失败函数
    const reject = (reason) => {
      nextTick(() => {
        if (this.state === PENDING) {
          this.state = REJECTED
          this.reason = reason
          // 执行所有的回调函数
          this.rejectedCallbacks.forEach(fn => fn())
        }
      })
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
   * Promise.prototype.then() 实现
   * then 方法接收两个参数 onFulfilled 和 onFulfilled
   * @param onFulfilled 成功状态的调用
   * @param onRejected  失败状态的调用
   */
  then(onFulfilled, onRejected) {
    // then 中的参数变成可选择，如果没有就默认添加
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : (v) => v
    onRejected = isFunction(onRejected) ? onRejected : (r) => {throw r}

    /**
     * 链式调用需要返回一个新的 promise
     * 在 then 函数中，无论成功还是失败，只要返回了结果就会传到下一个 then 的成功回调
     * 如果出现错误就会传入下一个 then 的失败回调
     * 即：下一个 then 的状态和上一个 then 执行时候状态无关
     * 所以在 then 执行的时候 onFulfilled, onRejected 可能会出现报错，需要捕获错误，并执行失败回调（处理成失败状态）
     */
    const promise2 = new Promise((resolve, reject) => {
      // 成功状态的调用
      if (this.state === FULFILLED) {
        // 如果 x 是个 Promise 需要用异步等待 x 初始化完成
        nextTick(() => {
          try {
            // 为了链式调用，需要获取 onFulfilled 函数执行的返回值，通过 resolve 返回
            const x = onFulfilled(this.value)

            // 通过 resolutionProcedure 函数对 x 的返回值做处理（规范 2.3）
            resolutionProcedure(promise2, x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })

      }

      // 失败状态的调用
      if (this.state === REJECTED) {
        // 如果 x 是个 Promise 需要用异步等待 x 初始化完成
        nextTick(() => {
          try {
            // 为了链式调用，需要获取 onRejected 函数执行的返回值，通过 resolve 返回
            const x = onRejected(this.reason)

            // 通过 resolutionProcedure 函数对 x 的返回值做处理（规范 2.3）
            resolutionProcedure(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }

      /**
       * 当 Promise 状态为等待中（pending）时，大多数是异步情况下
       * 将 onFulfilled 和 onRejected 存入对应的回调队列
       * 到执行到异步的回调函数时，会执行 resolve 或 reject 静态方法，然后循环执行存储的回调队列
       */
      if (this.state === PENDING) {
        // 存入成功回调函数
        this.resolvedCallbacks.push(() => {
          try {
            const x = onFulfilled(this.value)
            // 通过 resolutionProcedure 函数对 x 的返回值做处理（规范 2.3）
            resolutionProcedure(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })

        // 存入失败函数
        this.rejectedCallbacks.push(() => {
          try {
            const x = onRejected(this.reason)
            // 通过 resolutionProcedure 函数对 x 的返回值做处理（规范 2.3）
            resolutionProcedure(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
    })

    return promise2

  }


  /**
   * Promise.prototype.catch() 实现
   * catch 用于指定发生错误时的回调函数，实际就是 .then(null, onRejected) 的别名
   * https://es6.ruanyifeng.com/#docs/promise#Promise-prototype-catch
   */
  catch(cb) {
    return this.then(null, cb)
  }

  /**
   * Promise.prototype.finally() 实现
   * finally 方法用于指定不管 Promise 对象最后状态如何，都会执行的操作
   * 在 finally 后还能继续 then ，并会将值原封不动的传递下去
   * finally 本质上是 then 方法的特例
   * 该方法由 ES2018 引入
   * https://es6.ruanyifeng.com/#docs/promise#Promise-prototype-finally
   */
  finally(cb) {
    return this.then((v) => Promise.resolve(cb()).then(() => v), (e) => Promise.resolve(cb()).then(() => {throw e}))
  }

  /**
   * Promise.resolve() 实现
   * 将现有对象转为 Promise 实例，该实例的状态为 resolved
   * https://es6.ruanyifeng.com/#docs/promise#Promise-resolve
   */
  static resolve(value) {
    if (value instanceof Promise) {
      return value
    }

    return new Promise((resolve, reject) => {
      // 如果参数是一个 thenable 对象
      // thenable 对象指的是具有 then 方法的对象
      if (isObject(value) && isFunction(value.then)) {
        value.then(resolve, reject)
      } else {
        // 如果参数是一个原始值，则返回一个新的 Promise 对象，状态为 resolved
        resolve(value)
      }
    })
  }

  /**
   * Promise.reject() 实现
   * 将现有对象转为 Promise 实例，该实例的状态为 rejected
   * https://es6.ruanyifeng.com/#docs/promise#Promise-reject
   */
  static reject(err) {
    return new Promise((resolve, reject) => {
      reject(err)
    })
  }

  /**
   * Promise.all() 实现
   * 用于将多个 Promise 实例，包装成一个新的 Promise 实例
   * 只有所有的 Promise 状态成功才会成功，如果其中一个 Promise 的状态失败就会失败
   * https://es6.ruanyifeng.com/#docs/promise#Promise-all
   */
  static all(promises) {
    return new Promise((resolve, reject) => {
      if (!isIterator(promises)) {
        reject(new TypeError('参数必须为 Iterator'))
        return
      }

      const result = []

      if (promises.length === 0) {
        resolve(result)
        return
      }

      // 记录当前已成功的 Promise 数量
      let doneNum = 0

      // resolve 验证函数
      function check(i, data) {
        reject[i] = data
        doneNum++

        // 只有成功的 Promise 数量等于传入的数组长度时才调用 resolve
        if (doneNum === promises.length) {
          resolve(result)
          return
        }
      }

      // 异步并行直接 promise
      for (let i = 0; i < promises.length; i++) {
        Promise.resolve(promises[i]).then((v) => {check(i, v)}, (e) => {
          // 如果有一个 promise 失败，就直接 reject
          reject(e)
          return
        })
      }
    })
  }

  /**
   * Promise.race() 实现
   * 用于将多个 Promise 实例，包装成一个新的 Promise 实例
   * 新的 Promise 实例状态会根据最先更改状态的 Promise 而更改状态
   * https://es6.ruanyifeng.com/#docs/promise#Promise-race
   */
  static race(promises) {
    return new Promise((resolve, reject) => {
      if (!isIterator(promises)) {
        reject(new TypeError('参数必须为 Iterator'))
        return
      }

      for (let i = 0; i < promises.length; i++) {
        // 只要有一个 Promise 状态发生改变，就调用其状态对应的回调方法
        Promise.resolve(promises[i]).then(resolve, reject)
      }
    })
  }

  /**
   * Promise.allSettled() 实现
   * 用于将多个 Promise 实例，包装成一个新的 Promise 实例
   * 新的 Promise 实例只有等到所有这些参数实例都返回结果，不管是 resolved 还是 rejected ，包装实例才会结束，一旦结束，状态总是 resolved
   * 和 Promise.all 区别：Promise.all 如果有失败就立即返回 rejected，并不会全部执行
   *
   * 返回的是数组对象
   * 该方法由 ES2020 引入
   * https://es6.ruanyifeng.com/#docs/promise#Promise-allSettled
   */
  static allSettled(promises) {
    return new Promise((resolve, reject) => {
      // 如果不能遍历(不为 Iterator ) 直接 reject, 语法错误
      if (!isIterator(promises)) {
        reject(new TypeError('参数必须为 Iterator'))
        return
      }

      const result = []

      if (promises.length === 0) {
        resolve(result)
        return
      }

      // 记录当前已成功的 Promise 数量
      let doneNum = 0

      // resolve 验证函数
      function check(i, data) {
        reject[i] = data
        doneNum++

        // 只有成功的 Promise 数量等于传入的数组长度时才调用 resolve
        if (doneNum === promises.length) {
          resolve(result)
          return
        }
      }

      for (let i = 0; i < promises.length; i++) {
        Promise.resolve(promises[i]).then(
          (value) => {
            check(i, {
              status: FULFILLED,
              value
            })
          },
          (reason) => {
            check(i, {
              status: REJECTED,
              reason,
            })
          }
        )
      }
    })
  }


  /**
   * Promise.any() 实现
   * 用于将多个 Promise 实例，包装成一个新的 Promise 实例
   * 只要参数实例有一个变成 resolved 状态，包装实例就会变成 resolved 状态；如果所有参数实例都变成 rejected 状态，包装实例就会变成 rejected 状态
   *  和 all 有点相反
   * https://es6.ruanyifeng.com/#docs/promise#Promise-any
   */
  static any(promises) {
    return new Promise((resolve, reject) => {
      // 如果不能遍历(不为 Iterator ) 直接 reject, 语法错误
      if (!isIterator(promises)) {
        reject(new TypeError('参数必须为 Iterator'))
        return
      }

      // 失败的次数
      const rejects = []

      // 记录数量
      let num = 0

      function check(i, data) {
        rejects[i] = data
        num++

        // 只有失败的 promise 数量登入传入数组的长度，调用 regect
        if (num === promises.length) {
          reject(rejects)
        }
      }

      for (let i = 0; i < promises.length; i++) {
        // 如果有一个成功就算成功，失败的记录下来
        Promise.resolve(promises[i].then(
          resolve,
          (r) => {
            check(i, r)
          }
        ))
      }
    })
  }
}


Promise.deferred = function () {
  var result = {}
  result.promise = new Promise(function (resolve, reject) {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}


module.exports = Promise

