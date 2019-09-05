'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var https = require('https');
var fs = require('fs');
var path = require('path');
global.settings = (process.env.NODE_ENV != undefined) ? require('./config.' + process.env.NODE_ENV + '.json') : require('./config.json');
global.appRoot = path.join(__dirname, '../');
var app = module.exports = loopback();
var env = process.env.NODE_ENV;
var xml2js = require('xml2js');
var WechatPayService = require('../common/models/apimodel/workspace/internalService/WechatPayService.js');
var WechatPay = require('../common/models/apimodel/workspace/internalService/WechatPay.js');
app.start = function () {

  var server = https.createServer({
    key: fs.readFileSync(global.appRoot + '/2473055_www.thebutchart.cn.key'),
    cert: fs.readFileSync(global.appRoot + '/2473055_www.thebutchart.cn.pem')
  }, app);

  server.listen(app.get('port'), function () {
    var baseUrl = 'https://' + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
  return server;
  // start the web server
  // return app.listen(function() {

  //   app.emit('started');
  //   var baseUrl = app.get('url').replace(/\/$/, '');
  //   console.log('Web server listening at: %s', baseUrl);
  //   if (app.get('loopback-component-explorer')) {
  //     var explorerPath = app.get('loopback-component-explorer').mountPath;
  //     console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
  //   }
  // });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

app.use('/notify', function (req, res, next) {
  var UserMicroService = loopback.findModel('UserMicroService');
  const getRawBody = require('raw-body');
  var contentType = require('content-type');
  const util = require('./utils/wechatPayUtils.js');
  const replyData = msg => util.buildXML(msg ? { return_code: 'FAIL', return_msg: msg } : { return_code: 'SUCCESS' });
  let receivedXml;
  let wechatPayService = new WechatPayService();
  let wechatPay = new WechatPay();
  return getRawBody(req, {
    length: req.headers['content-length'],
    limit: '1mb',
    encoding: contentType.parse(req).parameters.charset
  }).then(result => {
    receivedXml = result;
    let receivedObj;
    var parser = new xml2js.Parser({ trim: true, explicitArray: false, explicitRoot: false });//解析签名结果xml转json
    parser.parseString(receivedXml, function (err, data) {
      receivedObj = data;
      return;
    });
    console.log("Received data: " + JSON.stringify(receivedObj));
    if (receivedObj.return_code == 'FAIL') {
      //ctx.status = 200
      //ctx.body = '<xml><return_code><![CDATA[FAIL]]></return_code></xml>'
      res.header('Content-Type', 'application/xml; charset=utf-8')
      console.log("支付失败");
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>')
    }
    let respSign = receivedObj.sign;
    delete receivedObj.sign;
    let checkSign = wechatPayService.generatePaySignment(receivedObj); //这个方法已经封装成自动剔除 sign 参数了。
    console.log('checkSign: ' + checkSign);
    if (checkSign !== respSign) receivedObj.result_code = 'FAIL';
    if (receivedObj.result_code == 'FAIL') {
      //支付失败的情况，日志记录一下，返回结果就好
      console.log(`pay error!! ${receivedObj.transaction_id}: { errcode:${receivedObj.err_code},err_desc:${receivedObj.err_code_des}  }`)
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>')
    }
    return new Promise((resolve, reject) => {
      resolve(UserMicroService.TransactionAPI_getTransactionById({ transactionId: receivedObj.out_trade_no }).then(result => {
        var transaction = result.obj;
        if (transaction.status == 'Payed') {
          console.log("订单已支付，返回SUCCESS");
          return res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
        }
        let returnCode = 'SUCCESS', returnResult = 'OK';
        let replyXmlTpl = '<xml>' +
          '<return_code><![CDATA[SUCCESS]]></return_code>' +
          '<return_msg><![CDATA[OK]]></return_msg>' +
          '</xml>'
        return wechatPay.getTransactionStatus(receivedObj.transaction_id).then(result => {
          console.log("微信订单查询结果: " + JSON.stringify(result));
          if (result.trade_state && result.trade_state == 'SUCCESS') {
            return UserMicroService.TransactionAPI_updateTransaction({ transactionId: transaction._id, updateData: { status: 'Payed' } }).then(() => {
              console.log("订单状态更改成功，返回SUCCESS");
              return res.send(replyXmlTpl);
            });
          } else {
            returnCode = 'FAIL'; returnResult = '支付结果校验失败';
            replyXmlTpl = replyXmlTpl
              .replace(/%returnCode%/, returnCode)
              .replace(/%returnResult%/, returnResult);
            console.log("查询结果有误，返回FAIL");
            return res.send(replyXml);
          }
        });
      })
      );
    });
  })
})
