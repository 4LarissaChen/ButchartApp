var request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');
var settings = JSON.parse(fs.readFileSync(global.appRoot + 'server/config.json')).features.wechatPay;
var crypto = require('crypto');

class WechatPayService {
  pay() {

  }
  generatePaySignment(attach, body, nonce_str, notify_url, out_trade_no, spbill_create_ip, total_fee, trade_type) {
    var data = {
      appid: settings.appid,
      attach: attach,
      body: body,
      mch_id: settings.mch_id,
      nonce_str: nonce_str,
      notify_url: notify_url,
      out_trade_no: out_trade_no,
      spbill_create_ip: spbill_create_ip,
      total_fee: total_fee,
      trade_type: trade_type
    };
    var string = raw(data);
    string = string + '&key=' + settings.key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
    var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
    return sign.toUpperCase();
  }
}

exports.module = WechatPayService;