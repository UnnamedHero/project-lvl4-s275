// @flow
import '@babel/polyfill';
import path from 'path';
import Koa from 'koa';
import Router from 'koa-router';
import Rollbar from 'rollbar';
import koaWebpack from 'koa-webpack';
import Pug from 'koa-pug';
import flash from 'koa-flash-simple';
import session from 'koa-generic-session';
import serve from 'koa-static';
import _ from 'lodash';

import container from './container';
import addRoutes from './routes';
import webpackConfig from './webpack.config';

const isDevEnv = process.env.NODE_ENV === 'development';

export default () => {
  const app = new Koa();
  app.keys = ['why are you reading me?'];

  app.use(session(app));

  const rollbarToken = process.env.ROLLBAR_TOKEN;
  if (rollbarToken) {
    const rollbar = new Rollbar(process.env.ROLLBAR_TOKEN);
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        rollbar.error(err, ctx.request);
      }
    });
  }

  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      isSignedIn: () => ctx.session.userId !== undefined,
    };
    await next();
  });
  console.log('-----------------------', isDevEnv, process.env.NODE_ENV);
  if (isDevEnv) {
    koaWebpack({
      config: webpackConfig,
    }).then((middleware) => {
      app.use(middleware);
    });
  }

  app.use(serve(path.join(__dirname, 'dist')));

  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

  const pug = new Pug({
    viewPath: './views',
    noCache: isDevEnv,
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [],
    basedir: './views',
    helperPath: [
      { _ },
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  return app;
};
