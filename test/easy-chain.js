const Promise = require('../src/easy-chain')

new Promise((resolve, reject) => {
  resolve('成功')
})
  .then(
    (res) => {
      console.log('链式调用 1 res ==>', res)
      throw new Error('链式调用 1 出错')
    },
    (err) => {
      console.log('链式调用 1 err ==>', err)
    })
  .then(
    (res) => {
      console.log('链式调用 2 res ==>', res)
      return 2
    },
    (err) => {
      console.log('链式调用 2 err ==>', err)
      return 222
    })
  .then(
    (res) => {
      console.log('链式调用 3 res ==>', res)
    },
    (err) => {
      console.log('链式调用 3 err ==>', err)
    })

