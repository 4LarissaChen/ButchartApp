
'use strict'
var app = require('../../../../server/server.js');
var loopback = require('loopback');
var nodeUtil = require('util');
var moment = require('moment');
var Promise = require('bluebird');
var errorConstant = require('../../../../server/constants/errorConstants.js');

var apiUtils = require('../../../../server/utils/apiUtils.js');

module.exports = function (ManagerFacadeAPI) {
  apiUtils.disableRelatedModelRemoteMethod(ManagerFacadeAPI);

  ManagerFacadeAPI.remoteMethod('createFlorist', {
    description: "Get products by product series Id.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "Admin user id", http: { source: 'path' } },
    { arg: 'tel', type: 'string', required: true, description: "Florist Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: ['Product'], description: 'is success or not', root: true },
    http: { path: '/manager/user/:userId/tel/:tel/createFlorist', verb: 'put', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.createFlorist = function (userId, tel, cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_getUserInfo({ userId: tel }).then(result => {
      if (result.obj.length == 0) throw apiUtils.build404Error(nodeUtil.format(errorConstant.ERROR_MESSAGE_ENTITY_NOT_FOUND, "ButchartUser"));
      return OrderMicroService.FloristAPI_createFlorist({ tel: result.obj[0]._id });
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
    accepts: [{ arg: 'floristId', type: 'string', required: true, description: "Florist Id.", http: { source: 'query' } },
    { arg: 'storeId', type: 'string', required: true, description: "Store Id.", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: '', root: true },
    http: { path: '/manager/getFlorist', verb: 'get', status: 200, errorStatus: [500] }
  });
  ManagerFacadeAPI.getFlorist = function (floristId, storeId, cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    var UserMicroService = loopback.findModel("UserMicroService");
    let resp;
    OrderMicroService.floristAPI_getFlorist({ floristId: floristId, storeId: storeId }).then(result => {
      if (!result.obj.length)
        return UserMicroService.UserAPI_getUserInfo({ userId: floristId }).then(result => {
          resp = result.obj;
          return Promise.resolve(resp);
        })
      else
        return Promise.map(result.obj, store => {
          return Promise.map(store.includeFlorists, floristId => {
            return UserMicroService.UserAPI_getUserInfo({ userId: floristId });
          }).then(result => {
            store.includeFlorists = result.obj;
            resp.push(store);
            return Promise.resolve();
          })
        })
    }).then(() => {
      cb(null, resp);
    }).catch(err => err);
  }
}
