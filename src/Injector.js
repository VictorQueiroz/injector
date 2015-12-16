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

Injector.extractArgs = function(string) {
	var args = string.split(FN_ARGS_SPLIT),
			inject = [],
			length = args.length;

	while(length--) {
		args[length].replace(FN_ARG, function(all, underscore, name) {
			inject[length] = name;
		});
	}

	return inject;
};

Injector.deps = function(fn) {
	var matches = match(toString(fn), FN_ARGS);

	return this.extractArgs(matches[1]);
};

Injector.annotate = function(fn) {
	return this.deps(fn).concat(fn);
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

				return (cache[name] = this.load(name, pending[name]));
			} catch(err) {
				if(cache[name] === INSTANTIATING) {
					delete cache[name];
				}

				throw err;
			} finally {
				path.shift();
			}
		} else {
			throw new Error('service ' + name + ' not found');
		}
	},

	load: function(name, factory) {
		var deps,
				length,
				service,
				injector = this;

		if(Array.isArray(factory)) {
			deps = factory.slice(0, -1);
			factory = factory[factory.length - 1];
		} else if(Array.isArray(factory.$inject)) {
			deps = factory.$inject;
		} else {
			deps = Injector.deps(factory);
		}

		length = deps.length;

		while(length--) {
			deps[length] = this.get(deps[length]);
		}

		return factory.apply(null, deps);
	}
};