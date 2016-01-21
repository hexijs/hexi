'use strict'
const expect = require('chai').expect
const Server = require('../lib/server')
const request = require('supertest')
const plugiator = require('plugiator')

describe('server route', function() {
  let server

  beforeEach(function() {
    server = new Server()
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

  it('should execute task', function(done) {
    server.task('task', (req, res, next) => {
      req.task = 1
      next()
    })

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['task'],
      handler(req, res) {
        expect(req.task).to.eq(1)
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should execute severak dependent tasks', function(done) {
    server.task('main', ['depndency'], (req, res, next) => {
      expect(req.dep).to.eq(1)
      req.main = 1
      next()
    })

    server.task('depndency', (req, res, next) => {
      req.dep = 1
      next()
    })

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['main'],
      handler(req, res) {
        expect(req.main).to.eq(1)
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should throw error if required task doesn\'t exist', function() {
    expect(() =>
      server.route({
        method: 'GET',
        path: '/foo',
        task: ['does-not-exist'],
        handler(req, res) {},
      })
    ).to.throw(Error, 'does-not-exist task doesn\'t exist')
  })
})

describe('Server', function() {
  let server

  beforeEach(function() {
    server = new Server()
  })

  it('should pass route, task methods to the plugin\'s serve object', function(done) {
    return server.register([
      {
        register: plugiator.anonymous((server, opts) => {
          expect(server.route).to.be.a('function')
          expect(server.task).to.be.a('function')
          expect(server.register).to.be.a('function')
          done()
        }),
      },
    ])
  })
})
