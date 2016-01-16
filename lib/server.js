'use strict'
const express = require('express')
const Remi = require('remi')

function Server() {
  this._app = express()
  this._remi = new Remi({
    extensions: [
      require('remi-decorate'),
      require('remi-expose'),
    ],
  })
}

Server.prototype.connection = function() {

}

Server.prototype.register = function(plugins, cb) {
  let args = [this, plugins, {}]
  if (cb) args.push(cb)

  return this._remi.register.apply(this._remi, args)
}

Server.prototype.route = function(opts) {
  this._app[opts.method.toLowerCase()](opts.path, opts.handler)
}

Server.prototype.start = function() {
  this._app.listen(3000)
}

module.exports = Server
