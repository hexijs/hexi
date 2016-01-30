'use strict'
const express = require('express')
const remi = require('remi')
const sequencify = require('sequencify')
const magicHook = require('magic-hook')
const promiseResolver = require('promise-resolver')

function extendWithRegister(server) {
  let registrator = remi(server)
  registrator.hook(require('remi-timeout')(5e3))
  registrator.hook(require('remi-runner')())
  registrator.hook(require('remi-dependencies')())
  registrator.hook(require('remi-decorate')())
  registrator.hook(require('remi-expose')())
  registrator.hook(require('remi-realm')())

  server.register = registrator.register
}

module.exports = function() {
  let app = express()
  app.disable('x-powered-by')

  let tasks = []
  let connectionArgs

  let server = {
    express: app,
    connection() {
      connectionArgs = Array.prototype.slice.call(arguments)
    },
    task(name) {
      let fn
      let dep
      if (typeof arguments[1] === 'function') {
        fn = arguments[1]
        dep = []
      } else {
        fn = arguments[2]
        dep = arguments[1]
      }
      tasks[name] = {
        name,
        dep,
        fn,
      }
    },
    route(opts) {
      opts.config = opts.config || {}
      opts.task = opts.task ? [].concat(opts.task) : []

      let runTasks = [
        (req, res, next) => {
          req.route = {settings: opts.config}
          next()
        },
      ]

      if (opts.task.indexOf('default') === -1 &&
        opts.config.detached !== true && tasks['default']) {
        opts.task.unshift('default')
      }

      opts.task.forEach(taskName => {
        if (!tasks[taskName])
          throw new Error(taskName + ' task doesn\'t exist')
      })

      let results = []
      sequencify(tasks, opts.task, results)
      runTasks = runTasks.concat(results
        .map(taskName => tasks[taskName].fn)
        .filter(fn => typeof fn === 'function')
      )
      runTasks.push(opts.handler)

      let methods = [].concat(opts.method)
      methods
        .map(method => method.toLowerCase())
        .forEach(method => app[method].apply(app, [opts.path].concat(runTasks)))
    },
    start(cb) {
      let deferred = promiseResolver.defer(cb)
      if (connectionArgs) {
        app.listen.apply(app, connectionArgs.concat([deferred.cb]))
        return deferred.promise
      }
      deferred.cb(new Error('no connection arguments were passed'))
      return deferred.promise
    },
  }

  extendWithRegister(server)

  magicHook(server, ['route'])

  return server
}
