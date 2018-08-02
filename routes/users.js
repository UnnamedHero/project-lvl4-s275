export default (router) => {
  router
    .get('users', '/users', (ctx) => {
      ctx.redirect(router.url('root'));
    });
};
