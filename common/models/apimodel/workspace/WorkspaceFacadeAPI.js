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
    description: "User login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/login', verb: 'post', status: 200, errorStatus: 500 }
  });

  WorkspaceFacadeAPI.login = function (tel, code, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_login({ tel: tel, code: code }).then(result => {
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
    http: { path: '/workspace/sendMessage/:tel', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.sendMessage = function (tel, operation, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_sendMessage({ tel: tel, operation: operation }).then(result => {
      cb(null, result.obj)
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('createTransaction', {
    description: "Create an order.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'orderParams', type: 'CreateTransactionRequest', required: true, description: "detail order properties", http: { source: 'body' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/userId/:userId/createTransaction', verb: 'put', status: 200, errorStatus: 500 }
  });

  WorkspaceFacadeAPI.createTransaction = function (userId, orderParams, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    let orderId;
    let addressId = orderParams.addressId;
    delete orderParams.addressId;
    orderParams.userId = userId;
    OrderMicroService.OrderAPI_createOrder({ createOrderData: orderParams }).then(result => {
      orderId = result.obj.orderId;
      return UserMicroService.TransactionAPI_createTransaction({
        userId: userId,
        orderId: orderId,
        addressId: addressId
      }).then(() => {
        cb(null, { isSuccess: true });
      }).catch(err => {
        cb(err.null);
      })
    })
  }

  WorkspaceFacadeAPI.remoteMethod('payTransaction', {
    description: "Pay an order.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/userId/:userId/transactionId/:transactionId/payTransaction', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.payTransaction = function (userId, transactionId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    //TBD third part pay.
    UserMicroService.TransactionAPI_changeStatus({ transactionId: transactionId, status: "payed" }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getUserOwnedTransactions', {
    description: "Get user owend transactions.",
    accepts: { arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/workspace/userId/:userId/getUserOwnedTransactions', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getUserOwnedTransactions = function (userId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.TransactionAPI_getUserOwnedTransactions({ userId: userId }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getTransactionDetail', {
    description: "Get transaction detail by transactionId.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/workspace/userId/:userId/transactionId/:transactionId/getTransactionDetail', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getTransactionDetail = function (userId, transactionId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    UserMicroService.TransactionAPI_getTransactionById({ userId: userId, transactionId: transactionId }).then(result => {
      return OrderMicroService.OrderAPI_findOrderById({ orderId: result.obj.orderId });
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('searchTransaction', {
    description: "Search user's history transactions.",
    accepts: { arg: 'searchData', type: 'SearchTransactionRequest', required: true, description: "search parameters", http: { source: 'body' } },
    returns: { arg: 'resp', type: ['Transaction'], description: "", root: true },
    http: { path: '/workspace/searchTransactions', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.searchTransaction = function (searchData, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.TransactionAPI_searchTransaction({ filter: searchData }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('addLogisticsInfo', {
    description: "Add logistics information of an order.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id.", http: { source: 'path' } },
    { arg: 'logisticsData', type: 'AddLogisticsInfoRequest', required: true, description: "logistics information.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/userId/:userId/transactionId/:transactionId/attachLogistics', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.addLogisticsInfo = function (userId, transactionId, logisticsData, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    UserMicroService.TransactionAPI_getTransactionById({ userId: userId, transactionId: transactionId }).then(result => {
      return OrderMicroService.OrderAPI_attachLogistics({ logistics: logisticsData });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('addAddress', {
    description: "Add shipping address.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'AddAddressRequest', required: true, description: "Address information", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: "", root: true },
    http: { path: '/workspace/userId/:userId/addAddress', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.addAddress = function (userId, addressData, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.AddressAPI_addAddress({ userId: userId, addressData: addressData }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('modifyAddress', {
    description: "Modify shipping address.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "UserId Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'ModifyAddressRequest', required: true, description: "Address information", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/userId/:userId/modifyAddress', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.modifyAddress = function (userId, addressData, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.AddressAPI_modifyAddress({ userId: userId, addressData: addressData }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getAddress', {
    description: "Get shipping address.",
    accepts: { arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Address'], description: "", root: true },
    http: { path: '/workspace/userId/:userId/getAddress', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getAddress = function (userId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.AddressAPI_getAddress({ userId: userId }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('deleteAddress', {
    description: "Delete shipping address.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id", http: { source: 'path' } },
    { arg: 'addressIds', type: ['string'], required: true, description: "Address Ids", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/userId/:userId/deleteAddress', verb: 'delete', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.deleteAddress = function (userId, addressIds, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    Promise.map(addressIds, addressId => {
      return UserMicroService.AddressAPI_deleteAddress({ addressId: addressId });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getProductSeries', {
    description: "Get product series.",
    returns: { arg: 'resp', type: ['ProductSeries'], description: "", root: true },
    http: { path: '/workspace/getProductSeries', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getProductSeries = function (cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    OrderMicroService.OrderAPI_getProductSeries().then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(null, err);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getProductsBySeries', {
    description: "Get products by product series Id.",
    accepts: { arg: 'seriesId', type: 'string', required: true, description: "product series id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Product'], description: 'is success or not', root: true },
    http: { path: '/workspace/seriesId/:seriesId/getProductsBySeries', verb: 'get', status: 200, errorStatus: [500] }
  });
  WorkspaceFacadeAPI.getProductsBySeries = function (seriesId, cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    OrderMicroService.OrderAPI_getProductsBySeries({ seriesId: seriesId }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }
}