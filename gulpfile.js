var fs = require('fs');

var gulp = require('gulp');
var gulpDocs = require('gulp-ngdocs');
var runSequence = require('run-sequence');
var chmod = require('gulp-chmod');
var watch = require('gulp-watch');
var clean = require('gulp-clean');
var connect = require('gulp-connect');
var sourcemaps = require('gulp-sourcemaps');
var stylus = require('gulp-stylus');
var nib = require('nib');
var templateCache = require('gulp-angular-templatecache');

var usemin = require('gulp-usemin');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var minifyHTML = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var rev = require('gulp-rev');
var karma = require('karma').server;
var jshint = require('gulp-jshint');

var baseDir = __dirname
var appDir = baseDir + '/app';
var modulesDir = appDir + '/modules';
var stylDir = baseDir + '/styl';
var files = {
    templates: appDir + '/modules/**/templates/**/*.html',
    scripts: modulesDir + '/**/*.js'
}

gulp.task('cleanHooks', function () {
    return gulp.src('.git/hooks/pre-commit', {read: false}).pipe(clean());
});

gulp.task('cleanTemplates', function () {
    return gulp.src('**/templates.js', {read: false}).pipe(clean());
});

gulp.task('cleanBuild', function () {
    return gulp.src('.tmp/build', {read: false}).pipe(clean());
});

gulp.task('cleanDocs', function () {
    return gulp.src('.tmp/docs', {read: false}).pipe(clean());
});

gulp.task('stylus', function () {
    gulp.src(stylDir + '/main.styl')
        .pipe(sourcemaps.init())
        .pipe(stylus({use: nib()}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(appDir + '/css'));
});

gulp.task('connectDev', function () {
    connect.server({
        root: ['app'],
        port: 8000
    });
});

gulp.task('connectDocs', function () {
    connect.server({
        root: ['.tmp/docs'],
        port: 8001
    });
});

gulp.task('makeHooks', function () {
    gulp.src('git-hooks/pre-commit')
        .pipe(chmod(755))
        .pipe(gulp.dest('.git/hooks/'));
});

gulp.task('jshint', function () {
    gulp.src(modulesDir + '/**/!(templates).js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('karma', function (cb) {
    karma.start({
        configFile: __dirname + '/karma.conf.js'
    }, cb);
});

gulp.task('karma-ci', function (cb) {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true,
        coverageReporter: {
            type: 'lcovonly',
            // Travis uses this path: coverage/lcov.info
            subdir: '.',
            file: 'lcov.info'
        }
    }, cb);

});

gulp.task('coffee', function () {
    gulp.src(files.coffee)
    .pipe(sourcemaps.init())
    .pipe(coffee().on('error', gutil.log))
    .pipe(sourcemaps.write())
    .pipe(ngAnnotate())
    .pipe(gulp.dest(modulesDir + '/'))
});

gulp.task('usemin', function () {
    return gulp.src(appDir + '/index.html')
    .pipe(usemin({
        css: [minifyCSS(), 'concat', rev()],
        html: [minifyHTML({empty: true})],
        js: [ngAnnotate(), uglify(), rev()]
    }))
    .pipe(gulp.dest('.tmp/build/'));
});

gulp.task('templates', function () {
    fs.readdir(modulesDir, function (err, dirs) {
        dirs.forEach(function (dir) {
            var path = modulesDir + '/' + dir;
            gulp.src(path + '/**/templates/**/*.html')
                .pipe(minifyHTML())
                .pipe(templateCache({
                    module: dir,
                    templateHeader: '(function (angular) {\n "use strict";\n angular.module("<%= module %>"<%= standalone %>).run(["$templateCache", function($templateCache) {',
                    templateFooter: '\n }]);\n }(window.angular));'
                }))
                .pipe(gulp.dest(path + '/scripts'));
        });
    });
});

gulp.task('copy', function () {
    gulp.src(appDir + '/images/**/*')
        .pipe(gulp.dest('.tmp/build/images'));

    gulp.src(appDir + '/bower_components/bootstrap/dist/fonts/*')
        .pipe(gulp.dest('.tmp/build/fonts'));
});

gulp.task('ngdocs', function () {
    var options = {
        html5Mode: false,
        title: 'Old Weather Documentation'
    };

    gulp.src(files.scripts)
        .pipe(gulpDocs.process(options))
        .pipe(gulp.dest('.tmp/docs'));
});

gulp.task('watch', function () {
    gulp.watch([files.templates], ['templates']);
    gulp.watch([files.scripts], ['ngdocs']);
    gulp.watch([stylDir + '/**/*'], ['stylus']);
});

gulp.task('default', function (cb) {
    runSequence(
        'cleanDocs',
        'cleanTemplates',
        'templates',
        'ngdocs',
        'stylus',
        [
            'watch',
            'connectDev',
            'connectDocs'
        ],
        cb
    )
});

gulp.task('docs', function (cb) {
    runSequence(
        'cleanDocs',
        'ngdocs',
        cb
    )
});

gulp.task('build', function (cb) {
    runSequence(
        'cleanBuild',
        'copy',
        'usemin',
        cb
    );
});

gulp.task('test', function (cb) {
    runSequence(
        'jshint',
        'karma',
        cb
    )
});

gulp.task('test-ci', function (cb) {
    runSequence(
        'jshint',
        'karma-ci',
        cb
    )
});

gulp.task('hookmeup', function (cb) {
    runSequence(
        'cleanHooks',
        'makeHooks',
        cb
    );
});
