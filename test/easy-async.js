const Promise = require('../src/easy-async')


new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
  }, 1000)
}).then((res) => {
  console.log('easy-async 1 res ==>', res)
}, (err) => {
  console.log('easy-async 1 err ==>', err)
})
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功')
  }, 1000);
})

promise.then(res => {
  console.log('easy-async 2 res ==>', res)
}, err => {
  console.log('easy-async 2 err ==> ', err)
})

new Promise((resolve, reject) => {
  throw new Error('出错了')
}).then(res => {
  console.log('easy-async 3 res ==>', res)
}, err => {
  console.log('easy-async 3 err ==>', err)
})

