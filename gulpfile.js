const gulp = require('gulp'),
  del = require('del'),
  exec = require('child_process').exec,
  htmlreplace = require('gulp-html-replace'),
  rev = require('gulp-rev'),
  revReplace = require('gulp-rev-replace');

gulp.task('webpack', function(next) {
  exec('NODE_ENV=production ./node_modules/webpack/bin/webpack.js -p', next);
});

gulp.task('index', ['webpack'], function() {
  return gulp.src('index.html')
    .pipe(htmlreplace({
      style: [
        'main.css'
      ],
      react: [
        'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.1/react.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.1/react-dom.min.js'
      ]
    }))
  .pipe(revReplace({
    manifest: gulp.src('dist/manifest-webpack.json')
  }))
  .pipe(gulp.dest('dist/'));
});

gulp.task('images', function() {
  return gulp.src('images/**/*', { base: '.' })
    .pipe(rev())
    .pipe(gulp.dest('dist/'))
    .pipe(rev.manifest({
      path: 'manifest-images.json'
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('manifest', ['images'], function() {
  return gulp.src('manifest.json')
    .pipe(revReplace({
      replaceInExtensions: ['.json'],
      manifest: gulp.src('dist/manifest-images.json')
    }))
   .pipe(gulp.dest('dist/'));
})

gulp.task('default', function(next) {
  exec('./node_modules/webpack-dev-server/bin/webpack-dev-server.js --hot --inline --host 0.0.0.0');
});

gulp.task('clean', function() {
  return del('dist');
});

gulp.task('build', ['index', 'images', 'manifest']);
