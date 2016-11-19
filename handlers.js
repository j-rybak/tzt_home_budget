function errorHandler(message, code, next){
    var err = new Error(message);
    err.status = code;
    next(err);
}

var handlers = {
    error : errorHandler
}

module.exports = handlers;