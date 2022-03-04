const Promise = require('../src/easy-chain-async')


new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
  }, 0)
})
  .then(
    (res) => {
      console.log('异步链式调用 1 res ==>', res)
      const x = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('异步链式调用 1 Promise')
        }, 0)
      })

      return x
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

