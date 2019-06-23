'use strict';

exports.ERROR_MESSAGE_NO_MODEL_FOUND = "The target %s is not found";  // e.g. The User is not found

/**
 * API Response Error Code
 */
exports.ERROR_CODE_INVALID_INPUT_PARAMETERS = 400;
exports.ERROR_CODE_NOT_AUTHORIZED = 401;
exports.ERROR_CODE_FORBIDDEN = 403;
exports.ERROR_CODE_NO_MODEL_FOUND = 404;
exports.ERROR_CODE_INTERNAL_SERVER_ERROR = 500;

/**
 * API Response Error Name
 */
exports.ERROR_NAME_INVALID_INPUT_PARAMETERS = "'%s' is Invalid in Input Parameters '%s'";
exports.ERROR_MESSAGE_NO_MODEL_FOUND = "The target %s is not found";   // e.g. The Architecture is not found
exports.ERROR_MESSAGE_ENTITY_NOT_FOUND = "The target %s is not found";

exports.ERROR_MESSAGE_CODE_INVALID = "The message code is invalid";


exports.SMS_SERVICE_ERROR_CODE = {
  "isp.RAM_PERMISSION_DENY": "RAM权限DENY",
  "isv.OUT_OF_SERVICE": "业务停机",
  "isv.PRODUCT_UN_SUBSCRIPT": "未开通云通信产品的阿里云客户",
  "isv.PRODUCT_UNSUBSCRIBE": "产品未开通",
  "isv.ACCOUNT_NOT_EXISTS": "账户不存在",
  "isv.ACCOUNT_ABNORMAL": "账户异常",
  "isv.SMS_TEMPLATE_ILLEGAL": "短信模板不合法",
  "isv.SMS_SIGNATURE_ILLEGAL": "短信签名不合法",
  "isv.INVALID_PARAMETERS": "参数异常",
  "isp.SYSTEM_ERROR": "系统错误",
  "isv.MOBILE_NUMBER_ILLEGAL": "非法手机号",
  "isv.MOBILE_COUNT_OVER_LIMIT": "手机号码数量超过限制",
  "isv.TEMPLATE_MISSING_PARAMETERS": "模板缺少变量",
  "isv.BUSINESS_LIMIT_CONTROL": "业务限流",
  "isv.INVALID_JSON_PARAM": "JSON参数不合法，只接受字符串值",
  "isv.BLACK_KEY_CONTROL_LIMIT": "黑名单管控",
  "isv.PARAM_LENGTH_LIMIT": "参数超出长度限制",
  "isv.PARAM_NOT_SUPPORT_URL": "不支持URL",
  "isv.AMOUNT_NOT_ENOUGH": "账户余额不足"
};
