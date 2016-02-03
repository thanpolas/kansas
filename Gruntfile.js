/*jshint camelcase:false */
var jshintStylish = require('jshint-stylish');

module.exports = function (grunt) {
  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    mochaTest: {
      options: {
        ui: 'bdd',
        clearRequireCache: true,
        timeout: 10000,
      },
      api: {
        src: ['test/api/*.js']
      },
      unit: {
        src: ['test/unit/*.js']
      },
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: jshintStylish,
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
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
    },
    release: {
      options: {
        bump: true, //default: true
        file: 'package.json', //default: package.json
        add: true, //default: true
        commit: true, //default: true
        tag: true, //default: true
        push: true, //default: true
        pushTags: true, //default: true
        npm: true, //default: true
        tagName: 'v<%= version %>', //default: '<%= version %>'
        commitMessage: 'releasing v<%= version %>', //default: 'release <%= version %>'
        tagMessage: 'v<%= version %>' //default: 'Version <%= version %>'
      }
    },
  });
  grunt.registerTask('start', 'Start all required services', ['startRedis']);
  grunt.registerTask('stop', 'Stop all services', ['stopRedis']);

  grunt.registerTask('test', ['jshint', 'mochaTest']);

  // Default task.
  grunt.registerTask('default', ['test']);
};
