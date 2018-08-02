import gulp from 'gulp';
import babel from 'gulp-babel';
import getServer from '.';

gulp.task('deafult', () => {
  gulp.src('index.js')
    .pipe(babel({
      plugins: ['@babel/transform-runtime'],
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('server', (cb) => {
  getServer().listen(process.env.PORT || 3000, cb);
});
