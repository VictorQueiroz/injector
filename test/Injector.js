describe('Injector', function() {
	var cache,
			pending,
			injector,
			serviceFn;

	beforeEach(function() {
		cache = {};
		pending = {};
		injector = new Injector(pending);

		serviceFn = function(Q, $, parse, scope) {
			return function(exp) {
				return parse(exp, scope) && $('.panel-content').html();
			};
		};
	});

	describe('constructor', function(){
		describe('deps()', function() {
			it('should get dependencies from an anonymous function', function() {
				expect(Injector.deps(serviceFn)).toEqual(['Q', '$', 'parse', 'scope']);
			});

			it('should get dependencies from a named function', function() {
				function namedFunction (Q, $, parse, scope){
					return 0;					
				}

				expect(Injector.deps(namedFunction)).toEqual(['Q', '$', 'parse', 'scope']);
			});

			it('should return empty array when no dependecy is found', function() {
				expect(Injector.deps(function() {})).toEqual([]);
			});
		});

		describe('annotate()', function() {
			it('should annotate an anonymous function', function() {
				var annotatedService = Injector.annotate(serviceFn);

				expect(annotatedService.slice(0, annotatedService.length - 1)).toEqual([
					'Q',
					'$',
					'parse',
					'scope'
				]);
				expect(annotatedService[annotatedService.length - 1]).toBe(serviceFn);
			});
		});
	});

	describe('get()', function() {
		var extend = function(dest, src) {
			for(var key in src) {
				dest[key] = src[key];
			}

			return dest;
		};

		beforeEach(function() {
			extend(pending, {
				independentModule: function() {
					return {
						sum: function(v, f) {
							return (v + f);
						}
					};
				},

				anotherModuleHere: function(independentModule) {
					return function(v) {
						return independentModule.sum(v * 2, 4);
					};
				},

				someModuleHere: function(anotherModuleHere) {
					return anotherModuleHere(8);
				},

				circularModule: function(circular) {
					return { isCircular: circular };
				},

				circular: function(circularModule) {
					return true;
				}
			});
		});

		afterEach(function() {
			pending = {};
			cache = {};
		});

		it('should get the own injector in a dependency', function() {
			pending.goodModule = ['injector', function($injector) {
				return $injector;
			}];

			expect(injector.get('goodModule')).toBe(injector);
		});

		it('should get array annotated services', function() {
			pending.dep1 = function() {
				return function() {
					return 1;
				};
			};

			pending.arrayNotated = ['dep1', function(dep){
				return dep();
			}];

			expect(injector.get('arrayNotated')).toBe(1);
		});

		it('should resolve all the dependencies before returning the module', function() {
			expect(injector.get('someModuleHere')).toEqual(8 * 2 + 4);
		});

		it('should not allow circular dependencies', function() {
			var circularFn = function () {
				injector.get('circular');
			};

			expect(circularFn).toThrow(new Error('Circular dependency found: circular <- circularModule <- circular'));
		});
	});
});