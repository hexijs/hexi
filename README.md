# hexi

A hapi skin for express

[![Dependency Status](https://david-dm.org/hexijs/hexi/status.svg?style=flat)](https://david-dm.org/hexijs/hexi)
[![Build Status](https://travis-ci.org/hexijs/hexi.svg?branch=master)](https://travis-ci.org/hexijs/hexi)
[![npm version](https://badge.fury.io/js/hexi.svg)](http://badge.fury.io/js/hexi)
[![Coverage Status](https://coveralls.io/repos/hexijs/hexi/badge.svg?branch=master&service=github)](https://coveralls.io/github/hexijs/hexi?branch=master)


## Motivation

[hapi](http://hapijs.com/) is a great web framework that allows to write well structured servers. However,
it has far less plugins and extensions than [express](http://expressjs.com/) ([Node.js Framework Comparison: Express vs. Koa vs. Hapi](http://bit.ly/1LAZzBP)).
Hexi allows to write a web framework that has the well structured skeleton of a hapi server but uses express under the hood. As a consequence, a hexi app has
the great structure of a hapi server and the wide variety of express middlewares available on npm.


## Installation

```
npm install --save hexi
```


## Basic Usage

``` js
// server.js
'use strict'
const express = require('express')
const hexi = require('hexi')

const app = express()
const server = hexi(app)

server.register([
  {
    register: require('hexi-default'),
  },
  {
    register: require('./hello-world-controller'),
  }
])
.then(() => {
  app.listen(8000)
})

// hello-world-controller.js
'use strict'
module.exports = (server, opts) => {
  server.route({
    method: 'GET',
    path: '/',
    handler (req, res) {
      res.send('Hello world!')
    },
  })
}
```

For samples of advanced usage see the hexi version of the [hackathon starter](https://github.com/hexijs/hackathon-starter).


## License

MIT © [Zoltan Kochan](https://www.kochan.io)
