module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
        'app/bower_components/lodash/lodash.js',
        'app/bower_components/angular/angular.js',
        'app/bower_components/angular-animate/angular-animate.js',
        'app/bower_components/angular-mocks/angular-mocks.js',
        'app/bower_components/angular-ui-router/release/angular-ui-router.js',
        'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
        'app/bower_components/ng-load/ng-load.js',
        'app/bower_components/angular-spinner/angular-spinner.js',
        'app/modules/*/scripts/**/init.js',
        'app/modules/*/scripts/**/!(init.js|*-spec.js)',
        'app/modules/*/scripts/**/*-spec.js'
    ],
    preprocessors: {
        'app/modules/*/scripts/**/!(*-spec.js)': 'coverage'
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
