import Promise from 'src/promise'

Promise.deferred = function () {
  var result = {}
  result.promise = new Promise(function (resolve, reject) {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}

module.exports = Promise
