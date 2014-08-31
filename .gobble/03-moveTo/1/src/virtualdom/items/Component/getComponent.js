define(['config/config','utils/log','circular'],function (config, log, circular) {

	'use strict';
	
	var Ractive;
	circular.push( function () {
		Ractive = circular.Ractive;
	});
	
	// finds the component constructor in the registry or view hierarchy registries
	
	return function getComponent ( ractive, name ) {
	
		var component, instance = config.registries.components.findInstance( ractive, name );
	
		if ( instance ) {
			component = instance.components[ name ];
	
			// best test we have for not Ractive.extend
			if ( !component._parent ) {
				// function option, execute and store for reset
				var fn = component.bind( instance );
				fn.isOwner = instance.components.hasOwnProperty( name );
				component = fn( instance.data );
	
				if ( !component ) {
					log.warn({
						debug: ractive.debug,
						message: 'noRegistryFunctionReturn',
						args: { registry: 'component', name: name }
					});
					return;
				}
	
				if ( typeof component === 'string' ) {
					//allow string lookup
					component = getComponent ( ractive, component );
				}
	
				component._fn = fn;
				instance.components[ name ] = component;
			}
		}
	
		return component;
	};

});