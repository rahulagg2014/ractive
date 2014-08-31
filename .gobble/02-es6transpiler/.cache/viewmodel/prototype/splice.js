define(['config/types'],function (types) {

	'use strict';
	
	var __export;
	
	__export = function Viewmodel$splice ( keypath, spliceSummary ) {
		var viewmodel = this, i, dependants;
	
		// Mark changed keypaths
		for ( i = spliceSummary.rangeStart; i < spliceSummary.rangeEnd; i += 1 ) {
			viewmodel.mark( keypath + '.' + i );
		}
	
		if ( spliceSummary.balance ) {
			viewmodel.mark( keypath + '.length', true );
		}
	
		// Trigger splice operations
		if ( dependants = viewmodel.deps[ 'default' ][ keypath ] ) {
			dependants.filter( canSplice ).forEach( function(dependant ) {return dependant.splice( spliceSummary )} );
		}
	};
	
	function canSplice ( dependant ) {
		return dependant.type === types.SECTION && ( !dependant.subtype || dependant.subtype === types.SECTION_EACH ) && dependant.rendered;
	}
	return __export;

});