import gulp from 'gulp';
import getServer from './src/server';

gulp.task('server', (cb) => {
  getServer().listen(process.env.PORT || 3000, cb);
});
