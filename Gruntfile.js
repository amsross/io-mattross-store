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
						'private/bower_components/lightbox2/css/lightbox.css',
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
						'private/bower_components/lightbox2/js/lightbox.js',
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
			prod : {
				src : '.env',
				options : {
					add : {
						NODE_ENV : 'production',
						MONGOHQ_URL : 'mongodb://localhost:27017'
					},
					replace : {
						NODE_ENV : 'production'
					}
				}
			},
			dev : {
				src : '.env',
				options : {
					add : {
						NODE_ENV : 'development',
						MONGOHQ_URL : 'mongodb://localhost:27017'
					},
					replace : {
						NODE_ENV : 'development'
					}
				}
			},
			n2o : {
				src : '.env',
				options : {
					add : {
						NODE_ENV : 'n2o',
						MONGOHQ_URL : 'mongodb://localhost:27017'
					},
					replace : {
						NODE_ENV : 'n2o'
					}
				}
			},
			test : {
				src : '.env',
				options : {
					add : {
						NODE_ENV : 'test',
						MONGOHQ_URL : 'mongodb://test_user:test_pass@localhost:27017/test_db'
					},
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
			},
			lightbox2: {
				expand: true,
				flatten: true,
				src: [
					'private/bower_components/lightbox2/img/*',
				],
				dest: 'public/img/'
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
		'env:prod',
		'less',
		'uglify',
		'imagemin',
		'copy:fonts',
		'copy:lightbox2'
	]);

	grunt.registerTask('n2o', [
		'env:n2o',
		'less',
		'uglify',
		'imagemin',
		'copy:fonts',
		'copy:lightbox2',
		'concurrent'
	]);

	grunt.registerTask('dev', [
		'env:dev',
		'less',
		'uglify',
		'imagemin',
		'copy:fonts',
		'copy:lightbox2',
		'concurrent'
	]);

	//Test task.
	grunt.registerTask('test', [
		'env:test',
		'mochaTest'
	]);
};
