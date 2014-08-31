define(function () {

	'use strict';
	
	return function Attribute$updateClassName () {
		var node, value;
	
		node = this.node;
		value = this.value;
	
		if ( value === undefined ) {
			value = '';
		}
	
		node.className = value;
	};

});