'use strict'
module.exports = hexi

const remi = require('remi')
const hook = require('magic-hook')

function hexi (app) {
  if (!app) throw new Error('app is required')

  app.disable('x-powered-by')

  const route = hook(opts => {
    const firstMiddleware = (req, res, next) => {
      req.route = opts
      next()
    }

    const middlewares = [firstMiddleware]
      .concat(opts.pre)
      .concat(opts.handler || [])

    const methods = [].concat(opts.method)
    ;[].concat(opts.path).forEach(path =>
      methods
        .map(method => method.toLowerCase())
        .forEach(method => app[method].apply(app, [path].concat(middlewares)))
    )
  })

  route.pre((next, opts) => {
    opts.config = opts.config || {}
    opts.pre = opts.pre || []
    opts.pre = [].concat(opts.pre)
    next(opts)
  })

  const server = {
    isHexi: true,
    express: app,
    route,
  }

  server.register = createRegister(server)

  return server
}

function createRegister (server) {
  const registrator = remi(server)
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
