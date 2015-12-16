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
				expect(Injector.extractDeps(serviceFn)).toEqual(['Q', '$', 'parse', 'scope']);
			});

			it('should get dependencies from a named function', function() {
				function namedFunction (Q, $, parse, scope){
					return 0;					
				}

				expect(Injector.extractDeps(namedFunction)).toEqual(['Q', '$', 'parse', 'scope']);
			});

			it('should return empty array when no dependecy is found', function() {
				expect(Injector.extractDeps(function() {})).toEqual([]);
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
				q: function() {
					return function(callback) {
						callback(function() {});

						return {
							then: function(fn) {
								fn(0);
							}
						}
					};
				},

				independentModule: function() {
					return {
						sum: function(v, f) {
							return (v + f);
						}
					};
				},

				anotherModuleHere: ['independentModule', function(independentModule) {
					return function(v) {
						return independentModule.sum(v * 2, 4);
					};
				}],

				someModuleHere: ['anotherModuleHere', function(anotherModuleHere) {
					return anotherModuleHere(8);
				}],

				circularModule: ['circular', function(circular) {
					return { isCircular: circular };
				}],

				circular: ['circularModule', function(circularModule) {
					return true;
				}]
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
			pending.dep1 = [function() {
				return function() {
					return 1;
				};
			}];

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

		it('should not allow entire dependencies array notation, the last item of the array must be the service factory', function() {
			var allDepsFn = function() {
				injector.invoke(['dep1', 'dep2', 'dep3']);
			};

			expect(allDepsFn).toThrow(new Error('The last item of the array must be the service factory'));
		});

		it('should support $inject key on the service factory', function() {
			var thenSpy = jasmine.createSpy();

			var factoryFn = function($q) {
				var i = 0;

				return $q(function(resolve) {
					resolve(i);
				});
			};

			factoryFn.$inject = ['q'];

			injector.invoke(factoryFn).then(thenSpy);

			expect(thenSpy).toHaveBeenCalledWith(0);
		});
	});
});