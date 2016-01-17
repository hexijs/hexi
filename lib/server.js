'use strict'
const express = require('express')
const Remi = require('remi')
const sequencify = require('sequencify')

class Server {
  constructor() {
    this._app = express()
    this._remi = new Remi({
      extensions: [
        require('remi-decorate'),
        require('remi-expose'),
      ],
    })
    this._tasks = []
  }
  connection() {
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
    let tasks = [
      (req, res, next) => {
        req.route = {settings: opts.config}
        next()
      },
    ]
    if (opts.task) {
      opts.task.forEach(taskName => {
        if (!this._tasks[taskName])
          throw new Error(taskName + ' task doesn\'t exist')
      })

      let results = []
      sequencify(this._tasks, opts.task, results)
      tasks.push(...results.map(taskName => this._tasks[taskName].fn))
    }
    tasks.push(opts.handler)
    this._app[opts.method.toLowerCase()](opts.path, tasks)
  }
  start() {
    this._app.listen(3000)
  }
}

module.exports = Server
