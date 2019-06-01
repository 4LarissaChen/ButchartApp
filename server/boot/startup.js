'use strict';

var winston = require('winston');
var fs = require('fs');
var env = process.env.NODE_ENV;
var moment = require('moment');
var settings = require('../config.json');
var loopback = require('loopback');
var Promise = require('bluebird');
var apiUtils = require('../utils/apiUtils.js');

var startBatchAssignJob = function () {
  var UserMicroService = loopback.findModel("UserMicroService");
  var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
  var later = require('later');
  var sched = later.parse.text('every 1 min');
  var t = later.setInterval(() => {
    console.log("Batch assign transaction jop starting...");
    let unassignTrans = [], overviewLog;
    let promiseArray = [], stores = [];
    let resp = {};
    return UserMicroService.TransactionAPI_getUnassignedTransactions().then(result => {
      unassignTrans = result.obj;
      return StatisticsMicroService.StatisticsAPI_getBatchOverView();
    }).then(result => {
      overviewLog = result.obj;
      return UserMicroService.StoreAPI_getAllStores();
    }).then(result => {
      stores = result.obj;
      if (!overviewLog)
        overviewLog = { unassignedTransactionCount: 0 }
      let yushu = overviewLog.unassignedTransactionCount % 10;
      for (let i = 0; i < unassignTrans.length; i++) {
        for (let key in settings.transactionAssignStrategy) {
          let min = settings.transactionAssignStrategy[key][0] * 10;
          let max = settings.transactionAssignStrategy[key][1] * 10;
          if (min < (yushu + i) % 10 <= max) {
            let store = stores.find(s => s.name.indexOf(key) != -1);
            unassignTrans[i].storeId = store._id;
            overviewLog.unassignedTransactionCount++;
            promiseArray.push(UserMicroService.TransactionAPI_updateTransaction({
              transactionId: unassignTrans[i]._id, updateData: unassignTrans[i]
            }));
            break;
          }
        }
      }
      return Promise.all(promiseArray);
    }).then(result => {
      if (!overviewLog._id)
        overviewLog._id = apiUtils.generateShortId("OverViewLog");
      overviewLog.data = moment().local().format('YYYY-MM-DD HH:mm:ss');
      return StatisticsMicroService.StatisticsAPI_updateOverViewLog({ data: overviewLog });
    }).then(() => {
      console.log("Batch assign transaction jop completed.")
      return Promise.resolve();
    });
  }, sched);
}

module.exports = function (app) {
  startBatchAssignJob();
}