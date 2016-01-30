'use strict'
const hexi = require('..')

let server = hexi()

server.connection(3000)

server.task('foo', ['bar'], (req, res, next) => {
  console.log('foo')
  console.log(req.route.settings.qax)
  next()
})

server.task('bar', (req, res, next) => {
  console.log('bar')
  next()
})

server.route({
  method: 'GET',
  path: '/',
  config: {
    qax: 'qax',
  },
  task: ['foo'],
  handler(req, res) {
    res.send('Hello world!')
  },
})

server.start()
