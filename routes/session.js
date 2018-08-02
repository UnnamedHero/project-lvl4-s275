export default (router) => {
  router
    .get('newSession', '/session/new', (ctx) => {
      ctx.redirect(router.url('root'));
    })
    .get('session', '/session', (ctx) => {
      ctx.redirect(router.url('root'));
    });
};
