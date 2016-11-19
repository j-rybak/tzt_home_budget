var express = require('express');
var router = express.Router();

var Redis = require('ioredis');
var redis= new Redis({
    port: 11138,          // Redis port
    host: 'pub-redis-11138.eu-central-1-1.1.ec2.redislabs.com',   // Redis host
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    password: 'P5dGu5g4DFlCn68L',
    db: 0
});

var constants = require('../constants');
var handlers = require('../handlers');

/* GET users listing. */
router.get('/', function (req, res, next) {
    //GET "+constants.PURCHASE+"*->id"
    redis.lrange(constants.LAST_PURCHASES, 0, 2,function (error,reply) {
        if(error){
            handlers.error(error,500,next)
        }
        else{
            commands = [];
            reply.forEach(function(id){
                commands.push(['hget',constants.PURCHASE+id,'name'])
            });
            redis.pipeline(commands).exec().then(function(pipelineReply){
                var purchases = [];
                pipelineReply.forEach(function(purchase){
                    purchases.push(purchase[1])
                });
                res.render('pages/budget', {title: 'Budżet', key: "budget", lastPurchases: purchases});
            }).catch(function (error) {
                handlers.error(error,500,next)
            });
        }

    })
});

router.get('/categories', function (req, res, next) {
    function onExist(){
        redis.sort(constants.CATEGORIES,"ALPHA").then(function (reply) {
            res.render('pages/categories', {title: 'Kategorie', categories: reply, key: "budget"});
        }).catch(function (error) {
            handlers.error(error,500,next)
        });
    }

    function onNotExist(){
        res.render('pages/categories', {title: 'Kategorie', categories: [], key: "budget"});
    }
    redis.exists(constants.CATEGORIES).then(function(reply){
        if(reply==1){
            onExist();
        }else{
            onNotExist();
        }
    }).catch(function (error) {
        handlers.error(error,500,next)
    });



});

router.get('/categories/add', function (req, res, next) {

    res.render('forms/category_edit', {title: 'Kategorie', key: "budget"});

});

router.post('/categories/add', function (req, res, next) {
    var category = req.body.category;
    redis.sadd(constants.CATEGORIES,category).then(function(reply){
        res.redirect('/budget/categories/');
    }).catch(function (error) {
        handlers.error(error,500,next)
    });
});

router.delete('/categories/:category', function (req, res, next) {
    var category = req.params.category;
    redis.srem(constants.CATEGORIES,category).then(function(reply){
        res.json({value: reply});
    }).catch(function (error) {
        handlers.error(error,500,next)
    });
});




router.get('/purchases', function (req, res, next) {
    var commands = [];
    redis.lrange(constants.LAST_PURCHASES, 0, -1 ,function (error,reply) {
        if(error){
            handlers.error(error,500,next)
        }
        else{
            reply.forEach(function(key){
                commands.push(['hgetall',constants.PURCHASE+key])
            });
            redis.pipeline(commands).exec().then(function(pipelineReply){
                var purchases = [];
                pipelineReply.forEach(function(purchase){
                    purchases.push(purchase[1])
                });
                res.render('pages/purchases', {title: 'Zakupy', key: "budget", purchases:purchases});
            }).catch(function (error) {
                handlers.error(error,500,next)
            });
        }

    })
});

router.get('/purchases/add', function (req, res, next) {
    function onExist(){
        redis.sort(constants.CATEGORIES,"ALPHA").then(function (reply) {
            res.render('forms/purchase_edit', {title: 'Zakupy', key: "budget", categories: reply, purchase:{name:""}});
        }).catch(function (error) {
            handlers.error(error,500,next)
        });
    }

    function onNotExist(){
        res.render('forms/purchase_edit', {title: 'Zakupy', key: "budget", categories: []});
    }
    redis.exists(constants.CATEGORIES).then(function(reply){
        if(reply==1){
            onExist();
        }else{
            onNotExist();
        }
    }).catch(function (error) {
        handlers.error(error,500,next)
    });


});

router.post('/purchases/add', function (req, res, next) {
    var purchase = req.body;
    var timestamp = Math.round(new Date().getTime()/1000);
    purchase.id = timestamp;

    redis.pipeline()
        .hmset(constants.PURCHASE+timestamp,purchase)
        .lpush(constants.LAST_PURCHASES,purchase.id)
        .exec()
    .then(function(reply){
        res.redirect('/budget/purchases/');
    }).catch(function (error) {
        handlers.error(error,500,next)
    });
});

router.delete('/purchases/:id', function (req, res, next) {
    var id= req.params.id;
    redis.pipeline()
        .del(constants.PURCHASE+id)
        .lrem(constants.LAST_PURCHASES,1,id)
        .exec()
    .then(function(reply){
        res.json({value: reply});
    }).catch(function (error) {
        handlers.error(error,500,next)
    });
});

router.get('/purchases/:id', function (req, res, next) {
    function onExist(){
        redis.sort(constants.CATEGORIES,"ALPHA").then(function (categories) {
            var id= req.params.id;
            redis.hgetall(constants.PURCHASE+id).then(function(purchase){
                if(Object.keys(purchase).length){
                    res.render('forms/purchase_edit', {title: 'Zakupy', key: "budget", categories: categories, purchase:purchase});
                }
                else{
                    handlers.error("Not found",404,next)
                }
            }).catch(function (error) {
                handlers.error(error,500,next)
            });

        }).catch(function (error) {
            handlers.error(error,500,next)
        });
    }

    function onNotExist(){
        res.render('forms/purchase_edit', {title: 'Zakupy', key: "budget", categories: []});
    }
    redis.exists(constants.CATEGORIES).then(function(reply){
        if(reply==1){
            onExist();
        }else{
            onNotExist();
        }
    }).catch(function (error) {
        handlers.error(error,500,next)
    });

});

router.post('/purchases/:id', function (req, res, next) {
    var id = req.params.id;
    var purchase = req.body;
    function onExist(){
        redis.hmset(constants.PURCHASE+id,purchase)
            .then(function(reply){
                res.redirect('/budget/purchases/');
            }).catch(function (error) {
                handlers.error(error,500,next)
        });
    }
    function onNotExist(){
        handlers.error("Not found",404,next)
    }
    redis.exists(constants.PURCHASE+id).then(function(reply){
        if(reply==1){
            onExist();
        }else{
            onNotExist();
        }
    }).catch(function (error) {
        handlers.error(error,500,next)
    });


});

module.exports = router;
