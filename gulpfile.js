// Gulpfile.js 
var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  bowerFiles = require('main-bower-files'),
  inject = require('gulp-inject'),
  es = require('event-stream')
  watch = require('gulp-watch');

gulp.task('bower-inject', function() {
  gulp.src('./server/views/includes/*.html')
    .pipe(inject(gulp.src(bowerFiles(), {read: false}), {name: 'bower'}))
    // .pipe(inject(es.merge(
    //   cssFiles,
    //   gulp.src('./src/app/**/*.js', {read: false})
    // )))
    .pipe(gulp.dest('./server/views/includes'));
});

gulp.task('develop', ['bower-inject'], function () {
  nodemon({ script: 'index.js'
          , ext: 'html js'
          , watch: ['index.js', 'server/**/*']})
    .on('restart', function () {
      console.log('restarted!')
    })
});

gulp.task('default', ['develop'], function() {
   gulp.watch('./bower.json', ['bower-inject']);
});