const gulp = require('gulp'),
  exec = require('child_process').exec,
  htmlreplace = require('gulp-html-replace'),
  revReplace = require('gulp-rev-replace');

gulp.task('webpack', function(next) {
  exec('NODE_ENV=production ./node_modules/webpack/bin/webpack.js -p', next);
});

gulp.task('index', ['webpack'], function() {
  gulp.src('index.html')
    .pipe(htmlreplace({
      react: [
        'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.1/react.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.1/react-dom.min.js'
      ]
    }))
  .pipe(revReplace({
    manifest: gulp.src('dist/manifest.json')
  }))
  .pipe(gulp.dest('dist/'));
});

gulp.task('default', function(next) {
  exec('./node_modules/webpack-dev-server/bin/webpack-dev-server.js --hot --inline --host 0.0.0.0');
});

gulp.task('build', ['index']);
