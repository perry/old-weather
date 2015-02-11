var fs = require('fs');

var gulp = require('gulp');
var gulpDocs = require('gulp-ngdocs');
var watch = require('gulp-watch');
var clean = require('gulp-clean');
var connect = require('gulp-connect');
var historyApiFallback = require('connect-history-api-fallback');
var templateCache = require('gulp-angular-templatecache');

var baseDir = __dirname
var appDir = baseDir + '/app';
var modulesDir = appDir + '/modules';
var files = {
    templates: appDir + '/modules/**/templates/**/*.html'
}

gulp.task('cleanTemplates', function () {
    return gulp.src('**/templates.js', {read: false}).pipe(clean());
});

gulp.task('connectDev', function () {
    connect.server({
        root: ['app'],
        port: 8000,
        middleware: function () {
            return [historyApiFallback];
        }
    });
});

gulp.task('connectDocs', function () {
    connect.server({
        root: ['.tmp/docs'],
        port: 8001
    });
});

gulp.task('templates', ['cleanTemplates'], function () {
    fs.readdir(modulesDir, function (err, dirs) {
        dirs.forEach(function (dir) {
            var path = modulesDir + '/' + dir;
            gulp.src(path + '/**/templates/**/*.html')
                .pipe(templateCache({
                    module: dir,
                    templateHeader: '(function (angular) {\n "use strict";\n angular.module("<%= module %>"<%= standalone %>).run(["$templateCache", function($templateCache) {',
                    templateFooter: '\n }]);\n }(window.angular));'
                }))
                .pipe(gulp.dest(path + '/scripts'));
        });
    });
});

gulp.task('ngdocs', function () {
    var options = {
        html5Mode: false
    };

    return gulp.src(modulesDir + '/**/*.js')
        .pipe(gulpDocs.process(options))
        .pipe(gulp.dest('.tmp/docs'));
});

gulp.task('watch', function () {
    gulp.watch([files.templates], ['templates']);
});

gulp.task('default', [
    'ngdocs',
    'templates',
    'watch',
    'connectDev',
    'connectDocs'
]);
