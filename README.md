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
- [支持 then 多次调用]()

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

### 代码实现：

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




