// const Promise = require('../src/promise')
const promises = [
  new Promise((resolve) => {
    resolve(1)
    console.log(111)
  }),
  new Promise((resolve) => {
    resolve(2)
    return
    console.log(222)
  }),
  new Promise((resolve) => {
    resolve(3)
    console.log(333)
  })
]

Promise.race(promises).then(v => {
  console.log(v)
})

