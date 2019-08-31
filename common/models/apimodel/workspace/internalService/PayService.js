var xml2js = require('xml2js');
var fs = require('fs');
var settings = JSON.parse(fs.readFileSync(global.appRoot + 'server/config.json')).features.wechatPay;
var crypto = require('crypto');
var rp = require('request-promise');
var moment = require('moment');
const {
  PubPay,
  RequestError,
  CommunicationError,
  utils: { getXMLBody }
} = require("@sigodenjs/wechatpay");
const pay = new PubPay({
  appId: settings.appId,
  key: settings.key,
  mchId: settings.mch_id
});
class PayService {
  wechatH5Pay(transactionId, totalPrice, ip, openid) {
    return pay.setDebug(true).then(result => {
      return pay.unifiedOrder({
        openid: openid,
        body: "花束产品",
        out_trade_no: transactionId,
        total_fee: 1,
        spbill_create_ip: ip,
        notify_url: 'http://wxpay.weixin.qq.com/pub_v2/pay/notify.v2.php'
      });
    }).then(result => {
      console.log(result);
    })
  }
}
module.exports = PayService;