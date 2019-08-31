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
  appId: settings.appid,
  key: settings.key,
  mchId: settings.mch_id
});
class PayService {
  wechatH5Pay(transactionId, totalPrice, ip, openid) {
    return pay.setDebug(true).then(result => {
      return pay
      .unifiedOrder({
        body: "花束产品",
        out_trade_no: transactionId,
        total_fee: 888,
        spbill_create_ip: ip,
        notify_url: "http://wxpay.weixin.qq.com/pub_v2/pay/notify.v2.php",
        trade_type: "JSAPI",
        openid: openid
      })
      .then(res => {
        if (!pay.verifySign(res)) {
          // 签名校验失败
          throw new Error("签名校验失败");
        }
        if (res.result_code === "FAIL") {
          console.log(res.err_code, res.err_code_des);
        } else {
          console.log(res.prepay_id);
        }
      })
      .catch(err => {
        if (err instanceof RequestError) {
          // 请求错误
        } else if (err instanceof CommunicationError) {
          // return_code = FAIL
        }
      });
    
      // return pay.unifiedOrder({
      //   openid: openid,
      //   body: "花束产品",
      //   out_trade_no: transactionId,
      //   total_fee: 1,
      //   spbill_create_ip: ip,
      //   notify_url: 'http://wxpay.weixin.qq.com/pub_v2/pay/notify.v2.php'
      // });
    }).then(result => {
      console.log(result);
    })
  }
}
module.exports = PayService;