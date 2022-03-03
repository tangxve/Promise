# Promise A+ 规范实现

## 文档规范

- [英文文档](https://promisesaplus.com/)
- [中文翻译 - 图灵社区](https://www.ituring.com.cn/article/66566)
- [中文翻译 - 掘金](https://juejin.im/post/5b6161e6f265da0f8145fb72)

## 基本原理

- Promise 是一个类，在执行这个类的时候会传入一个执行器，这个执行器会立即执行
- Promise 会有三种状态
    - Pending 等待
    - Fulfilled 完成
    - Rejected 失败
- 状态只能由 Pending --> Fulfilled 或者 Pending --> Rejected，且一但发生改变便不可二次修改
- Promise 中使用 resolve 和 reject 两个函数来更改状态
- then 方法内部做但事情就是状态判断
    - 如果状态是成功，调用成功回调函数
    - 如果状态是失败，调用失败回调函数

## 功能实现

- [同步调用](/src/easy.js)
- [异步调用](/src/easy-async.js)
- [支持 then 多次调用](/src/easy-many.js)
- [支持链式调用](/src/easy-chain.js)
- [异步链式调用](/src/easy-chain-async.js)
- [Promise A+ 规范实现]()

## 在 Promise 中添加 异步逻辑

主线程代码立即执行， setTimeout 是异步代码，then 会马上执行，

这个时候判断 Promise 状态， 状态是 Pending，然而之前并没有判断等待这个状态

查看例子：

<details><summary>点击查看</summary>

```js
const Promise = require('./src/easy.js')
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('success')
  }, 2000);
})

promise.then(value => {
  console.log('resolve', value)
}, reason => {
  console.log('reject', reason)
})
```

</details>

代码实现：

<details><summary>点击查看</summary>

```js
// resolvedCallbacks 存储成功的函数
this.resolvedCallbacks = null

// rejectedCallbacks 存储失败的函数
this.rejectedCallbacks = null


then(onFulfilled, onRejected)
{
  if (this.state === RESOLVED) {
    // 成功状态的调用
    onFulfilled(this.value)
  }

  if (this.state === REJECTED) {
    // 失败状态的调用
    onRejected(this.reason)
  }

  // === 新增 ===
  // 当 Promise 状态为等待中（pending）时，
  if (this.state === PENDING) {
    // 存入成功函数
    this.resolvedCallbacks = onFulfilled

    // 存入失败函数
    this.rejectedCallbacks = onRejected
  }
}
```

</details>

## then 方法支持多次调用

> Promise 的 then 方法是可以被多次调用的。
>
> 这里如果有三个 then 的调用，如果是同步回调，那么直接返回当前的值就行；
>
> 如果是异步回调，那么保存的成功失败的回调，需要用不同的值保存，因为都互不相同。之前的代码需要改进。


例子：

<details><summary>点击查看</summary>

```js
const Promise = require('/src/easy-async')
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('success')
  }, 2000);
})

promise.then(value => {
  console.log(1)
  console.log('resolve', value)
})

promise.then(value => {
  console.log(2)
  console.log('resolve', value)
})

promise.then(value => {
  console.log(3)
  console.log('resolve', value)
})
```

</details>

目前的代码只能输出：3 resolve success，怎么可以把 1、2 弄丢呢！

代码调整：

1. 储存回调函数调整问数组

<details><summary>点击查看</summary>

```js
// 存储成功的函数
// this.resolvedCallbacks = null
this.resolvedCallbacks = []

// 存储失败的函数
// this.rejectedCallbacks = null
this.rejectedCallbacks = []
```

</details>

2. then 执行的时候 存入到数组

<details><summary>点击查看</summary>

```js
  /**
 * then 方法接收两个参数 onFulfilled 和 onFulfilled
 * @param onFulfilled 成功状态的调用
 * @param onRejected  失败状态的调用
 */
then(onFulfilled, onRejected)
{
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
```

</details>

3. 循环调用成功或失败回调

<details><summary>点击查看</summary>

```js
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

```

</details>

## 四、实现 then 方法的链式调用

1. 链式调用需要返回一个新的 promise
2. 在 then 函数中，无论成功还是失败，只要返回了结果，就会传到下一个 then 的成功回调
3. 如果出现错误就会传入下一个 then 的失败回调
4. 即：下一个 then 的状态和上一个 then 执行时候状态无关
5. 所以在 then 执行的时候 onFulfilled, onRejected 可能会出现报错，需要捕获错误，并执行失败回调（处理成失败状态）

代码实现：

<details><summary>点击查看</summary>

```js
  /**
 * then 方法接收两个参数 onFulfilled 和 onFulfilled
 * @param onFulfilled 成功状态的调用
 * @param onRejected  失败状态的调用
 */
then(onFulfilled, onRejected)
{
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
```

</details>

## then 方法链式调用识别 Promise 是否返回自己

> 如果 then 方法返回的是自己的 Promise 对象，则会发生循环调用


查看例子：

<details><summary>点击查看</summary>

```js
const promise = new Promise((resolve, reject) => {
  resolve(100)
})
const p1 = promise.then(value => {
  console.log(value)
  return p1
})

```

</details>


解决方法：

1. 返回值（x）是一个 Promise 情况下，需要用异步等待 Promise 初始化完成
2. 对 返回值（x） 做一层判断，是否是个 Promise，如果是就执行 x.then, 并将 resolve 作为参数传入

异步方法 采用 `queueMicrotask` 实现

代码实现：

<details><summary>点击查看</summary>

```js
/**
 * 异步工具方法
 */
function nextTick(fn) {
  window.queueMicrotask(fn)
}


then(onFulfilled, onRejected)
{

  return new Promise((resolve, reject) => {
    // 成功状态的调用
    if (this.state === RESOLVED) {
      // 如果 x 是个 Promise 需要用异步等待 x 初始化完成
      nextTick(() => {
        try {
          // 为了链式调用，需要获取 onFulfilled 函数执行的返回值，通过 resolve 返回
          const x = onFulfilled(this.value)

          // 对 x 做一层判断，是否是个 Promise，如果是就执行 x.then, 并将 resolve 作为参数传入
          x.then ? x.then(resolve) : resolve(x)
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

          // 对 x 做一层判断，是否是个 Promise，如果是就执行 x.then, 并将 resolve 作为参数传入
          x.then ? x.then(resolve) : resolve(x)
        } catch (e) {
          reject(e)
        }
      })
    }

    if (this.state === PENDING) {
      // 存入成功回调函数
      this.resolvedCallbacks.push(() => {
        try {
          const x = onFulfilled(this.value)

          // 对 x 做一层判断，是否是个 Promise，如果是就执行 x.then, 并将 resolve 作为参数传入
          x.then ? x.then(resolve) : resolve(x)
        } catch (e) {
          reject(e)
        }
      })

      // 存入失败函数
      this.rejectedCallbacks.push(() => {
        try {
          const x = onFulfilled(this.value)

          // 对 x 做一层判断，是否是个 Promise，如果是就执行 x.then, 并将 resolve 作为参数传入
          x.then ? x.then(resolve) : resolve(x)
        } catch (e) {
          reject(e)
        }
      })
    }
  })
}
```

</details>




