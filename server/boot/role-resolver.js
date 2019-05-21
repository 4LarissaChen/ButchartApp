var loopback = require('loopback');

module.exports = function (app) {
	var Role = app.models.Role;

	function reject(cb) {
		process.nextTick(function () {
			cb(null, false);
		});

	}

	//订单所有者
	Role.registerResolver('TransactionOwner', function (role, context, cb) {

		var UserMicroService = loopback.findModel("UserMicroService");

		if (context.modelName != "WorkspaceFacadeAPI") return reject(cb);
		if (!context.remotingContext.args.transactionId) return reject(cb);

		var transactionId = context.remotingContext.args.transactionId;
		UserMicroService.TransactionAPI_getTransactionOwnerId({ transactionId: transactionId }).then(result => {
			var userId = result.obj.userId;
			if (userId == context.accessToken.userId) {
				cb(null, true);
			} else {
				return reject(cb);
			}
		}).catch(function (err) {
			return reject(cb);
		})

	});

	//该订单所分配的花艺师
	Role.registerResolver('TransactionEditor', function (role, context, cb) {

		var UserMicroService = loopback.findModel("UserMicroService");

		if (context.modelName != "WorkspaceFacadeAPI") return reject(cb);
		if (!context.remotingContext.args.transactionId) return reject(cb);

		var transactionId = context.remotingContext.args.transactionId;
		UserMicroService.TransactionAPI_getTransactionOwnerId({ transactionId: transactionId }).then(function (result) {
			var floristId = result.obj.floristId;
			if (floristId == context.accessToken.userId) {
				cb(null, true);
			} else {
				return reject(cb);
			}
		}).catch(function (err) {
			return reject(cb);
		})

	});

};
