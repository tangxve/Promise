const Promise = require('../src/easy-many')

const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
  }, 1000);
})

promise.then(res => {
  console.log('then 1')
  console.log('then 多次调用 1 res ==>', res)
}, err => {
  console.log('then 多次调用 1 err ==> ', err)
})

promise.then(res => {
  console.log('then 2')
  console.log('then 多次调用 1 res ==>', res)
}, err => {
  console.log('then 多次调用 1 err ==> ', err)
})

promise.then(res => {
  console.log('then 3')
  console.log('then 多次调用 2 res ==>', res)
}, err => {
  console.log('then 多次调用 2 err ==> ', err)
})

new Promise((resolve, reject) => {
  throw new Error('出错了')
}).then(res => {
  console.log('then 多次调用 3 res ==>', res)
}, err => {
  console.log('then 多次调用 3 err ==>', err)
})
