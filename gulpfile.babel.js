import gulp from 'gulp';
import repl from 'repl';

import container from './src/server/container';
import getServer from './src/server';

gulp.task('server', (cb) => {
  getServer().listen(process.env.PORT || 3000, cb);
});

gulp.task('console', () => {
  const replServer = repl.start({
    prompt: 'Application console > ',
  });

  Object.keys(container).forEach((key) => {
    replServer.context[key] = container[key];
  });
});
