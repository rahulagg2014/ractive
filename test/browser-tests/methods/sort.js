import { test } from 'qunit';
import { initModule } from '../test-config';

export default function() {
	initModule( 'methods/sort.js' );

	[ true, false ].forEach( modifyArrays => {
		test( `ractive.sort() (modifyArrays: ${modifyArrays})`, t => {
			let items = [ 'alice', 'bob', 'charles' ];

			const ractive = new Ractive({
				el: fixture,
				template: `
				<ul>
				{{#items}}
				<li>{{.}}</li>
				{{/items}}
				</ul>`,
				data: { items }
			});

			ractive.sort( 'items', ( a, b ) => a.length - b.length );
			t.htmlEqual( fixture.innerHTML, '<ul><li>bob</li><li>alice</li><li>charles</li></ul>' );
		});
	});
}
