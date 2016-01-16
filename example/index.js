'use strict'
const hexi = require('../')

let server = new hexi.Server()

server.connection(3000)

server.route({
  method: 'GET',
  path: '/',
  handler(req, res) {
    res.send('Hello world!')
  },
})

server.start()
