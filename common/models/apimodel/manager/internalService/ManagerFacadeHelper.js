'use strict';
var Promise = require('bluebird');
var loopback = require('loopback');
var apiUtils = require('../../../../../server/utils/apiUtils.js');
var nodeUtil = require('util');
var moment = require('moment');

exports.scheduleFlorists = function (date) {
  var UserMicroService = loopback.findModel("UserMicroService");
  var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
  let schedule, stores;
  return StatisticsMicroService.StatisticsAPI_getBatchOverViewLog().then(result => {
    schedule = result.obj.schedule;
    return UserMicroService.StoreAPI_getAllStores();
  }).then(result => {
    stores = result.obj;
    let weekday = moment(date).local().weekday().toString();
    return Promise.map(stores, store => {
      store.florists = schedule[store._id][weekday];
      return UserMicroService.StoreAPI_updateStore({ storeId: store._id, updateData: store });
    })
  }).catch(err => {
    throw err;
  })
}

exports.getFlorist = function (userId) {
  var UserMicroService = loopback.findModel("UserMicroService");
  return UserMicroService.FloristAPI_getFloristList().then(result => {
    return Promise.map(result.obj, florist => {
      return UserMicroService.UserAPI_getUserInfo({ userId: florist.userId }).then(result => {
        result.obj.florist = florist;
        return result.obj;
      });
    });
  }).then(result => {
    return Promise.map(result, florist => {
      return UserMicroService.AuthorizationAPI_getButchartUserRoles({ userId: florist.florist.userId }).then(result => {
        if (result.obj.indexOf("Admin") != -1) {
          florist.role = "Admin";
        } else if (result.obj.indexOf("Manager") != -1) {
          florist.role = "Manager";
        } else {
          florist.role = "Florist";
        }
        return florist;
      });
    });
  });
}