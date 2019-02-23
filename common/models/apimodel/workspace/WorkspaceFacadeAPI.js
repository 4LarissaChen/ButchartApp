'use strict'
var app = require('../../../../server/server.js');
var loopback = require('loopback');
var nodeUtil = require('util');
var moment = require('moment');
var Promise = require('bluebird');

var apiUtils = require('../../../../server/utils/apiUtils.js');

module.exports = function (WorkspaceFacadeAPI) {
  apiUtils.disableRelatedModelRemoteMethod(WorkspaceFacadeAPI);

  WorkspaceFacadeAPI.remoteMethod('login', {
    description: "Customer login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/login', verb: 'post', status: 200, errorStatus: 500 }
  });

  WorkspaceFacadeAPI.login = function (tel, code, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    CustomerMicroService.CustomerAPI_login({ tel: tel, code: code }).then(result => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  };

  WorkspaceFacadeAPI.remoteMethod('sendMessage', {
    description: "Get message verification code.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'path' } },
    { arg: 'operation', type: 'string', required: true, description: "login/register/changePwd/idVerification", http: { source: 'query' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/sendMessage/:tel', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.sendMessage = function (tel, operation, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    CustomerMicroService.CustomerAPI_sendMessage({ tel: tel, operation: operation }).then(result => {
      cb(null, result.obj)
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('createOrder', {
    description: "Create an order.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id.", http: { source: 'path' } },
    { arg: 'orderParams', type: 'CreateOrderRequest', required: true, description: "detail order properties", http: { source: 'body' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/createOrder', verb: 'put', status: 200, errorStatus: 500 }
  });

  WorkspaceFacadeAPI.createOrder = function (customerId, orderParams, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    let orderId;
    return OrderMicroService.OrderAPI_createOrder({ customerId: customerId, productList: orderParams.productList }).then(result => {
      orderId = result.obj.orderId;
      return CustomerMicroService.TransactionAPI_createTransaction({
        customerId: customerId,
        orderId: orderId,
        storeId: orderParams.storeId,
        addressId: orderParams.addressId
      }).then(() => {
        cb(null, { isSuccess: true });
      }).catch(err => {
        cb(err.null);
      })

    })
  }

  WorkspaceFacadeAPI.remoteMethod('payOrder', {
    description: "Pay an order.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id.", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/transactionId/:transactionId/payOrder', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.payOrder = function (customerId, transactionId, cb){
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    //TBD third part pay.
    return Promise.resolve().then(result => {
      return CustomerMicroService.TransactionAPI_changeStatus({transactionId: transactionId, status: "payed"})
    }).then(() => {
      cb(null, {isSuccess: true});
    }).catch( err => {
      cb(err, null);
    })
  }
}