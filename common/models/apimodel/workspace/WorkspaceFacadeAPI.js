'use strict'
var app = require('../../../../server/server.js');
var loopback = require('loopback');
var nodeUtil = require('util');
var moment = require('moment');
var Promise = require('bluebird');
var errorConstant = require('../../../../server/constants/errorConstants.js');

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
    http: { path: '/workspace/userId/:userId/createTransaction', verb: 'post', status: 200, errorStatus: 500 }
  });

  WorkspaceFacadeAPI.createTransaction = function (userId, orderParams, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.TransactionAPI_createTransaction({ userId: userId, createData: orderParams }).then(result => {
    }).then(() => {
      cb(null, { isSuccess: true });
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('payTransaction', {
    description: "Pay an order.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User Id.", http: { source: 'path' } },
    { arg: 'transactionId', type: 'string', required: true, description: "Transaction Id", http: { source: 'path' } }],
    returns: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/workspace/userId/:userId/transactionId/:transactionId/payTransaction', verb: 'put', status: 200, errorStatus: 500 }
  });
  WorkspaceFacadeAPI.payTransaction = function (userId, transactionId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    //TBD third part pay.
    let updateData = {
      status: "payed",
      payedDate: moment().local().format('YYYY-MM-DD hh:mm:ss')
    }
    UserMicroService.TransactionAPI_updateTransaction({ transactionId: transactionId, updateData: updateData }).then(() => {
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
    UserMicroService.TransactionAPI_searchTransaction({ filter: { userId: userId } }).then(result => {
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
    UserMicroService.TransactionAPI_getTransactionById({ transactionId: transactionId }).then(result => {
      let transaction = result.obj;
      logisticsData = logisticsData.__data;
      for(let key in logisticsData)
        transaction.logistics[key] = logisticsData[key];
      transaction.logistics.sendDate = moment().local().format('YYYY-MM-DD hh:mm:ss');
      return UserMicroService.TransactionAPI_updateTransaction({ transactionId: transactionId, updateData: transaction});
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
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: "", root: true },
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

  WorkspaceFacadeAPI.remoteMethod('getStoreList', {
    description: "Get stores.",
    accepts: { arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } },
    returns: { arg: 'resp', type: ['Store'], description: 'is success or not', root: true },
    http: { path: '/workspace/user/:userId/getStoreList', verb: 'get', status: 200, errorStatus: [500] }
  });
  WorkspaceFacadeAPI.getStoreList = function (userId, cb) {
    var OrderMicroService = loopback.findModel("OrderMicroService");
    OrderMicroService.StoreAPI_getStoreList().then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    })
  }

  WorkspaceFacadeAPI.remoteMethod('addToShoppingList', {
    description: "Add a product to user's shopping cart.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } },
    { arg: 'productId', type: 'string', required: true, description: "Product id", http: { source: 'path' } },
    { arg: 'quantity', type: 'string', required: true, description: "Quantity", http: { source: 'query' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/workspace/user/:userId/product/:productId/addToShoppingList', verb: 'post', status: 200, errorStatus: [500] }
  });
  WorkspaceFacadeAPI.addToShoppingList = function (userId, productId, quantity, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_addToShoppingList({ userId: userId, productId: productId, quantity: quantity }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  WorkspaceFacadeAPI.remoteMethod('updateShoppingList', {
    description: "Update user's shopping cart.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } },
    { arg: 'data', type: ['ShoppingCartItem'], required: true, description: "User id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: 'IsSuccessResponse', description: 'is success or not', root: true },
    http: { path: '/workspace/user/:userId/updateShoppingList', verb: 'get', status: 200, errorStatus: [500] }
  });
  WorkspaceFacadeAPI.updateShoppingList = function (userId, data, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    UserMicroService.UserAPI_updateShoppingList({ userId: userId, data: data }).then(result => {
      cb(null, result.obj);
    }).catch(err => {
      cb(err, null);
    });
  }

  WorkspaceFacadeAPI.remoteMethod('getShoppingList', {
    description: "Get user's shopping cart items.",
    accepts: [{ arg: 'userId', type: 'string', required: true, description: "User id", http: { source: 'path' } }],
    returns: { arg: 'resp', type: ['GetShoppingListResponse'], description: 'is success or not', root: true },
    http: { path: '/workspace/user/:userId/getShoppingList', verb: 'get', status: 200, errorStatus: [500] }
  });
  WorkspaceFacadeAPI.getShoppingList = function (userId, cb) {
    var UserMicroService = loopback.findModel("UserMicroService");
    var OrderMicroService = loopback.findModel("OrderMicroService");
    let resp = [];
    UserMicroService.UserAPI_getShoppingList({ userId: userId }).then(result => {
      return Promise.map(result.obj, item => {
        return OrderMicroService.OrderAPI_getProductsById({ productId: item.productId }).then(result => {
          item.name = result.obj.name;
          item.description = result.obj.description;
          item.price = result.obj.price;
          resp.push(item);
          return Promise.resolve();
        });
      });
    }).then(() => {
      cb(null, resp);
    }).catch(err => {
      cb(err, null);
    });
  }
}