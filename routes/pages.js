var express = require('express');
var router = express.Router();

var constants = require('../constants');
var Redis = require('ioredis');
var redis= new Redis({
  port: 11138,          // Redis port
  host: 'pub-redis-11138.eu-central-1-1.1.ec2.redislabs.com',   // Redis host
  family: 4,           // 4 (IPv4) or 6 (IPv6)
  password: 'P5dGu5g4DFlCn68L',
  db: 0
});

var handlers = require('../handlers')


/* GET home page. */
router.get('/', function(req, res, next) {
  redis.get(constants.PAGE_HOME).then(function (reply) {
    res.render('pages/default', { title: 'Strona główna', content: reply, key: constants.PAGE_HOME});
  })
  .catch(function(error){
    handlers.error(error,500,next)
  });
});

router.get('/about', function(req, res, next) {

  redis.get(constants.PAGE_ABOUT).then(function (reply) {
        res.render('pages/default', { title: 'O projekcie', content: reply, key: constants.PAGE_ABOUT});
      })
      .catch(function(error){
        handlers.error(error,500,next)
      });
});


router.get('/page_editor/:name', function(req, res, next) {
  var key = req.params.name;
  if(constants.PAGES.indexOf(key)!= -1){
    redis.get(key).then(function (reply) {
      res.render('forms/page_content_edit', { title: 'Edycja strony '+key, key:key, value: reply});
    })
    .catch(function(error){
      handlers.error(error,500,next)
    });
  }
  else{
    handlers.error('Not found',404,next)
  }

});

router.post('/page_editor/:name/update', function(req, res, next) {
  var key = req.params.name;
  if(constants.PAGES.indexOf(key)!= -1) {
    redis.set(key, req.body[key]).then(function (reply) {
          res.json({value: reply});
        })
        .catch(function(error){
          res.json({value:'error'})
        });
  }
  else{
    handlers.error('Not found',404,next)
  }
});

module.exports = router;
