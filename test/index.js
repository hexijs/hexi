'use strict'
const chai = require('chai')
const expect = chai.expect
const hexi = require('..')
const request = require('supertest')
const plugiator = require('plugiator')
const sinon = require('sinon')

chai.use(require('sinon-chai'))

describe('server route', function() {
  let server

  beforeEach(function() {
    server = hexi()
  })

  it('should execute handler', function(done) {
    server.route({
      method: 'GET',
      path: '/foo',
      handler(req, res) {
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should execute listen to all method requests passed', function(done) {
    server.route({
      method: ['GET', 'POST'],
      path: '/foo',
      handler(req, res) {
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', function(err) {
        if (err) return done(err)

        request(server.express)
          .post('/foo')
          .expect(200, 'bar', done)
      })
  })

  it('should execute several handlers', function(done) {
    let handler1 = sinon.spy((req, res, next) => next())

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['task'],
      handler: [
        handler1,
        (req, res) => {
          expect(handler1).to.have.been.calledOnce
          res.send('bar')
        },
      ],
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should pass route options to handler', function(done) {
    server.route({
      method: 'GET',
      path: '/foo',
      handler(req, res) {
        expect(req.route).to.exist
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  describe('pre', function() {
    it('should exec pre hook', function(done) {
      server.route.pre(function(next, opts) {
        opts.config = { foo: 'bar' }
        expect(opts.handler).to.be.instanceof(Array)
        expect(opts.handler.length).to.eq(1)
        next(opts)
      })

      server.route({
        method: 'GET',
        path: '/foo',
        handler(req, res) {
          res.send(req.route.config.foo)
        },
      })

      request(server.express)
        .get('/foo')
        .expect(200, 'bar', done)
    })

    it('should path empty array to route pre hook when no handler passed', function(done) {
      server.route.pre(function(next, opts) {
        expect(opts.handler).to.be.instanceof(Array)
        expect(opts.handler.length).to.eq(0)
        done()
      })

      server.route({
        method: 'GET',
        path: '/foo',
      })
    })
  })
})

describe('server', function() {
  let server

  beforeEach(function() {
    server = hexi()
  })

  it('should have isHexi property', function() {
    expect(server.isHexi).to.be.true
  })

  it('should pass route, register methods to the plugin\'s serve object', function(done) {
    return server.register([
      {
        register: plugiator.anonymous((server, opts) => {
          expect(server.route).to.be.a('function')
          expect(server.register).to.be.a('function')
          done()
        }),
      },
    ])
  })

  it('should start server', function(done) {
    server.connection(5346)

    server.route({
      method: 'GET',
      path: '/foo',
      handler(req, res) {
        res.send('bar')
      },
    })

    return server.start()
      .then(() =>
        request(server.express)
          .get('/foo')
          .expect(200, 'bar', done)
      )
  })

  it('should return error if no connection arguments passed', function(done) {
    server.connection()

    server.start()
      .catch(err => {
        expect(err).to.exist
        done()
      })
  })
})
