module.exports = function(config) {
  config.set({
    basePath: './app',
    frameworks: ['jasmine'],
    files: [
        'bower_components/lodash/lodash.js',
        'bower_components/angular/angular.js',
        'bower_components/angular-mocks/angular-mocks.js',
        'bower_components/angular-ui-router/release/angular-ui-router.js',
        'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
        'modules/*/scripts/**/init.js',
        'modules/*/scripts/**/!(init.js|*_test.js)',
        'modules/*/scripts/**/*_test.js'
    ],
    preprocessors: {
        'modules/*/scripts/**/!(*_test.js)': 'coverage'
    },
    reporters: ['dots', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Firefox'],
    singleRun: false
  });
};
