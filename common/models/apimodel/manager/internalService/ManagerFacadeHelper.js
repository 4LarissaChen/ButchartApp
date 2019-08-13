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

exports.getFlorist = function (userId, storeId) {
  var UserMicroService = loopback.findModel("UserMicroService");
  var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
  let store, florists;
  return UserMicroService.StoreAPI_getStoreByManager(userId).then(result => {
    store = result.obj;
    return UserMicroService.FloristAPI_getFloristList();
  }).then(result => {
    florists = result.obj;
    let resp = [];
    store.florists.forEach(floristId => {
      let florist = florists.find(f => f.userId == floristId);
      if (florist)
        resp.push(florist);
    });
    return resp;
  })
}