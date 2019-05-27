
'use strict'
var app = require('../../../../server/server.js');
var loopback = require('loopback');
var nodeUtil = require('util');
var moment = require('moment');
var Promise = require('bluebird');
var errorConstant = require('../../../../server/constants/errorConstants.js');
var ManagerFacadeHelper = require('./internalService/ManagerFacadeHelper.js');

var apiUtils = require('../../../../server/utils/apiUtils.js');

module.exports = function (ManagerFacadeAPI) {
  apiUtils.disableRelatedModelRemoteMethod(ManagerFacadeAPI);

  ManagerFacadeAPI.remoteMethod('batchCreateFlorist', {
    description: "Batch create florist accounts.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "Admin user id", http: { source: 'path' } },
    { arg: 'floristIds', type: 'string', required: true, description: "Florist Ids", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/manager/user/:userId/tel/batchCreateFlorist', verb: 'post', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.batchCreateFlorist = function (userId, floristIds, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    Promise.map(floristIds, floristId => {
      return UserMicroService.UserAPI_getUserInfo({userId: floristId}).then(result => result.obj[0]);
    }).then(result => {
      
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('bindFloristsToStore', {
    description: "Create florist by userId.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'storeId', type: 'string', required: true, description: "Order Id.", http: { source: 'path' } },
    { arg: 'floristList', type: ['string'], required: true, description: "Florist Ids.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/user/:userId/store/:storeId/bindFloristsToStore', verb: 'post', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.bindFloristsToStore = function (userId, storeId, floristList, cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let floristIds = [];
    let unknowIds = [];
    Promise.map(floristList, florist => {
      return UserMicroService.UserAPI_getUserInfo({ userId: florist });
    }).then(result => {
      floristIds = result.filter(r => {
        if (r.obj[0])
          return r.obj[0]._id
      }).map(node => node.obj[0]._id);
      if (floristIds.length != floristList.length) {
        floristList.forEach(florist => {
          if (floristIds.indexOf(florist) == -1)
            unknowIds.push(florist);
        });
      }
      if (unknowIds.length > 0)
        throw apiUtils.build500Error(nodeUtil.format(errorConstant.ERROR_NAME_INVALID_INPUT_PARAMETERS, unknowIds.toString(), 'floristList'))
      return OrderMicroService.FloristAPI_bindFloristsToStore({ storeId: storeId, floristList: floristIds })
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('unbindFlorist', {
    description: "Create florist by userId.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'storeId', type: 'string', required: true, description: "Order Id.", http: { source: 'path' } },
    { arg: 'floristList', type: ['string'], required: true, description: "Florist Ids.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/user/:userIdstore/:storeId/unbindFlorist', verb: 'post', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.unbindFlorist = function (userId, storeId, floristList, cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let floristIds = [];
    let unknowIds = [];
    Promise.map(floristList, florist => {
      return UserMicroService.UserAPI_getUserInfo({ userId: florist });
    }).then(result => {
      floristIds = result.filter(r => {
        if (r.obj[0])
          return r.obj[0]._id
      }).map(node => node.obj[0]._id);
      if (floristIds.length != floristList.length) {
        floristList.forEach(florist => {
          if (floristIds.indexOf(florist) == -1)
            unknowIds.push(florist);
        });
      }
      if (unknowIds.length > 0)
        throw apiUtils.build500Error(nodeUtil.format(errorConstant.ERROR_NAME_INVALID_INPUT_PARAMETERS, unknowIds.toString(), 'floristList'))
      return OrderMicroService.FloristAPI_unbindFlorist({ storeId: storeId, floristList: floristIds })
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('assignJobToFlroist', {
    description: "Create florist by userId.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'orderId', type: 'string', required: true, description: "Order Id.", http: { source: 'path' } },
    { arg: 'floristId', type: 'string', required: true, description: "Florist Id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/user/:userId/order/:orderId/florist/:floristId/assignJobToFlroist', verb: 'post', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.assignJobToFlroist = function (userId, orderId, floristId, cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_getUserInfo({ userId: floristId }).then(result => {
      if (result.obj.length == 0)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_CODE_NO_MODEL_FOUND, "Florist"));
      return OrderMicroService.FloristAPI_assignJobToFlroist({ orderId: orderId, floristId: floristId });
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('getFlorist', {
    description: "Create florist by userId.",
    accepts: [{ arg: 'floristId', type: 'string', required: false, description: "Florist Id.", http: { source: 'query' } },
    { arg: 'storeId', type: 'string', required: false, description: "Store Id.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/getFlorist', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getFlorist = function (floristId, storeId, cb) {
    ManagerFacadeHelper.getFlorist(floristId, storeId).then(resp => {
      cb(null, resp);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('batchOrderJob', {
    description: "Create florist by userId.",
    accepts: [{ arg: 'option', type: 'string', required: true, description: "day/month/year", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/batchOrderJob', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.batchOrderJob = function (cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let time = moment().local().format('YYYY-MM-DD HH:mm:ss');
    let week = time.day() == 1 ? true : false;
    let month = time.date() == 1 ? true : false;
    let season = time.subtract(1, 'd').quarter() < time.add(1, 'd').quarter() ? true : false;
    let year = time.dayOfYear() == 1 ? true : false;
    let condition = {};
    let orderResult = {}
    let floristIds;
    condition.userId = "";
    condition.status = "payed";
    condition.fromDate = time.subtract(1, 'd').split(' ')[0] + " 00:00:00";
    condition.toDate = time.split(' ')[0] + " 23:59:59";
    OrderMicroService.FloristAPI_getFloristIdList().then(result => {
      floristIds = result.obj;
      return UserMicroService.TransactionAPI_searchTransaction({ filter: searchData })
    }).then(result => {
      orderResult.day = result.obj;
      return Promise.map(orderResult.day, transaction => {
        return OrderMicroService.OrderAPI_findOrderById({ orderId: transaction.orderId })
      });
    }).then(result => {
      let orders = result.obj;
      floristIds.forEach(florist => {
        let dailyOrder = orders.filter(r => r.florist._id == florist);
      })
    })
  }
}
