'use strict'
const express = require('express')
const Remi = require('remi')
const sequencify = require('sequencify')
const magicHook = require('magic-hook')
const promiseResolver = require('promise-resolver')

class Server {
  constructor() {
    this._express = express()
    this._express.disable('x-powered-by')

    this._remi = new Remi({
      extensions: [
        require('remi-decorate'),
        require('remi-expose'),
        require('remi-realm'),
        (remi, opts) => {
          remi.pre('createPlugin', (next, target, plugin) => {
            target.route = this.route
            target.task = this.task
            target.register = this.register
            target.express = this.express
            next(target, plugin)
          })
        },
      ],
    })
    this._tasks = []

    magicHook(this, ['route'])
  }
  get express() {
    return this._express
  }
  connection() {
    this._connectionArgs = Array.prototype.slice.call(arguments)
  }
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
    this._tasks[name] = {
      name,
      dep,
      fn,
    }
  }
  register(plugins, cb) {
    let args = [this, plugins, {}]
    if (cb) args.push(cb)

    return this._remi.register.apply(this._remi, args)
  }
  route(opts) {
    opts.config = opts.config || {}
    opts.task = opts.task ? [].concat(opts.task) : []

    let tasks = [
      (req, res, next) => {
        req.route = {settings: opts.config}
        next()
      },
    ]

    if (opts.task.indexOf('default') === -1 &&
      opts.config.detached !== true && this._tasks['default']) {
      opts.task.unshift('default')
    }

    opts.task.forEach(taskName => {
      if (!this._tasks[taskName])
        throw new Error(taskName + ' task doesn\'t exist')
    })

    let results = []
    sequencify(this._tasks, opts.task, results)
    tasks = tasks.concat(results
      .map(taskName => this._tasks[taskName].fn)
      .filter(fn => typeof fn === 'function')
    )
    tasks.push(opts.handler)

    let methods = [].concat(opts.method)
    methods
      .map(method => method.toLowerCase())
      .forEach(method => this.express[method].apply(this.express, [opts.path].concat(tasks)))
  }
  start(cb) {
    let deferred = promiseResolver.defer(cb)
    if (this._connectionArgs) {
      this.express.listen.apply(this.express, this._connectionArgs.concat([deferred.cb]))
      return deferred.promise
    }
    deferred.cb(new Error('no connection arguments were passed'))
    return deferred.promise
  }
}

module.exports = Server
