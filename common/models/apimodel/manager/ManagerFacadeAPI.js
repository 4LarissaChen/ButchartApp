
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
      return UserMicroService.UserAPI_getUserInfo({ userId: floristId }).then(result => result.obj[0]);
    }).then(result => {

    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('bindFloristToStore', {
    description: "Bind a florist to store.",
    accepts: [{ arg: 'storeId', type: 'string', required: true, description: "Store Id.", http: { source: 'path' } },
    { arg: 'floristId', type: 'string', required: true, description: "Florist Id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/store/:storeId/florist/:floristId/bindFloristToStore', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.bindFloristToStore = function (storeId, floristId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.StoreAPI_getStoreById({ storeId: storeId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "Store"));
      return UserMicroService.StoreAPI_bindFlorist({ storeId: storeId, floristId: floristId });
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('unbindFloristToStore', {
    description: "Unbind a florist to store.",
    accepts: [{ arg: 'storeId', type: 'string', required: true, description: "Store Id.", http: { source: 'path' } },
    { arg: 'floristId', type: 'string', required: true, description: "Florist Id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/store/:storeId/florist/:floristId/unbindFloristToStore', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.unbindFloristToStore = function (storeId, floristId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.StoreAPI_getStoreById({ storeId: storeId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "Store"));
      return UserMicroService.StoreAPI_unbindFlorist({ storeId: storeId, floristId: floristId });
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('assignJobToFlroist', {
    description: "Assign a job to florist.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id.", http: { source: 'path' } },
    { arg: 'floristId', type: 'string', required: true, description: "Florist Id.", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/user/:userId/transaction/:transactionId/florist/:floristId/assignJobToFlroist', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.assignJobToFlroist = function (userId, transactionId, floristId, cb) {
    let UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.FloristAPI_getFlorist({ floristId: floristId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_CODE_NO_MODEL_FOUND, "Florist"));
      return UserMicroService.StoreAPI_getStoreByFlorist({ floristId: floristId });
    }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_CODE_NO_MODEL_FOUND, "Store"));
      let transaction = {};
      transaction.floristId = floristId;
      transaction.storeId = result.obj._id;
      return UserMicroService.TransactionAPI_updateTransaction({ transactionId: transactionId, updateData: transaction });
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getFlorist', {
    description: "Get florist by Id.",
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

  ManagerFacadeAPI.remoteMethod('batchBindFloristsToStore', {
    description: "Batch bind florists to store.",
    accepts: [{ arg: 'data', type: 'object', required: false, description: "{storeId: [floristIds]}", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/batchBindFloristsToStore', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.batchBindFloristsToStore = function (data, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    Promise.map(Object.keys(data), key => {
      return UserMicroService.StoreAPI_getStoreById({ storeId: key }).then(result => {
        if (!result.obj)
          throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "Store"));
        result.obj.florists = data[key];
        return UserMicroService.StoreAPI_updateStore({ storeId: key, updateData: result.obj });
      })
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('setStoreManager', {
    description: "Set a store's Manager.",
    accepts: [{ arg: 'userId', type: 'string', required: false, description: "Manager Id", http: { source: 'path' } },
    { arg: 'storeId', type: 'string', required: false, description: "store Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/user/:userId/store/:storeId/setStoreManager', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.setStoreManager = function (userId, storeId, cb) {
    let UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_getUserInfo({ userId: userId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "ButchartUser"));
      return UserMicroService.StoreAPI_getStoreById({ storeId: storeId });
    }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "Store"));
      let store = result.obj;
      store.managerId = userId;
      return UserMicroService.StoreAPI_updateStore({ storeId: storeId, updateData: store });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('unsetStoreManager', {
    description: "Unset a store's Manager.",
    accepts: [{ arg: 'userId', type: 'string', required: false, description: "Manager Id", http: { source: 'path' } },
    { arg: 'storeId', type: 'string', required: false, description: "store Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/user/:userId/store/:storeId/setStoreManager', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.unsetStoreManager = function(userId, storeId, cb){
    let UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_getUserInfo({ userId: userId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "ButchartUser"));
      return UserMicroService.StoreAPI_getStoreById({ storeId: storeId });
    }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "Store"));
      let store = result.obj;
      delete store.managerId
      return UserMicroService.StoreAPI_updateStore({ storeId: storeId, updateData: store });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    });
  }
}
