'use strict';

var winston = require('winston');
var fs = require('fs');
var env = process.env.NODE_ENV;
var moment = require('moment');
var settings = require('../config.json');
var loopback = require('loopback');
var Promise = require('bluebird');
var apiUtils = require('../utils/apiUtils.js');
var rp = require('request-promise');
var WechatPayService = require('../../common/models/apimodel/workspace/internalService/WechatPayService.js');

var startBatchAssignJob = function () {
  let ManagerFacadeAPI = loopback.findModel("ManagerFacadeAPI");
  var later = require('later');
  var sched = later.parse.text('every 30 min');
  var t = later.setInterval(() => {
    console.log("Batch assign transaction jop starting at " + moment().local().format('YYYY-MM-DD HH:mm:ss') + "...");
    return ManagerFacadeAPI.assignTransactionsBatchJob();
  }, sched);
}

var startStatisticsBatchJob = function () {
  let later = require('later');
  let ManagerFacadeAPI = loopback.findModel("ManagerFacadeAPI");
  let basic = { h: [0], m: [30] };  //设置每天凌晨执行
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
  let sched = later.parse.text('on the first day of the month');//at 4:30 am every 1 day of the month  //at 1:36 pm
  later.date.localTime();
  let t = later.setInterval(() => {
    console.log("Statistics Job Started.");
    return ManagerFacadeAPI.statisticsLocationBatchJob();
  }, sched);
}

var getWXAccessTokenBatchJob = function () {
  let later = require('later');
  let wechatPayService = new WechatPayService();
  let UserMicroService = loopback.findModel("UserMicroService");
  let sched = later.parse.text('every 110 mins');
  later.date.localTime();
  let t = later.setInterval(() => {
    console.log("Get wechat access_token at " + moment().local().format('YYYY-MM-DD HH:mm:ss') + ".");
    return wechatPayService.getAccessToken().then(result => {
      console.log(moment().local().format('YYYY-MM-DD HH:mm:ss') + ": " + result.access_token);
      if (result.access_token) {
        global.settings.wxConfig = { access_token: result.access_token };
        console.log(moment().local().format('YYYY-MM-DD HH:mm:ss') + ": " + global.settings.wxConfig.access_token);
      }
    }).then(result => {
      console.log(moment().local().format('YYYY-MM-DD HH:mm:ss') + ": " + result.access_token);
      global.settings.wxConfig = { access_token: result.access_token };
      console.log("getSignature: " + global.settings.wxConfig.access_token + " at " + moment().local().format('YYYY-MM-DD HH:mm:ss'));
      let url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=" + global.settings.wxConfig.access_token + "&type=jsapi";
      let option = {
        method: 'GET',
        url: url
      };
      return rp(option).then(result => {
        result = JSON.parse(result);
        global.setting.wxConfig["jsapi_ticket"] = result.ticket;
        console.log("getJsapi_ticket: " + global.settings.wxConfig.jsapi_ticket + " at " + moment().local().format('YYYY-MM-DD HH:mm:ss'));
        return UserMicroService.SystemAPI_upsertAccessToken({ access_token: global.settings.wxConfig.access_token ? global.settings.wxConfig.access_token : "access_token" });
      });
    })
  }, sched);
}

module.exports = function (app) {
  startBatchAssignJob();
  startStatisticsBatchJob();
  starlocationBatchJob();
  getWXAccessTokenBatchJob();
  let wechatPayService = new WechatPayService();
  let UserMicroService = loopback.findModel("UserMicroService");
  return wechatPayService.getAccessToken().then(result => {
    console.log(moment().local().format('YYYY-MM-DD HH:mm:ss') + ": " + result.access_token);
    global.settings.wxConfig = { access_token: result.access_token };
    console.log("access_token: " + global.settings.wxConfig.access_token + " at " + moment().local().format('YYYY-MM-DD HH:mm:ss'));
    let url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=" + global.settings.wxConfig.access_token + "&type=jsapi";
    let option = {
      method: 'GET',
      url: url
    };
    return rp(option).then(result => {
      result = JSON.parse(result);
      global.settings.wxConfig["jsapi_ticket"] = result.ticket;
      console.log("jsapi_ticket: " + global.settings.wxConfig.jsapi_ticket + " at " + moment().local().format('YYYY-MM-DD HH:mm:ss'));
      return UserMicroService.SystemAPI_upsertAccessToken({ access_token: global.settings.wxConfig.access_token ? global.settings.wxConfig.access_token : "access_token" });
    });
  })
}