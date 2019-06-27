var request = require('request');

var xml2js = require('xml2js');

function paysign(appid, attach, body, mch_id, nonce_str, notify_url, out_trade_no, spbill_create_ip, total_fee, trade_type) {

  var ret = {

    appid: appid,

    attach: attach,

    body: body,

    mch_id: mch_id,

    nonce_str: nonce_str,

    notify_url: notify_url,

    out_trade_no: out_trade_no,

    spbill_create_ip: spbill_create_ip,

    total_fee: total_fee,

    trade_type: trade_type

  };

  var string = raw(ret);

  var key = '密钥'; //微信商户密钥

  string = string + '&key=' + key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置

  var crypto = require('crypto');

  var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');

  return sign.toUpperCase();

};



//解析xml数据

function getXMLNodeValue(node_name, xml) {

  var tmp = xml.split("<" + node_name + ">");

  var _tmp = tmp[1].split("</" + node_name + ">");

  var tmp1 = _tmp[0].split('[');

  var _tmp1 = tmp1[2].split(']');

  return _tmp1[0];

}



function raw(args) {

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

function createNonceStr() {

  return Math.random().toString(36).substr(2, 15);

};



exports.pay = function (req, res) //微信支付函数

{

  var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";

  var appid = 'wx2421b1c4370ec43b';//应用微信中的id

  var mch_id = '1511515151';//商户号

  var notify_url = 'http://wxpay.weixin.qq.com/pub_v2/pay/notify.v2.php';//回调通知地址

  var out_trade_no = req.body.orderId;//订单号

  var total_fee = req.body.orderRate;//商品价格

  var attach = 'feeLT运动App';

  var body = req.body.content; //客户端商品描述

  var nonce_str = createNonceStr();//随机32位之内字符串

  var formData = "<xml>";

  formData += "<appid>" + appid + "</appid>"; //appid

  formData += "<attach>" + attach + "</attach>"; //附加数据

  formData += "<body>" + body + "</body>"; //商品或支付单简要描述

  formData += "<mch_id>" + mch_id + "</mch_id>"; //商户号

  formData += "<nonce_str>" + nonce_str + "</nonce_str>"; //随机字符串，不长于32位

  formData += "<notify_url>" + notify_url + "</notify_url>"; //支付成功后微信服务器通过POST请求通知这个地址

  formData += "<out_trade_no>" + out_trade_no + "</out_trade_no>"; //订单号

  formData += "<spbill_create_ip>120.79.65.254</spbill_create_ip>"; //服务端ip

  formData += "<total_fee>" + total_fee + "</total_fee>"; //金额

  formData += "<trade_type>APP</trade_type>"; //类型APP

  formData += "<sign>" + paysign(appid, attach, body, mch_id, nonce_str, notify_url, out_trade_no, '120.79.65.254', total_fee, 'APP') + "</sign>";

  formData += "</xml>";

  request({

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



function buildXML(json) {

  var builder = new xml2js.Builder();

  return builder.buildObject(json);

};



function paySignTwo(appid, notifystr, packagevalue, mchid, prepayid, timestamp) { //参数名不可改，必须严格一模一样（在此我掉坑一次）

  var ret = {

    appid: appid,

    noncestr: notifystr,

    package: packagevalue,

    partnerid: mchid,

    prepayid: prepayid,

    timestamp: timestamp

  };

  var string = raw(ret);

  var key = '密钥';

  string = string + '&key=' + key; //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置

  var crypto = require('crypto');

  console.log("签名");

  console.log(crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase());

  return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();

};