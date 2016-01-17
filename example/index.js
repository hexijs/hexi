'use strict'
const hexi = require('../')

let server = new hexi.Server()

server.connection(3000)

server.task('foo', ['bar'], (req, res, next) => {
  console.log('foo')
  next()
})

server.task('bar', (req, res, next) => {
  console.log('bar')
  next()
})

server.route({
  method: 'GET',
  path: '/',
  task: ['foo'],
  handler(req, res) {
    res.send('Hello world!')
  },
})

server.start()
