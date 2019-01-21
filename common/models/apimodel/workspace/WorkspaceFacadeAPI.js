'use strict'
var app = require('../../../../server/server.js');
var moment = require('moment');
var Promise = require('bluebird');
var loopback = require('loopback');

var apiUtils = require('../../../../server/utils/apiUtils.js');

module.exports = function (WorkspaceFacadeAPI) {
  apiUtils.disableRelatedModelRemoteMethod(WorkspaceFacadeAPI);

  WorkspaceFacadeAPI.remoteMethod('login', {
    description: "Customer login.",
    accepts: [{ arg: 'tel', type: 'string', required: true, description: "User telephone number", http: { source: 'query' } },
    { arg: 'code', type: 'string', required: true, description: "Verification code", http: { source: 'query' } }],
    return: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/customer/login', verb: 'post', status: 200, errorStatus: [500] }
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
    return: { arg: 'isSuccess', type: 'IsSuccessResponse', description: "", root: true },
    http: { path: '/customer/sendMessage/:tel', verb: 'put', status: 200, errorStatus: [500] }
  });
  WorkspaceFacadeAPI.sendMessage = function (tel, operation, cb) {
    var CustomerMicroService = loopback.findModel("CustomerMicroService");
    CustomerMicroService.CustomerAPI_sendMessage({ tel: tel, operation: operation }).then(result => {
      cb(null, result.obj)
    }).catch(err => {
      cb(err, null);
    })
  }
}