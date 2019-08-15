
'use strict'
var app = require('../../../../server/server.js');
var loopback = require('loopback');
var nodeUtil = require('util');
var moment = require('moment');
var Promise = require('bluebird');
var errorConstant = require('../../../../server/constants/errorConstants.js');
var ManagerFacadeHelper = require('./internalService/ManagerFacadeHelper.js');
var WorkspaceFacadeService = require('../workspace/internalService/WorkspaceFacadeService.js');
var apiUtils = require('../../../../server/utils/apiUtils.js');

module.exports = function (ManagerFacadeAPI) {
  apiUtils.disableRelatedModelRemoteMethod(ManagerFacadeAPI);

  ManagerFacadeAPI.remoteMethod('batchCreateFlorist', {
    description: "批量创建花艺师账号.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "Admin user id", http: { source: 'path' } },
    { arg: 'floristIds', type: ['string'], required: true, description: "Florist Ids", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/manager/user/:userId/tel/batchCreateFlorist', verb: 'post', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.batchCreateFlorist = function (userId, floristIds, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    Promise.map(floristIds, floristId => {
      return UserMicroService.UserAPI_getUserInfo({ userId: floristId }).then(result => result.obj).then(result => {
        if (result._id == null || result._id != floristId)
          throw apiUtils.build404Error(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, 'ButchartUser');
        return UserMicroService.FloristAPI_createFlorist({ floristId: floristId });
      });
    }).then(result => {
      cb(null, { isSuccess: true });
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
    description: "根据storeId获取花艺师信息.",
    accepts: [{ arg: 'userId', type: 'string', required: false, description: "User Id.", http: { source: 'query' } },
    { arg: 'storeId', type: 'string', required: false, description: "Store Id.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/getFlorist', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getFlorist = function (userId, storeId, cb) {
    ManagerFacadeHelper.getFlorist(userId, storeId).then(resp => {
      cb(null, resp);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getCustomerPool', {
    description: "获取花艺师客户池.",
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "florist id", http: { source: 'path' } }],
    returns: { arg: 'customerPool', type: ['ButchartUser'], description: 'is success or not', root: true },
    http: { path: '/manager/florist/:floristId/customerPool', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getCustomerPool = function (floristId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.FloristAPI_getCustomerPool({ floristId: floristId }).then(result => {
      return Promise.map(result.obj.customerPool, customerId => {
        return UserMicroService.UserAPI_getUserInfo({ userId: customerId }).then(result => result.obj);
      })
    }).then(result => {
      cb(null, result);
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
    console.log("订单信息统计任务开始...")
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let time = moment().local().format('YYYY-MM-DD HH:mm:ss');
    let weekly = moment(time).day() == 1 ? true : false;
    let monthly = moment(time).date() == 1 ? true : false;
    let seasonal = moment(time).subtract(1, 'd').quarter() < moment(time).quarter() ? true : false;
    let annual = moment(time).dayOfYear() == 1 ? true : false;
    let condition = {}, transactions = {}, florists, stores;
    let data = {};
    condition.fromDate = moment(time).subtract(1, 'd').format('YYYY-MM-DD HH:mm:ss').split(' ')[0] + " 00:00:00";
    condition.toDate = moment(time).subtract(1, 'd').format('YYYY-MM-DD HH:mm:ss').split(' ')[0] + " 23:59:59";
    ManagerFacadeHelper.scheduleFlorists(time).then(() => {
      return UserMicroService.TransactionAPI_searchTransaction({ filter: condition });
    }).then(result => {
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
      console.log("订单信息统计任务结束...")
      return { isSuccess: true };
    }).catch(err => {
      return Promise.reject(err);
    });
  }

  ManagerFacadeAPI.remoteMethod('uploadSchedule', {
    description: "上传排班表.",
    accepts: [{ arg: 'data', type: 'object', required: false, description: "{storeId: [floristIds]}", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/uploadSchedule', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.uploadSchedule = function (data, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    StatisticsMicroService.StatisticsAPI_getBatchOverViewLog().then(result => {
      let overviewLog = result.obj;
      data = apiUtils.parseToObject(data);
      overviewLog.schedule = data.schedule;
      overviewLog.scheduleDate = data.scheduleDate;
      StatisticsMicroService.StatisticsAPI_updateOverViewLog({ data: overviewLog });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('getSchedule', {
    description: "获取排班表.",
    returns: { arg: 'resp', type: 'object', description: '', root: true },
    http: { path: '/manager/getSchedule', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getSchedule = function (cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    var workspaceFacadeService = new WorkspaceFacadeService();
    let scheduleDate;
    Promise.props({
      scheduleData: StatisticsMicroService.StatisticsAPI_getSchedule().then(result => result.obj),
      stores: UserMicroService.StoreAPI_getAllStores().then(result => result.obj),
      florists: workspaceFacadeService.getFlorists()
    }).then(result => {
      let schedule = result.scheduleData[0].schedule;
      scheduleDate = result.scheduleData[0].scheduleDate;
      let storeIds = Object.keys(schedule);
      let resp = {};
      storeIds.forEach(storeId => {
        let store = result.stores.find(s => s._id == storeId);
        if (store == null) return;
        resp[store.name] = {};
        let dayNo = Object.keys(schedule[storeId]);
        dayNo.forEach(no => {
          let floristIds = schedule[storeId][no];
          resp[store.name][no] = floristIds.map(floristId => result.florists.find(f => f.florist.userId == floristId).fullname);
        })
      })
      return resp;
    }).then(result => {
      cb(null, { schedule: result, scheduleDate: scheduleDate });
    }).catch(err => {
      cb(err, null);
    })
  }

  ManagerFacadeAPI.remoteMethod('setStoreManager', {
    description: "设置user为店长.",
    accepts: [{ arg: 'userId', type: 'string', required: false, description: "Manager Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/user/:userId/setStoreManager', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.setStoreManager = function (userId, cb) {
    let UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_getUserInfo({ userId: userId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "ButchartUser"));
      return UserMicroService.AuthorizationAPI_assignRoleToButchartUser({ userId: userId, roleName: "Manager" });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('unsetStoreManager', {
    description: "解除店长权限.",
    accepts: [{ arg: 'userId', type: 'string', required: false, description: "Manager Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/user/:userId/unsetStoreManager', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.unsetStoreManager = function (userId, cb) {
    let UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_getUserInfo({ userId: userId }).then(result => {
      if (!result.obj)
        throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "ButchartUser"));
      return UserMicroService.AuthorizationAPI_unAssignRoleToButchartUser({ userId: userId, roleName: "Manager" });
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
        overviewLog._id = apiUtils.generateShortId("OverView");
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
    returns: { arg: 'resp', type: 'OverView', description: '', root: true },
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
    StatisticsMicroService.StatisticsAPI_getStoreStatisticsLog({ storeId: storeId, filter: filter }).then(result => {
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

  ManagerFacadeAPI.remoteMethod('getAllStoreStatisticsLogs', {
    description: "获取所有门店统计信息.",
    accepts: [{ arg: 'filter', type: 'FilterRequest', required: true, description: "Query option.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['StoreStatisticsEntry'], description: '', root: true },
    http: { path: '/manager/getAllStoreStatisticsLogs', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getAllStoreStatisticsLogs = function (filter, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    StatisticsMicroService.StatisticsAPI_getStoreStatisticsLog({ storeId: "*", filter: filter }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }
  ManagerFacadeAPI.remoteMethod('getAllFloristStatisticsLogs', {
    description: "获取所有花艺师统计信息（汇总）.",
    accepts: [{ arg: 'filter', type: 'FilterRequest', required: true, description: "Query option.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'object', description: '', root: true },
    http: { path: '/manager/getAllFloristStatisticsLogs', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getAllFloristStatisticsLogs = function (filter, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    var resp = {};
    UserMicroService.FloristAPI_getFloristList().then(result => {
      return Promise.map(result.obj, florist => {
        let logEntry;
        return StatisticsMicroService.StatisticsAPI_getFloristStatisticsLog({ floristId: florist.userId, filter: filter }).then(result => {
          logEntry = result.obj;
          return UserMicroService.UserAPI_getUserInfo({ userId: florist.userId }).then(result => {
            logEntry.forEach(log => {
              log.fullname = result.obj.fullname;
            })
            resp[florist._id] = logEntry;
            return;
          })
        });
      });
    }).then(() => {
      cb(null, resp);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getAllStoreStatisticsLogsByStore', {
    description: "获取所有门店报表信息（分门店）.",
    accepts: [{ arg: 'filter', type: 'FilterRequest', required: true, description: "Query option.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['LocationStatisticsEntry'], description: '', root: true },
    http: { path: '/manager/getAllStoreStatisticsLogsByStore', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getAllStoreStatisticsLogsByStore = function (filter, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let resp = {}
    UserMicroService.StoreAPI_getAllStores().then(result => {
      return Promise.map(result.obj, store => {
        return StatisticsMicroService.StatisticsAPI_getStoreStatisticsLog({ storeId: store._id, filter: filter }).then(result => {
          resp[store._id] = result.obj;
          return Promise.resolve();
        });
      });
    }).then(() => {
      cb(null, resp);
    }).catch(err => {
      cb(err, null);
    });
  }

  ManagerFacadeAPI.remoteMethod('getOverViewStatisticsLogs', {
    description: "获取总览信息.",
    accepts: [{ arg: 'filter', type: 'FilterRequest', required: true, description: "Query option.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['OverViewStatisticsEntry'], description: '', root: true },
    http: { path: '/manager/getOverViewStatisticsLogs', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getOverViewStatisticsLogs = function (filter, cb) {
    var StatisticsMicroService = loopback.findModel("StatisticsMicroService");
    filter = apiUtils.parseToObject(filter);
    StatisticsMicroService.StatisticsAPI_getOverViewStatisticsLog({ filter: filter }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }
}