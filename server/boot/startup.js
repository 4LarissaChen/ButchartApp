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
  let ManagerFacadeAPI = loopback.findModel("ManagerFacadeAPI");
  var later = require('later');
  var sched = later.parse.text('every 5 min');
  var t = later.setInterval(() => {
    console.log("Batch assign transaction jop starting...");
    return ManagerFacadeAPI.assignTransactionsBatchJob();
  }, sched);
}

var startStatisticsBatchJob = function () {
  let later = require('later');
  let ManagerFacadeAPI = loopback.findModel("ManagerFacadeAPI");
  let basic = { h: [23], m: [3] };  //设置每天凌晨执行
  let composite = [
    basic
  ];
  let sched = {
    schedules: composite
  };
  later.date.localTime();
  let t = later.setInterval(() => {
    console.log("Statistics Job Started.");
    return ManagerFacadeAPI.statisticsBatchJob();
  }, sched);
}

var starlocationBatchJob = function () {
  let later = require('later');
  let ManagerFacadeAPI = loopback.findModel("ManagerFacadeAPI");
  let sched = later.parse.text('at 9:16 pm every day');//at 4:30 am every 1 day of the month
  later.date.localTime();
  let t = later.setInterval(() => {
    console.log("Statistics Job Started.");
    return ManagerFacadeAPI.statisticsLocationBatchJob();
  }, sched);
}

module.exports = function (app) {
  //startBatchAssignJob();
  //startStatisticsBatchJob();
  //starlocationBatchJob();
}