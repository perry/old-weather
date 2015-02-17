module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
        'app/bower_components/lodash/lodash.js',
        'app/bower_components/angular/angular.js',
        'app/bower_components/angular-mocks/angular-mocks.js',
        'app/bower_components/angular-ui-router/release/angular-ui-router.js',
        'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
        'app/modules/*/scripts/**/init.js',
        'app/modules/*/scripts/**/!(init.js|*_test.js)',
        'app/modules/*/scripts/**/*_test.js'
    ],
    preprocessors: {
        'app/modules/*/scripts/**/!(*_test.js)': 'coverage'
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
