var fs = require('fs');

var gulp = require('gulp');
var watch = require('gulp-watch');
var connect = require('gulp-connect');
var templateCache = require('gulp-angular-templatecache');

var baseDir = __dirname
var appDir = baseDir + '/app';
var modulesDir = appDir + '/modules';
var files = {
    templates: appDir + '/modules/**/templates/**/*.html'
}

gulp.task('connectDev', function () {
    connect.server({
        root: ['app'],
        port: 8000
    });
});

gulp.task('templates', function () {
    fs.readdir(modulesDir, function (err, dirs) {
        dirs.forEach(function (dir) {
            var path = modulesDir + '/' + dir;
            gulp.src(path + '/**/templates/**/*.html')
                .pipe(templateCache({
                    module: dir
                }))
                .pipe(gulp.dest(path + '/scripts'));
        });
    });
});

gulp.task('watch', function () {
    gulp.watch([files.templates], ['templates']);
});

gulp.task('default', [
    'templates',
    'watch',
    'connectDev'
]);
