var logger = require('./Winston');
var moment = require('moment');

module.exports = function () {
  return function logRequest(req, res, next) {
    logger.info('API Request %s %s Start in Time %s', req.method, req.url, moment().local().format('YYYY-MM-DD HH:mm:ss.sss'));
    res.once('finish', function () {
      logger.info('API Request %s %s Complete in Time %s', req.method, req.originalUrl, moment().local().format('YYYY-MM-DD HH:mm:ss.sss'));
    });
    next();
  };
};