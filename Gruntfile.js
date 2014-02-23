/*jshint camelcase:false */

module.exports = function (grunt) {
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    mochaTest: {
      options: {
        ui: 'bdd',
      },
      manage: {
        src: ['test/manage/*.js']
      },
      unit: {
        options: {
          ui: 'tdd',
        },
        src: ['test/unit/*.js']
      },
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'mochaTest']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'mochaTest']
      }
    }
  });
  grunt.registerTask('start', 'Start all required services', ['startRedis']);
  grunt.registerTask('stop', 'Stop all services', ['stopRedis']);

  // Default task.
  grunt.registerTask('default', ['jshint', 'mochaTest']);
};
