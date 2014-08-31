define(['global/runloop','global/css','utils/getElement'],function (runloop, css, getElement) {

	'use strict';
	
	var __export;
	
	var queues = {}, rendering = {};
	
	__export = function Ractive$render ( target, anchor ) {var this$0 = this;
		var promise, instances, transitionsEnabled;
	
		rendering[ this._guid ] = true;
	
		// if `noIntro` is `true`, temporarily disable transitions
		transitionsEnabled = this.transitionsEnabled;
		if ( this.noIntro ) {
			this.transitionsEnabled = false;
		}
	
		promise = runloop.start( this, true );
	
		if ( this.rendered ) {
			throw new Error( 'You cannot call ractive.render() on an already rendered instance! Call ractive.unrender() first' );
		}
	
		target = getElement( target ) || this.el;
		anchor = getElement( anchor ) || this.anchor;
	
		this.el = target;
		this.anchor = anchor;
	
		// Add CSS, if applicable
		if ( this.constructor.css ) {
			css.add( this.constructor );
		}
	
		if ( target ) {
			if ( !( instances = target.__ractive_instances__ ) ) {
				target.__ractive_instances__ = [ this ];
			} else {
				instances.push( this );
			}
	
			if ( anchor ) {
				target.insertBefore( this.fragment.render(), anchor );
			} else {
				target.appendChild( this.fragment.render() );
			}
		}
	
		// Only init once, until we rework lifecycle events
		if ( !this._hasInited ) {
			this._hasInited = true;
			// If this is *isn't* a child of a component that's in the process of rendering,
			// it should call any `init()` methods at this point
			if ( !this._parent || !rendering[ this._parent._guid ] ) {
				init( this );
			} else {
				getChildInitQueue( this._parent ).push( this );
			}
		}
	
		rendering[ this._guid ] = false;
		runloop.end();
	
		this.rendered = true;
		this.transitionsEnabled = transitionsEnabled;
	
		if ( this.complete ) {
			promise.then( function()  {return this$0.complete()} );
		}
	
		return promise;
	};
	
	function init ( instance ) {
		var childQueue = getChildInitQueue( instance );
		if ( instance.init ) {
			instance.init( instance._config.options );
		}
	
		while ( childQueue.length ) {
			init( childQueue.shift() );
		}
		queues[ instance._guid ] = null;
	}
	
	function getChildInitQueue ( instance ) {
		return queues[ instance._guid ] || ( queues[ instance._guid ] = [] );
	}
	return __export;

});