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

  WorkspaceFacadeAPI.remoteMethod('createTransaction', {
    description: "Create an order.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id.", http: { source: 'path' } },
    { arg: 'orderParams', type: 'CreateTransactionRequest', required: true, description: "detail order properties", http: { source: 'body' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/createTransaction', verb: 'put', status: 200, errorStatus: 500 }
  });

  WorkspaceFacadeAPI.createTransaction = function (customerId, orderParams, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    let orderId;
    let addressId = orderParams.addressId;
    delete orderParams.addressId;
    orderParams.customerId = customerId;
    OrderMicroService.OrderAPI_createOrder({ createOrderData: orderParams }).then(result => {
      orderId = result.obj.orderId;
      return CustomerMicroService.TransactionAPI_createTransaction({
        customerId: customerId,
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
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id.", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/transactionId/:transactionId/payTransaction', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.payTransaction = function (customerId, transactionId, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    //TBD third part pay.
    CustomerMicroService.TransactionAPI_changeStatus({ transactionId: transactionId, status: "payed" }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getCustomerOwnedTransactions', {
    description: "Get customer owend transactions.",
    accepts: { arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/workspace/customerId/:customerId/getCustomerOwnedTransactions', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getCustomerOwnedTransactions = function (customerId, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    CustomerMicroService.TransactionAPI_getCustomerOwnedTransactions({ customerId: customerId }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getTransactionDetail', {
    description: "Get transaction detail by transactionId.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: ['Transaction'], description: '', root: true },
    http: { path: '/workspace/customerId/:customerId/transactionId/:transactionId/getTransactionDetail', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getTransactionDetail = function (customerId, transactionId, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    CustomerMicroService.TransactionAPI_getTransactionById({ customerId: customerId, transactionId: transactionId }).then(result => {
      return OrderMicroService.OrderAPI_findOrderById({ orderId: result.obj.orderId });
    }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('searchTransaction', {
    description: "Search customer's history transactions.",
    accepts: { arg: 'searchData', type: 'SearchTransactionRequest', required: true, description: "search parameters", http: { source: 'body' } },
    returns: { arg: 'resp', type: ['Transaction'], description: "", root: true },
    http: { path: '/workspace/searchTransactions', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.searchTransaction = function (searchData, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    CustomerMicroService.TransactionAPI_searchTransaction({ filter: searchData }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('addLogisticsInfo', {
    description: "Add logistics information of an order.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "Customer Id.", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id.", http: { source: 'path' } },
    { arg: 'logisticsData', type: 'AddLogisticsInfoRequest', required: true, description: "logistics information.", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/transactionId/:transactionId/attachLogistics', verb: 'post', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.addLogisticsInfo = function (customerId, transactionId, logisticsData, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    CustomerMicroService.TransactionAPI_getTransactionById({ customerId: customerId, transactionId: transactionId }).then(result => {
      return OrderMicroService.OrderAPI_attachLogistics({ logistics: logisticsData });
    }).then(() => {
      cb(null, { isSuccess: true });
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
    CustomerMicroService.AddressAPI_addAddress({ customerId: customerId, addressData: addressData }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('modifyAddress', {
    description: "Modify shipping address.",
    accepts: [{ arg: 'customerId', type: 'string', required: true, description: "CustomerId Id", http: { source: 'path' } },
    { arg: 'addressData', type: 'ModifyAddressRequest', required: true, description: "Address information", http: { source: 'body' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/modifyAddress', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.modifyAddress = function (customerId, addressData, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    CustomerMicroService.AddressAPI_modifyAddress({ customerId: customerId, addressData: addressData }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('getAddress', {
    description: "Get shipping address.",
    accepts: { arg: 'customerId', type: 'string', required: true, description: "Customer Id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Address'], description: "", root: true },
    http: { path: '/workspace/customerId/:customerId/getAddress', verb: 'get', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.getAddress = function (customerId, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    CustomerMicroService.AddressAPI_getAddress({ customerId: customerId }).then(result => {
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
    Promise.map(addressIds, addressId => {
      return CustomerMicroService.AddressAPI_deleteAddress({ addressId: addressId });
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