var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARGS_SPLIT = /,/;

function isDefined(value) {
	return !isUndefined(value);
}

function isUndefined(value) {
	return typeof value == 'undefined';
}

function isString(value) {
	return typeof value == 'string';
}

var toString = function(v) {
	return v.toString();
};

var match = function(v, regexp) {
	return v.match(regexp);
};

function extractDeps (fn) {
	var matches = match(toString(fn), FN_ARGS);

	return extractArgs(matches[1]);
}

function extractArgs (string) {
	var args = string.split(FN_ARGS_SPLIT),
			inject = [],
			length = args.length;

	while(length--) {
		args[length].replace(FN_ARG, function(all, underscore, name) {
			inject[length] = name;
		});
	}

	return inject;
}

Injector.extractArgs = extractArgs;
Injector.extractDeps = extractDeps;

Injector.annotate = function(fn) {
	return this.extractDeps(fn).concat(fn);
};

var INSTANTIATING = {};
var INJECTOR_MODULE_NAME = 'injector';

function Injector(pending, cache) {
	this.path = [];
	this.cache = cache || {};
	this.pending = pending;
}

Injector.prototype = {
	get: function(name) {
		if(name == INJECTOR_MODULE_NAME) {
			return this;
		}

		var path = this.path,
				cache = this.cache,
				pending = this.pending;

		if(cache.hasOwnProperty(name)) {
			if(cache[name] === INSTANTIATING) {
				throw new Error('Circular dependency found: ' + name + ' <- ' + path.join(' <- '));
			}

			return cache[name];
		} else if(pending.hasOwnProperty(name)) {
			try {
				path.unshift(name);

				cache[name] = INSTANTIATING;

				return (cache[name] = this.invoke(pending[name]));
			} catch(err) {
				if(cache[name] === INSTANTIATING) {
					delete cache[name];
				}

				throw err;
			} finally {
				path.shift();
			}
		} else {
			throw new Error('Service "' + name + '" not found');
		}
	},

	invoke: function(factory) {
		var deps,
				length,
				service,
				injector = this;

		if(Array.isArray(factory)) {
			deps = factory;

			if(typeof (factory = factory.pop()) != 'function') {
				throw new Error('The last item of the array must be the service factory');
			}
		} else if(Array.isArray(factory.$inject)) {
			deps = factory.$inject;
		} else {
			deps = extractDeps(factory);
		}

		length = deps.length;

		// Load the module dependencies first
		while(length--) {
			deps[length] = this.get(deps[length]);
		}

		return factory.apply(null, deps);
	}
};