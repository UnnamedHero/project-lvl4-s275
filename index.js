// @flow
import '@babel/polyfill';
// import path from 'path';
import Koa from 'koa';
import Router from 'koa-router';
import Rollbar from 'rollbar';
import koaWebpack from 'koa-webpack';
import Pug from 'koa-pug';

import container from './container';
import addRoutes from './routes';
import webpackConfig from './webpack.config';

export default () => {
  const app = new Koa();
  app.keys = ['why are you reading me?'];

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

  if (process.env.NODE_ENV !== 'production') {
    koaWebpack({
      config: webpackConfig,
    }).then((middleware) => {
      app.use(middleware);
    });
  }

  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

  const pug = new Pug({
    viewPath: './views',
    noCache: process.env.NODE_ENV === 'development',
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [],
    basedir: './views',
    helperPath: [
    ],
  });
  pug.use(app);

  return app;
};
