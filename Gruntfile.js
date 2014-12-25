'use strict';

module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-peg');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// Move CSS & JS
		copy: {
			chrome: {
				files: [{ expand: true, cwd: 'lib/', src: ['**', '!core/*.pegjs'], dest: 'Chrome/'}]
			},
			opera: {
				files: [{ expand: true, cwd: 'lib/', src: ['**', '!core/*.pegjs'], dest: 'Opera/'}]
			},
			operablink: {
				files: [
					{ expand: true, cwd: 'lib/', src: ['**', '!core/*.pegjs'], dest: 'OperaBlink/'},
					{ expand: true, cwd: 'Chrome/', src: ['browsersupport-chrome.js'], dest: 'OperaBlink/'}
				]
			},
			safari: {
				files: [{ expand: true, cwd: 'lib/', src: ['**', '!core/*.pegjs'], dest: 'RES.safariextension/'}]
			},
			firefox: {
				files: [{ expand: true, cwd: 'lib/', src: ['**', '!core/*.pegjs'], dest: 'XPI/data/'}]
			}
		},

		// Watch for changes
		watch: {
			chrome: {
				files: ['lib/*', 'lib/*/*'],
				tasks: ['peg', 'copy:chrome']
			},
			opera: {
				files: ['lib/*', 'lib/*/*'],
				tasks: ['peg', 'copy:opera']
			},
			operablink: {
				files: ['lib/*', 'lib/*/*', 'Chrome/browsersupport-chrome.js'],
				tasks: ['peg', 'copy:operablink']
			},
			safari: {
				files: ['lib/*', 'lib/*/*'],
				tasks: ['peg', 'copy:safari']
			},
			firefox: {
				files: ['lib/*', 'lib/*/*'],
				tasks: ['peg', 'copy:firefox']
			}
		},

		//Compile the pegjs parser definition for the filter expression
		peg: {
			filter: {
				src: 'lib/core/filter.pegjs',
				dest: 'lib/core/filter.js',
				options: {
					exportVar: 'RESUtils.filterParser'
				}
			}
		},

		// Run QUnit tests
		qunit: {
			all: ['tests/qunit/tests.html']
		},

		// Run NodeUnit tests
		nodeunit: {
			all: ['tests/selenium/all.js']
		}
	});

	// Build all with "grunt"
	grunt.registerTask('default', ['peg', 'copy']);

	// Run tests
	grunt.registerTask('test', ['qunit:all', 'nodeunit:all']);

	// Setup for development with "grunt chrome" or "grunt firefox" (enables watch task)
	grunt.registerTask('chrome', ['peg', 'copy:chrome', 'watch:chrome']);
	grunt.registerTask('opera', ['peg', 'copy:opera', 'watch:opera']);
	grunt.registerTask('operablink', ['peg', 'copy:operablink', 'watch:operablink']);
	grunt.registerTask('safari', ['peg', 'copy:safari', 'watch:safari']);
	grunt.registerTask('firefox', ['peg', 'copy:firefox', 'watch:firefox']);
};
