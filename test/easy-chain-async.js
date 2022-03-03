const Promise = require('../src/easy-chain-async')
console.log(new Promise())
// new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('成功')
//   }, 0)
// })
//   .then((res) => {
//     console.log('异步链式调用 1 res ==>', res)
//     throw new Error('异步链式调用 1 出错')
//   }, (err) => {
//     console.log('异步链式调用 1 err ==>', err)
//   })
//   .then((res) => {
//     console.log('异步链式调用 2 res ==>', res)
//   }, (err) => {
//     console.log('异步链式调用 2 err ==>', err)
//   })

new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
  }, 0)
})
  .then(
    (res) => {
      console.log('异步链式调用 1 res ==>', res)
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('异步链式调用 1 Promise')
        }, 0)
      })
    },
    (err) => {
      console.log('异步链式调用 1 err ==>', err)
    })
  .then(
    (res) => {
      console.log('异步链式调用 2 res ==>', res)
      throw new Error('异步链式调用 2 出错')
    },
    (err) => {
      console.log('异步链式调用 2 err ==>', err)
    })
  .then(
    (res) => {
      console.log('异步链式调用 3 res ==>', res)
    },
    (err) => {
      console.log('异步链式调用 3 err ==>', err)
    })

