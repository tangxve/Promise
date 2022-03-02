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

- [处理同步调用](/src/easy.js)
- [处理异步调用](/src/easy-async.js)

## 在 Promise 中添加 异步逻辑

```js
const Promise = require('./Promise')
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

主线程代码立即执行， setTimeout 是异步代码，then 会马上执行，

这个时候判断 Promise 状态， 状态是 Pending，然而之前并没有判断等待这个状态
