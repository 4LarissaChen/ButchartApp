'use strict';
var Promise = require('bluebird');
var loopback = require('loopback');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var nodeUtil = require('util');
var moment = require('moment');


exports.getFlorist = function (floristId, storeId) {
  var OrderMicroService = loopback.findModel("OrderMicroService");
  var UserMicroService = loopback.findModel("UserMicroService");
  let resp = [];
  return OrderMicroService.FloristAPI_getFlorist({ floristId: floristId, storeId: storeId }).then(result => {
    if (!result.obj.length)
      return UserMicroService.UserAPI_getUserInfo({ userId: floristId }).then(result => {
        resp = result.obj;
        return Promise.resolve(resp);
      })
    else
      return Promise.map(result.obj, store => {
        return Promise.map(store.includeFlorists, floristId => {
          return UserMicroService.UserAPI_getUserInfo({ userId: floristId });
        }).then(result => {
          if (result.length != 0)
            store.includeFlorists = result.map(r => r.obj[0]);
          resp.push(store);
          return Promise.resolve();
        })
      }).then(() => resp);
  });
}