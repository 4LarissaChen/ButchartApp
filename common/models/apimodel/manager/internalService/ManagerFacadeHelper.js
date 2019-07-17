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
  })
}