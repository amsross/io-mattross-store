'use strict';

module.exports = function(grunt) {
	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			jade: {
				files: [
					'views/**/*.jade'
				],
				options: {
					livereload: true,
				},
			},
			js: {
				files: [
					'Gruntfile.js',
					'*.js',
					'routes/*.js',
					'private/js/**'
				],
				tasks: ['jshint', 'uglify'],
				options: {
					livereload: true,
				},
			},
			img: {
				files: [
					'private/img/**'
				],
				tasks: ['imagemin'],
				options: {
					livereload: true,
				},
			},
			less: {
				files: [
					'private/less/*.less'
				],
				tasks: ['less'],
				options: {
					livereload: true
				}
			}
		},
		jshint: {
			options: {
				jshintrc: true
			},
			all: [
				'Gruntfile.js',
				'*.js',
				'routes/*.js',
				'private/js/**'
			]
		},
		less: {
			dist: {
				files: {
					'public/css/main.min.css': [
						'private/less/app.less'
					]
				},
				options: {
					compress: true,
					outputSourceFiles: true,
					sourceMap: true,
					sourceMapBasepath: '../../',
					sourceMapFilename: 'public/css/main.min.css.map',
					sourceMapURL: '/css/main.min.css.map'
				}
			}
		},
		uglify: {
			dist: {
				files: {
					'public/js/scripts.min.js': [
						'private/bower_components/jquery/dist/jquery.js',
						'private/bower_components/underscore/underscore.js',
						'private/bower_components/jquery-ui/ui/jquery-ui.js',
						'private/bower_components/jquery-ui/ui/widget.js',
						'private/bower_components/jquery-ui/ui/mouse.js',
						'private/bower_components/bootstrap/js/transition.js',
						'private/bower_components/bootstrap/js/alert.js',
						'private/bower_components/bootstrap/js/carousel.js',
						'private/bower_components/bootstrap/js/dropdown.js',
						// 'private/bower_components/momentjs/moment.js',
						'private/js/app.js'
					]
				},
				options: {
					sourceMap: true,
					sourceMapIncludeSources: true,
					sourceMapName: 'public/js/scripts.min.js.map'
				}
			}
		},
		imagemin: {
			dist: {
				options: {
					interlaced : true,
					optimizationLevel: 7,
					pngquant: true,
					progressive: true
				},
				files: [{
					expand: true,
					cwd: 'private/img/',
					src: '**/*',
					dest: 'public/img/'
				}]
			}
		},
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					file: 'server.js',
					args: [],
					ignoredFiles: ['public/**'],
					watchedExtensions: ['js'],
					nodeArgs: ['--debug'],
					delayTime: 0,
					env: {
						PORT: 3000
					},
					cwd: __dirname
				}
			}
		},
		concurrent: {
			tasks: ['nodemon', 'watch'],
			options: {
				logConcurrentOutput: true
			}
		},
		mochaTest: {
			options: {
				reporter: 'spec',
				require: 'server.js'
			},
			src: ['test/mocha/**/*.js']
		},
		env: {
			dev : {
				src : '.env',
				options : {
					replace : {
						NODE_ENV : 'development'
					}
				}
			},
			test : {
				src : '.env',
				options : {
					replace : {
						NODE_ENV : 'test'
					}
				}
			}
		},
		copy: {
			fonts: {
				expand: true,
				flatten: true,
				src: [
					'private/bower_components/bootstrap/dist/fonts/*',
				],
				dest: 'public/fonts/'
			}
		}
	});

	//Load NPM tasks
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-env');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-nodemon');

	//Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	//Default task(s).
	grunt.registerTask('default', [
		'less',
		'uglify',
		'imagemin',
		'copy:fonts'
	]);

	grunt.registerTask('dev', [
		'env:dev',
		'less',
		'uglify',
		'imagemin',
		'copy:fonts',
		'concurrent'
	]);

	//Test task.
	grunt.registerTask('test', [
		'env:test',
		'mochaTest'
	]);
};
