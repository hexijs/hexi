'use strict'
const express = require('express')
const Remi = require('remi')

function Server() {
  this._app = express()
}

Server.prototype.connection = function() {

}

Server.prototype.route = function(opts) {
  this._app[opts.method.toLowerCase()](opts.path, opts.handler)
}

Server.prototype.start = function() {
  this._app.listen(3000)
}

module.exports = Server
