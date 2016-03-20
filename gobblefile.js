/*global require, module, __dirname, process */
/*eslint no-var:0, object-shorthand:0 */
var gobble = require( 'gobble' );
var sander = require( 'sander' );
var junk = require( 'junk' );
var Promise = sander.Promise;
var path = require( 'path' );
var rollup = require( 'rollup' );
var babel = require( 'rollup-plugin-babel' )({
	plugins: [
		[ "transform-es2015-classes", { loose: true } ]
	]
});
var legacyBabel = require( 'rollup-plugin-babel' )({
	plugins: [
		"transform-es3-property-literals",
		[ "transform-es2015-classes", { loose: true } ]
	]
});
var sandbox = gobble( 'sandbox' ).moveTo( 'sandbox' );
var version = require( './package.json' ).version;

var src = gobble( 'src' );
var es5 = src;
var lib;
var test;

function noop () {}

function adjustAndSkip ( pattern ) {
	return { transform ( src, path ) {
		if ( /(Ractive\.js|utils[\/\\]log\.js)$/.test( path ) ) {
			return src.replace( /<@version@>/g, version );
		}

		if ( pattern && pattern.test( path ) ) {
			return 'export default null;';
		}

		return src;
	} };
}

function bloodyIE8 ( src ) {
	src = src.replace( /\.typeof/g, "['typeof']" ).replace( /\.catch/g, "['catch']" );
	return src;
}

if ( gobble.env() === 'production' ) {
	var banner = sander.readFileSync( __dirname, 'src/banner.js' ).toString()
		.replace( '${version}', version )
		.replace( '${time}', new Date() )
		.replace( '${commitHash}', process.env.COMMIT_HASH || 'unknown' );

	lib = gobble([
		src.transform( 'rollup', {
			plugins: [ adjustAndSkip(), legacyBabel ],
			format: 'umd',
			entry: 'Ractive.js',
			moduleName: 'Ractive',
			dest: 'ractive-legacy.js',
			banner: banner
		}).transform( bloodyIE8 ),

		src.transform( 'rollup', {
			plugins: [ adjustAndSkip( /legacy\.js/ ), babel ],
			format: 'umd',
			banner: banner,
			entry: 'Ractive.js',
			moduleName: 'Ractive',
			dest: 'ractive.js'
		}),

		src.transform( 'rollup', {
			plugins: [ adjustAndSkip( /legacy\,js|_parse\.js/ ), babel ],
			format: 'umd',
			banner: banner,
			entry: 'Ractive.js',
			moduleName: 'Ractive',
			dest: 'ractive.runtime.js'
		}),

		src.transform( 'rollup', {
			plugins: [ adjustAndSkip( /_parse\.js/ ), legacyBabel ],
			format: 'umd',
			banner: banner,
			entry: 'Ractive.js',
			moduleName: 'Ractive',
			dest: 'ractive-legacy.runtime.js'
		}).transform( bloodyIE8 )
	]);
} else {
	lib = gobble([
		es5.transform( 'rollup', {
			plugins: [ adjustAndSkip(), legacyBabel ],
			format: 'umd',
			entry: 'Ractive.js',
			moduleName: 'Ractive',
			dest: 'ractive-legacy.js'
		}).transform( bloodyIE8 ),

		sandbox
	]);
}

test = (function () {
	var testFiles = sander.lsrSync( 'test/browser-tests' ).filter( junk.not );
	var globals = {
		qunit: 'QUnit',
		simulant: 'simulant'
	};


	var testModules = gobble([
		gobble([
			gobble( 'test/browser-tests' ).moveTo( 'browser-tests' ),
			gobble( 'test/__support/js' )
		]),
		es5
	]).transform( function bundleTests ( inputdir, outputdir, options ) {
		var promises = testFiles.sort().map( function ( mod ) {
			var transform = {
				resolveId ( importee, importer ) {
					if ( globals[ importee ] ) return false;

					if ( !importer ) return importee;

					if ( importee[0] === '.' ) {
						return path.resolve( path.dirname( importer ), importee ) + '.js';
					}

					return path.resolve( inputdir, importee ) + '.js';
				},
				load ( id ) {
					var code = sander.readFileSync( id, { encoding: 'utf-8' });

					if ( /test-config/.test( id ) ) return code;

					return 'import { initModule } from \'test-config\';\n' +
						'initModule(\'' + mod.replace( /\\/g, '/' ) + '\' );\n\n' +
						code;
				}
			};

			return rollup.rollup({
				entry: inputdir + '/browser-tests/' + mod,
				plugins: [ transform, legacyBabel ],
				globals: globals,
				onwarn: noop
			}).then( function ( bundle ) {
				return bundle.write({
					dest: outputdir + '/' + mod,
					format: 'iife',
					globals: globals
				});
			});
		});

		return Promise.all( promises );
	}).transform( bloodyIE8 );

	return gobble([
		gobble( 'test/__support/index.html' )
			.transform( 'replace', {
				scriptBlock: testFiles.map( function ( src ) {
					return '<script src="' + src + '"></script>';
				}).join( '\n\t' )
			}),
		testModules,
		gobble( 'test/__support/files' ),
		gobble( 'test/node-tests' ).moveTo( 'node-tests' ),
		gobble( 'test/__support/js/samples' )
			.include( '*.js' )
			.transform( function bundleSamples ( inputDir, outputDir, options ) {
				return sander.lsr(inputDir).then( function ( files ) {
					var promises = files.map( function ( file ) {
						return rollup.rollup({
							entry: inputDir + '/' + file,
							plugins: [ legacyBabel ],
							globals: globals,
							onwarn: noop
						}).then( function ( bundle ) {
							return bundle.write({
								dest: outputDir + '/' + file,
								format: 'cjs',
								globals: globals,
								moduleName: 'tests'
							});
						});
					});
					return Promise.all(promises);
				});
			})
			.moveTo( 'node-tests/samples' )
	]).moveTo( 'test' );
})();

module.exports = gobble([
	lib,
	test
]);
