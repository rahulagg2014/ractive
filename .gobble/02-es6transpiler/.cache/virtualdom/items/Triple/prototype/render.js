define(['virtualdom/items/Triple/helpers/insertHtml','virtualdom/items/Triple/helpers/updateSelect'],function (insertHtml, updateSelect) {

	'use strict';
	
	return function Triple$render () {
		if ( this.rendered ) {
			throw new Error( 'Attempted to render an item that was already rendered' );
		}
	
		this.docFrag = document.createDocumentFragment();
		this.nodes = insertHtml( this.value, this.parentFragment.getNode(), this.docFrag );
	
		// Special case - we're inserting the contents of a <select>
		updateSelect( this.pElement );
	
		this.rendered = true;
		return this.docFrag;
	};

});