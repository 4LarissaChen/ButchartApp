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
  WorkspaceFacadeAPI.payOrder = function (customerId, transactionId, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    //TBD third part pay.
    return Promise.resolve().then(result => {
      return CustomerMicroService.TransactionAPI_changeStatus({ transactionId: transactionId, status: "payed" })
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('searchTransaction', {
    description: "Search history transactions.",
    accepts: { arg: 'searchData', type: 'SearchTransactionRequest', required: true, description: "search parameters", http: { source: 'body' } },
    returns: { arg: 'resp', type: ['Transaction'], description: "", root: true },
    http: { path: '/workspace/searchTransactions', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.searchTransaction = function (searchData, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    return CustomerMicroService.TransactionAPI_searchTransaction({ filter: searchData }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('addAddress', {
    description: "Add shipping address.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'AddAddressRequest', required: true, description: "Address information", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/addAddress', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.addAddress = function (customerId, addressData, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    return CustomerMicroService.AddressAPI_addAddress({ customerId: customerId, addressData: addressData }).then(() => {
      cb(null, { isSuccess: true });
    }).catech(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('modifyAddress', {
    description: "Modify shipping address.",
    accepts: [{ arg: 'addressId', type: 'string', required: true, description: "Address Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'AddAddressRequest', required: true, description: "Address information", http: { source: 'body' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: "", root: true },
    http: { path: '/workspace/addressId/:addressId/modifyAddress', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.modifyAddress = function (addressId, addressdata, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    return CustomerMicroService.AddressAPI_modifyAddress({ addressId: addressId, addressData: addressData }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getAddress', {
    description: "Modify shipping address.",
    accepts: { arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Address'], description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/getAddress', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getAddress = function (customerId, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    return CustomerMicroService.AddressAPI_getAddress({ customerId: customerId }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('deleteAddress', {
    description: "Delete shipping address.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    { arg: 'addressIds', type: ['string'], required: true, description: "Address Ids", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/deleteAddress', verb: 'delete', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.deleteAddress = function (customerId, addressIds, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    return Promise.map(addressIds, addressId => {
      return CustomerMicroService.AddressAPI_deleteAddress({ addressId: addressId });
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }
}