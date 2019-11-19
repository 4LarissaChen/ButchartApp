var logger = require('./Winston');
var moment = require('moment');

module.exports = function () {
  return function logError(err, req, res, next) {
    logger.error('ERROR', req.url, err);
    logger.info('API Request %s %s Happen Error in Time %s', req.method, req.url, moment().local().format('YYYY-MM-DD HH:mm:ss.sss'));
    next(err);
  };
};