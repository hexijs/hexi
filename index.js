'use strict'
const express = require('express')
const remi = require('remi')
const hook = require('magic-hook')
const promiseResolver = require('promise-resolver')

const slice = Array.prototype.slice

function createRegister(server) {
  let registrator = remi(server)
  registrator.hook(
    require('remi-timeout')(5e3),
    require('remi-runner')(),
    require('remi-dependencies')(),
    require('remi-decorate')(),
    require('remi-expose')(),
    require('remi-realm')()
  )

  return registrator.register
}

module.exports = function() {
  let app = express()
  app.disable('x-powered-by')

  let connectionArgs

  let server = {
    isHexi: true,
    express: app,
    connection() {
      connectionArgs = slice.call(arguments)
    },
    route: hook(opts => {
      opts.config = opts.config || {}

      let middlewares = [
        (req, res, next) => {
          req.route = { settings: opts.config }
          next()
        },
      ].concat(opts.handler)

      let methods = [].concat(opts.method)
      methods
        .map(method => method.toLowerCase())
        .forEach(method => app[method].apply(app, [opts.path].concat(middlewares)))
    }),
    start(cb) {
      let deferred = promiseResolver.defer(cb)
      if (connectionArgs && connectionArgs.length) {
        app.listen.apply(app, connectionArgs.concat([deferred.cb]))
        return deferred.promise
      }
      deferred.cb(new Error('no connection arguments were passed'))
      return deferred.promise
    },
  }

  server.register = createRegister(server)

  return server
}
