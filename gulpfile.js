// Gulpfile.js 
var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  bowerFiles = require('main-bower-files'),
  inject = require('gulp-inject'),
  es = require('event-stream')
  watch = require('gulp-watch'),
  browserSync = require('browser-sync').create(),
  reload = browserSync.reload;

gulp.task('bower-inject', function() {
  gulp.src('./server/views/includes/*.html')
    .pipe(inject(gulp.src(bowerFiles(), {read: false}), {name: 'bower'}))
    // .pipe(inject(es.merge(
    //   cssFiles,
    //   gulp.src('./src/app/**/*.js', {read: false})
    // )))
    .pipe(gulp.dest('./server/views/includes'));
});


gulp.task('browser-sync', ['nodemon'], function() {
  browserSync.init({
      proxy: "localhost:8000",  // local node app address
      port: 5000,  // use *different* port than above
      notify: true,
      files: ["./public/**/*", "!./public/lib"],
      browser: "firefox"
  });
})

gulp.task('nodemon', ['bower-inject'], function (cb) {
  var started = false;
  return nodemon({ script: 'index.js'
          , ext: 'html js'
          , watch: ['index.js', 'server/**/*']})
    .on('start', function () {
        // to avoid nodemon being started multiple times
        // thanks @matthisk
        console.log('nodemon started');
        if (!started) {
          setTimeout(function() {
            browserSync.init({
                proxy: "localhost:8000",  // local node app address
                port: 5000,  // use *different* port than above
                notify: true,
                files: ["public/**/*", "!public/lib"],
                browser: "firefox"
            });
          }, 1000);
        }
        started = true;
      })
    .on('restart', function () {
      console.log('restarted');
      setTimeout(function () {
            reload({ stream: false });
          }, 3000);
    });
});

gulp.task('default', ['browser-sync'], function() {
   gulp.watch('./bower.json', ['bower-inject']);
});