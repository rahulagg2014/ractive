define(['utils/log','utils/isEqual','utils/defineProperty','shared/getFunctionFromString','viewmodel/Computation/diff','legacy'],function (log, isEqual, defineProperty, getFunctionFromString, diff) {

	'use strict';
	
	var __export;
	
	var Evaluator, bind = Function.prototype.bind;
	
	Evaluator = function ( root, keypath, uniqueString, functionStr, args, priority ) {
		var evaluator = this, viewmodel = root.viewmodel;
	
		evaluator.root = root;
		evaluator.viewmodel = viewmodel;
		evaluator.uniqueString = uniqueString;
		evaluator.keypath = keypath;
		evaluator.priority = priority;
	
		evaluator.fn = getFunctionFromString( functionStr, args.length );
		evaluator.explicitDependencies = [];
		evaluator.dependencies = []; // created by `this.get()` within functions
	
		evaluator.argumentGetters = args.map( function(arg ) {
			var keypath, index;
	
			if ( !arg ) {
				return void 0;
			}
	
			if ( arg.indexRef ) {
				index = arg.value;
				return index;
			}
	
			keypath = arg.keypath;
			evaluator.explicitDependencies.push( keypath );
			viewmodel.register( keypath, evaluator, 'computed' );
	
			return function () {
				var value = viewmodel.get( keypath );
				return typeof value === 'function' ? wrap( value, root ) : value;
			};
		});
	};
	
	Evaluator.prototype = {
		wake: function () {
			this.awake = true;
		},
	
		sleep: function () {
			this.awake = false;
		},
	
		getValue: function () {
			var args, value, newImplicitDependencies;
	
			args = this.argumentGetters.map( call );
	
			if ( this.updating ) {
				// Prevent infinite loops caused by e.g. in-place array mutations
				return;
			}
	
			this.updating = true;
	
			this.viewmodel.capture();
	
			try {
				value = this.fn.apply( null, args );
			} catch ( err ) {
				if ( this.root.debug ) {
					log.warn({
						debug: this.root.debug,
						message: 'evaluationError',
						args: {
							uniqueString: this.uniqueString,
							err: err.message || err
						}
					});
				}
	
				value = undefined;
			}
	
			newImplicitDependencies = this.viewmodel.release();
			diff( this, this.dependencies, newImplicitDependencies );
	
			this.updating = false;
	
			return value;
		},
	
		update: function () {
			var value = this.getValue();
	
			if ( !isEqual( value, this.value ) ) {
				this.value = value;
				this.root.viewmodel.mark( this.keypath );
			}
	
			return this;
		},
	
		// TODO should evaluators ever get torn down? At present, they don't...
		teardown: function () {var this$0 = this;
			this.explicitDependencies.concat( this.dependencies ).forEach( function(keypath ) {return this$0.viewmodel.unregister( keypath, this$0, 'computed' )} );
			this.root.viewmodel.evaluators[ this.keypath ] = null;
		}
	};
	
	__export = Evaluator;
	
	function wrap ( fn, ractive ) {
		var wrapped, prop, key;
	
		if ( fn._noWrap ) {
			return fn;
		}
	
		prop = '__ractive_' + ractive._guid;
		wrapped = fn[ prop ];
	
		if ( wrapped ) {
			return wrapped;
		}
	
		else if ( /this/.test( fn.toString() ) ) {
			defineProperty( fn, prop, {
				value: bind.call( fn, ractive )
			});
	
			// Add properties/methods to wrapped function
			for ( key in fn ) {
				if ( fn.hasOwnProperty( key ) ) {
					fn[ prop ][ key ] = fn[ key ];
				}
			}
	
			return fn[ prop ];
		}
	
		defineProperty( fn, '__ractive_nowrap', {
			value: fn
		});
	
		return fn.__ractive_nowrap;
	}
	
	function call ( arg ) {
		return typeof arg === 'function' ? arg() : arg;
	}
	return __export;

});