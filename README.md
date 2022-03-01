# Promise A+ 规范实现

## 文档规范

- [英文文档](https://promisesaplus.com/)
- [中文翻译 - 图灵社区](https://www.ituring.com.cn/article/66566)
- [中文翻译 - 掘金](https://juejin.im/post/5b6161e6f265da0f8145fb72)

## 基本原理

1. Promise 是一个类，在执行这个类的时候会传入一个执行器，这个执行器会立即执行
2. Promise 会有三种状态
    1. Pending 等待
    2. Fulfilled 完成
    3. Rejected 失败
3. 状态只能由 Pending --> Fulfilled 或者 Pending --> Rejected，且一但发生改变便不可二次修改
4. Promise 中使用 resolve 和 reject 两个函数来更改状态
5. then 方法内部做但事情就是状态判断 
   1. 如果状态是成功，调用成功回调函数
   2. 如果状态是失败，调用失败回调函数

## 功能实现

- 处理同步调用最简易实现
