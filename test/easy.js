const Promise = require('../src/easy')


new Promise((resolve, reject) => {
  resolve('成功')
}).then(s => {
  console.log('test 1 res ==>', s)
}, err => {
  console.log('test 1 err ==> ', err)
})

const p1 = new Promise((resolve, reject) => {
  resolve('success')
  reject('err')
})

console.log('promise ==>', p1)

p1.then(s => {
  console.log('test 2 res ==>', s)
}, err => {
  console.log('test 2 err ==>', err)
})

new Promise((resolve, reject) => {
  throw new Error('出错了')
}).then(s => {
  console.log('test 3 res ==>', s)
}, err => {
  console.log('test 3 err ==>', err)
})
