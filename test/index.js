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

  it('should execute task', function(done) {
    let task = sinon.spy((req, res, next) => next())
    server.task('task', task)

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['task'],
      handler(req, res) {
        expect(task).to.have.been.calledOnce
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should always pass settings to task', function(done) {
    let task = sinon.spy((req, res, next) => {
      expect(req.route.settings).to.exist
      next()
    })
    server.task('task', task)

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['task'],
      handler(req, res) {
        expect(task).to.have.been.calledOnce
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should execute task and default task', function(done) {
    let defaultTask = sinon.spy((req, res, next) => next())
    server.task('default', defaultTask)

    let task = sinon.spy((req, res, next) => next())
    server.task('task', task)

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['task'],
      handler(req, res) {
        expect(defaultTask).to.have.been.calledBefore(task)
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should execute default task when none specified', function(done) {
    let defaultTask = sinon.spy((req, res, next) => next())
    server.task('default', defaultTask)

    server.route({
      method: 'GET',
      path: '/foo',
      handler(req, res) {
        expect(defaultTask).to.have.been.calledOnce
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should not execute default task when detached passed', function(done) {
    let defaultTask = sinon.spy((req, res, next) => next())
    server.task('default', defaultTask)

    let task = sinon.spy((req, res, next) => next())
    server.task('task', task)

    server.route({
      method: 'GET',
      path: '/foo',
      config: {
        detached: true,
      },
      task: 'task',
      handler(req, res) {
        expect(defaultTask).to.have.not.been.called
        expect(task).to.have.been.calledOnce
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should execute several dependent tasks', function(done) {
    let mainTask = sinon.spy((req, res, next) => next())
    server.task('main', ['dependency'], mainTask)

    let dependencyTask = sinon.spy((req, res, next) => next())
    server.task('dependency', dependencyTask)

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['main'],
      handler(req, res) {
        expect(dependencyTask).to.have.been.calledBefore(mainTask)
        res.send('bar')
      },
    })

    request(server.express)
      .get('/foo')
      .expect(200, 'bar', done)
  })

  it('should execute several dependent tasks. One of the task is just a group', function(done) {
    server.task('main', ['dependency'])

    let dependencyTask = sinon.spy((req, res, next) => next())
    server.task('dependency', dependencyTask)

    server.route({
      method: 'GET',
      path: '/foo',
      task: ['main'],
      handler(req, res) {
        expect(dependencyTask).to.have.been.calledOnce
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

  describe('pre', function() {
    it('should exec pre hook', function(done) {
      server.route.pre(function(next, opts) {
        opts.config = { foo: 'bar' }
        next(opts)
      })

      server.route({
        method: 'GET',
        path: '/foo',
        handler(req, res) {
          res.send(req.route.settings.foo)
        },
      })

      request(server.express)
        .get('/foo')
        .expect(200, 'bar', done)
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
})
