
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
    description: "批量创建花艺师账号.",
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
    description: "将单个花艺师指派给店铺.",
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
    description: "解除花艺师绑定的店铺.",
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
    description: "指派订单给花艺师.",
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
      let transaction = {};
      transaction.floristId = floristId;
      return UserMicroService.TransactionAPI_updateTransaction({ transactionId: transactionId, updateData: transaction });
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getFlorist', {
    description: "根据id获取花艺师信息.",
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

  ManagerFacadeAPI.remoteMethod('statisticsBatchJob', {
    description: "订单信息统计任务.",
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/statisticsBatchJob', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.statisticsBatchJob = function (cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let time = moment().local().format('YYYY-MM-DD HH:mm:ss');
    let weekly = moment(time).day() == 1 ? true : false;
    let monthly = moment(time).date() == 1 ? true : false;
    let seasonal = moment(time).subtract(1, 'd').quarter() < moment(time).add(1, 'd').quarter() ? true : false;
    let annual = moment(time).dayOfYear() == 1 ? true : false;
    let condition = {}, transactions = {}, florists, stores;
    let data = {};
    condition.fromDate = moment(time).subtract(1, 'd').format('YYYY-MM-DD HH:mm:ss').split(' ')[0] + " 00:00:00";
    condition.toDate = moment(time).subtract(1, 'd').format('YYYY-MM-DD HH:mm:ss').split(' ')[0] + " 23:59:59";
    UserMicroService.TransactionAPI_searchTransaction({ filter: condition }).then(result => {
      transactions = result.obj;
      transactions = transactions.filter(t => t.status != "Unpayed");
      return UserMicroService.FloristAPI_getFloristList();
    }).then(result => {
      florists = result.obj;
      return UserMicroService.StoreAPI_getAllStores();
    }).then(result => {
      stores = result.obj;
      return Promise.map(florists, florist => {
        return UserMicroService.UserAPI_getUserInfo({ userId: florist.userId }).then(result => {
          //deal with userInfo (To be refined)
          florist.userInfo = result.obj;
          return florist;
        });
      });
    }).then(result => {
      florists = result;
      return UserMicroService.UserAPI_getUserCount({});
    }).then(result => {
      data = {
        totalCustomerCount: result.obj.resp,
        florists: florists,
        stores: stores,
        transactions: transactions,
        weekly: weekly,
        monthly: monthly,
        seasonal: seasonal,
        annual: annual,
        date: time
      };
      return StatisticsMicroService.StatisticsAPI_statisticsTransactionsBatchJob({ data: data });
    }).then(() => {
      return { isSuccess: true };
    }).catch(err => {
      return Promise.reject(err);
    });
  }

  ManagerFacadeAPI.remoteMethod('batchBindFloristsToStore', {
    description: "设置花艺师所属店铺.",
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
    description: "设置user为店长.",
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
    description: "解除店长权限.",
    accepts: [{ arg: 'userId', type: 'string', required: false, description: "Manager Id", http: { source: 'path' } },
    { arg: 'storeId', type: 'string', required: false, description: "store Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/user/:userId/store/:storeId/unsetStoreManager', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.unsetStoreManager = function (userId, storeId, cb) {
    let UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_getUserInfo({ userId: userId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "ButchartUser"));
      return UserMicroService.StoreAPI_getStoreById({ storeId: storeId });
    }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "Store"));
      let store = result.obj;
      delete store.managerId;
      return UserMicroService.StoreAPI_updateStore({ storeId: storeId, updateData: store });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('statisticsLocationBatchJob', {
    description: "统计订单地点分布任务.",
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/statisticsLocationBatchJob', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.statisticsLocationBatchJob = function () {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let time = moment().local().format('YYYY-MM-DD HH:mm:ss');
    let transactions;
    let condition = {};
    condition.fromDate = moment().local().month(moment(time).month() - 1).format('YYYY-MM-DD HH:mm:ss').toString().split(" ")[0] + "00:00:00";
    condition.toDate = moment().local().dayOfYear(moment(time).dayOfYear() - 1).format('YYYY-MM-DD HH:mm:ss').toString().split(" ")[0] + "23:59:59";
    UserMicroService.TransactionAPI_searchTransaction({ filter: condition }).then(result => {
      transactions = result.obj.filter(t => ["AfterSales", "Send"].indexOf(t.status) != -1);
      return Promise.map(transactions, tran => {
        return UserMicroService.AddressAPI_getAddressById({ addressId: tran.addressId }).then(result => {
          delete tran.addressId;
          tran.address = result.obj[0];
          return;
        });
      });
    }).then(() => {
      let data = {
        date: time,
        transactions: transactions
      }
      return StatisticsMicroService.StatisticsAPI_statisticsLocationBatchJob({ data: data });
    }).then(() => {
      return Promise.resolve({ isSuccess: true });
    }).catch(err => {
      return Promise.reject(err);
    });
  }

  ManagerFacadeAPI.remoteMethod('assignTransactionsBatchJob', {
    description: "订单自动分配任务.",
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/assignTransactionsBatchJob', verb: 'post', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.assignTransactionsBatchJob = function (cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    let unassignTrans = [];
    let overviewLog;
    let promiseArray = [], stores = [];
    let resp = {};
    return UserMicroService.TransactionAPI_getUnassignedTransactions().then(result => {
      unassignTrans = result.obj;
      return StatisticsMicroService.StatisticsAPI_getBatchOverViewLog();
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
      if (unassignTrans.length > 0)
        return StatisticsMicroService.StatisticsAPI_updateOverViewLog({ data: overviewLog });
      return;
    }).then(() => {
      console.log("Batch assign transaction jop completed.")
      return Promise.resolve();
    }).catch(err => {
      console.log(JSON.stringify(err));
      return Promise.reject();
    });
  }

  ManagerFacadeAPI.remoteMethod('addCommentToTransaction', {
    description: "给订单加备注信息（给包月伴手礼用）.",
    accepts: [{ arg: 'floristId', type: 'string', required: false, description: "Florist Id", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: false, description: "transactio Id", http: { source: 'path' } },
    { arg: 'comment', type: 'string', required: false, description: "commnet", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/florist/:floristId/transaction/:transactionId/addCommentToTransaction', verb: 'post', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.addCommentToTransaction = function (floristId, transactionId, comment, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.TransactionAPI_addCommentToTransaction({ transactionId: transactionId, comment: comment }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getFloristStatisticsLog', {
    description: "获取花艺师报表信息.",
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "Florist id.", http: { source: 'path' } },
    { arg: 'filter', type: 'FilterRequest', required: true, description: "Query option.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['FloristStatisticsEntry'], description: '', root: true },
    http: { path: '/manager/florist/:floristId/getFloristStatisticsLog', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getFloristStatisticsLog = function (floristId, filter, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    filter = apiUtils.parseToObject(filter);
    StatisticsMicroService.StatisticsAPI_getFloristStatisticsLog({ floristId: floristId, filter: filter }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getBatchOverViewLog', {
    description: "获取统计总计信息",
    returns: { arg: 'resp', type: 'OverViewLog', description: '', root: true },
    http: { path: '/manager/getBatchOverViewLog', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getBatchOverViewLog = function (cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    StatisticsMicroService.StatisticsAPI_getBatchOverViewLog({}).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getStoreStatisticsLog', {
    description: "获取店铺报表信息.",
    accepts: [{ arg: 'storeId', type: 'string', required: true, description: "Store id.", http: { source: 'path' } },
    { arg: 'filter', type: 'FilterRequest', required: true, description: "Query option.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['StoreStatisticsEntry'], description: '', root: true },
    http: { path: '/manager/store/:storeId/getStoreStatisticsLog', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getStoreStatisticsLog = function (storeId, filter, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    StatisticsMicroService.StatisticsAPI_getStoreStatisticsLog({ storeId, storeId, filter: filter }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getLocationStatisticsLog', {
    description: "获取订单地域分布报表信息.",
    accepts: [{ arg: 'filter', type: 'FilterRequest', required: true, description: "Query option.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['LocationStatisticsEntry'], description: '', root: true },
    http: { path: '/manager/getLocationStatisticsLog', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getLocationStatisticsLog = function (filter, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    StatisticsMicroService.StatisticsAPI_getLocationStatisticsLog({ filter: filter }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }
}
