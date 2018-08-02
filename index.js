// @flow
import '@babel/polyfill';
import Koa from 'koa';
import Router from 'koa-router';
import Rollbar from 'rollbar';
import container from './container';
import addRoutes from './routes';

export default() => {
  const app = new Koa();
  app.keys = ['why are you reading me?'];
  const rollbar = new Rollbar(process.env.ROLLBAR_TOKEN);
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      rollbar.error(err, ctx.request);
    }
  });
  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

  return app;
};
