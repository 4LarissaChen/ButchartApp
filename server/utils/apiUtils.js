'use strict'
var shortid = require('shortid');

exports.disableRelatedModelRemoteMethod = function (model) {
	var keys = Object.keys(model.definition.settings.relations);
	keys.forEach(relation => {
		model.disableRemoteMethodByName("prototype.__findById__" + relation);
		model.disableRemoteMethodByName("prototype.__destroyById__" + relation);
		model.disableRemoteMethodByName("prototype.__updateById__" + relation);
		model.disableRemoteMethodByName("prototype.__link__" + relation);
		model.disableRemoteMethodByName("prototype.__unlink__" + relation);
		model.disableRemoteMethodByName("prototype.__get__" + relation);
		model.disableRemoteMethodByName("prototype.__create__" + relation);
		model.disableRemoteMethodByName("prototype.__delete__" + relation);
		model.disableRemoteMethodByName("prototype.__update__" + relation);
		model.disableRemoteMethodByName("prototype.__findOne__" + relation);
		model.disableRemoteMethodByName("prototype.__count__" + relation);
		model.disableRemoteMethodByName("prototype.__exists__" + relation);
	})
}