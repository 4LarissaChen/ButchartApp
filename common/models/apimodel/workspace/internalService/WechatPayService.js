var request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');
var settings = JSON.parse(fs.readFileSync('/Users/miko/Documents/Study/projects/ButchartApp/server/config.json')).features.wechatPay;
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
    var string = this.raw(data);
    string = string + '&key=' + settings.key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
    var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
    return sign.toUpperCase();
  }

  raw(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
      newArgs[key.toLowerCase()] = args[key];
    });
    var string = '';
    for (var k in newArgs) {
      string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    console.log(string);
    return string;
  };

  // 随机字符串产生函数
  createNonceStr() {
    return Math.random().toString(36).substr(2, 15);
  };

  //微信支付函数
  pay(transactionId, totalPrice, ip) {
    var self = this;
    var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var appid = settings.appid;//应用微信中的id
    var mch_id = settings.mch_id;//商户号
    var notify_url = 'http://wxpay.weixin.qq.com/pub_v2/pay/notify.v2.php';//回调通知地址
    var out_trade_no = 'transaction_111111111';//订单号
    var total_fee = 1000;//商品价格
    var attach = 'Butchart布查德';
    var body = "花束产品"; //客户端商品描述
    var nonce_str = self.createNonceStr();//随机32位之内字符串
    var formData = "<xml>";
    formData += "<appid>" + appid + "</appid>"; //appid
    formData += "<attach>" + attach + "</attach>"; //附加数据
    formData += "<body>" + body + "</body>"; //商品或支付单简要描述
    formData += "<mch_id>" + mch_id + "</mch_id>"; //商户号
    formData += "<nonce_str>" + nonce_str + "</nonce_str>"; //随机字符串，不长于32位
    formData += "<notify_url>" + notify_url + "</notify_url>"; //支付成功后微信服务器通过POST请求通知这个地址
    formData += "<out_trade_no>" + out_trade_no + "</out_trade_no>"; //订单号
    formData += "<spbill_create_ip>" + '112.245.218.223' + "</spbill_create_ip>"; //服务端ip
    formData += "<total_fee>" + total_fee + "</total_fee>"; //金额
    formData += "<trade_type>APP</trade_type>"; //类型APP
    formData += "<sign>" + self.generatePaySignment(appid, attach, body, mch_id, nonce_str, notify_url, out_trade_no, '112.245.218.223', total_fee, 'APP') + "</sign>";
    formData += "</xml>";
    request(
      {
        url: url,
        method: 'POST',
        body: formData
      }, function (err, response, body) {
        if (!err && response.statusCode == 200) {
          console.log(body);
          var parser = new xml2js.Parser({ trim: true, explicitArray: false, explicitRoot: false });//解析签名结果xml转json
          parser.parseString(body, function (err, result) {
            var timeStamp = Date.parse(new Date()) / 1000;
            var sign = paySignTwo(appid, nonce_str, 'Sign=WXPay', mch_id, result['prepay_id'], timeStamp);//得到prepay再次签名
            res.send({ result: { 'appid': appid, 'mch_id': mch_id, 'prepay_id': result['prepay_id'], 'nonce_str': nonce_str, 'time_stamp': timeStamp, 'package_value': 'Sign=WXPay', 'sign': sign } });//返回客户端数据
          });
        }
      });
  }
}

var wechatPayService = new WechatPayService();
wechatPayService.pay();

exports.module = WechatPayService;