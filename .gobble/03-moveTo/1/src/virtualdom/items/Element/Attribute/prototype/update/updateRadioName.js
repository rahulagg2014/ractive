define(function () {

	'use strict';
	
	return function Attribute$updateRadioName () {
		var node = (value = this).node, value = value.value;
		node.checked = ( value == node._ractive.value );
	};

});