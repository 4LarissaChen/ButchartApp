var request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');
var settings = JSON.parse(fs.readFileSync(global.appRoot + 'server/config.json')).features.wechatPay;
var crypto = require('crypto');
var rp = require('request-promise');
var moment = require('moment');
const tenpay = require('tenpay');
const config = {
  appid: settings.appid,
  mchid: settings.mch_id,
  partnerKey: settings.key,
  pfx: fs.readFileSync(global.appRoot + 'butchart.p12'),
  notify_url: 'https://www.thebutchart.cn:4000/notify'
};
class WechatPay {
  wechatPay(userId, transactionId, orderParams) {
    let UserMicroService = loopback.findModel("UserMicroService");
    let api = new tenpay(config, true);
    let body = "";
    orderParams.productList.forEach(product => {
      body += product.name + " x " + product.quantity + "; ";
    })
    return UserMicroService.UserAPI_getUserOpenId({userId: userId}).then(result => {
      return api.unifiedOrder({
        out_trade_no: transactionId,
        body: body,
        total_fee: (orderParams.totalPrice * 100).toString(),
        openid: result.openId
      });
    }).then(result => {
      return api.getPayParamsByPrepay({
        prepay_id: result.prepay_id
      });
    })
  }

  getTransactionStatus(transactionId) {
    let api = new tenpay(config, true);
    return api.orderQuery({ transaction_id: transactionId });
  }

  getOpenid(code) {
    let url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + settings.appid + "&secret=" + settings.app_Secret + "&code=" + code + "&grant_type=authorization_code";
    let option = {
      method: 'GET',
      url: url
    };
    return rp(option).then(result => {
      result = JSON.parse(result);
      if (result.openid)
        return result.openid;
      else
        throw Error(result.errmsg);
    }).catch(err => {
      console.log(err);
      throw Error(err);
    })
  }

}
module.exports = WechatPay;