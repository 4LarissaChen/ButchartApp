var request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');
var settings = JSON.parse(fs.readFileSync(global.appRoot + 'server/config.json')).features.wechatPay;
var crypto = require('crypto');
var rp = require('request-promise');
var moment = require('moment');

class WechatPayService {
  generatePaySignment(attach, body, nonce_str, notify_url, out_trade_no, spbill_create_ip, total_fee, trade_type, openid) {
    var data = {
      appid: settings.appid,
      attach: attach,
      body: body,
      mch_id: settings.mch_id,
      nonce_str: nonce_str,
      notify_url: notify_url,
      openid: openid,
      out_trade_no: out_trade_no,
      spbill_create_ip: spbill_create_ip,
      total_fee: total_fee,
      trade_type: trade_type
    };
    return this.sign(data);
  }

  sign(data) {
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

  getAccessToken() {
    let url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + settings.appid + "&secret=" + settings.app_Secret;
    let option = {
      method: 'GET',
      url: url
    };
    return rp(option).then(result => {
      return JSON.parse(result);
    }).catch(err => {
      console.log(err);
      throw Error(err);
    });
  }

  getSignature(timestamp, noncestr) {

    let data = {
      url: "https://www.thebutchart.cn/pay",
      timestamp: timestamp,
      noncestr: noncestr,
      jsapi_ticket: global.settings.wxConfig.jsapi_ticket
    }
    let str = "jsapi_ticket=" + data.jsapi_ticket + "&noncestr=" + data.noncestr + "&timestamp=" + data.timestamp + "&url=" + data.url;
    return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
  }

  //微信支付函数
  wechatH5Pay(transactionId, totalPrice, ip, openid) {
    var self = this;
    let data;
    var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var appid = settings.appid;//应用微信中的id
    var mch_id = settings.mch_id;//商户号
    var notify_url = 'http://wxpay.weixin.qq.com/pub_v2/pay/notify.v2.php';//回调通知地址
    var out_trade_no = transactionId;//订单号
    var total_fee = totalPrice * 100;//商品价格
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
    formData += "<openid>" + openid + "</openid>"; //openid
    formData += "<out_trade_no>" + out_trade_no + "</out_trade_no>"; //订单号
    formData += "<spbill_create_ip>" + ip + "</spbill_create_ip>"; //服务端ip
    formData += "<total_fee>" + total_fee + "</total_fee>"; //金额
    formData += "<trade_type>" + settings.trade_type + "</trade_type>"; //类型APP
    formData += "<sign>" + self.generatePaySignment(attach, body, nonce_str, notify_url, out_trade_no, ip, total_fee, settings.trade_type, openid) + "</sign>";
    formData += "</xml>";
    console.log(formData);
    let option = {
      method: 'POST',
      url: url,
      body: formData
    }
    return rp(option).then(result => {
      let resp;
      console.log(result);
      var parser = new xml2js.Parser({ trim: true, explicitArray: false, explicitRoot: false });//解析签名结果xml转json
      parser.parseString(result, function (err, data) {
        resp = data;
        return;
      });
      data = {
        "appId": settings.appid,     //公众号名称，由商户传入
        "timeStamp": parseInt(new Date().getTime() / 1000).toString(),         //时间戳，自1970年以来的秒数
        "nonceStr": resp.nonce_str, //随机串 // 通过统一下单接口获取
        "package": "prepay_id=" + resp.prepay_id,
        "signType": "MD5",         //微信签名方式：
      }
      console.log("二次加密data: " + JSON.stringify(data));
      data.paySign = self.sign(data);
      return self.getSignature(data.timeStamp, data.nonceStr)
    }).then(result => {
      data.jsapi_ticket = global.settings.wxConfig.jsapi_ticket;
      data.access_token = global.settings.wxConfig.jsapi_ticket;
      data.signature = result;
      return data;
    }).catch(err => {
      throw err;
    })

  }

  paySignTwo(appid, notifystr, packagevalue, mchid, prepayid, timestamp) { //参数名不可改，必须严格一模一样（在此我掉坑一次）
    let self = this;
    var ret = {
      appid: appid,
      noncestr: notifystr,
      package: packagevalue,
      partnerid: mchid,
      prepayid: prepayid,
      timestamp: timestamp
    };
    var string = self.raw(ret);
    var key = settings.key;
    string = string + '&key=' + key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
    console.log("签名");
    console.log(crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase());
    return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();
  };
}

module.exports = WechatPayService;