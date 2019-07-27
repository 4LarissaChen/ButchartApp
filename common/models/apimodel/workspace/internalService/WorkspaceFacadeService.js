'use strict'
var app = require('../../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');
var loopback = require('loopback');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var errorConstants = require('../../../../../server/constants/errorConstants.js');

class WorkspaceFacadeService {
  getFlorists() {
    var UserMicroService = loopback.findModel("UserMicroService");
    return UserMicroService.FloristAPI_getFloristList().then(result => {
      return Promise.map(result.obj, florist => {
        return UserMicroService.UserAPI_getUserInfo({ userId: florist.userId }).then(result => {
          result.obj.florist = florist;
          return result.obj;
        });
      });
    })
  }
}

module.exports = WorkspaceFacadeService;