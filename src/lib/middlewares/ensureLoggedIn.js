export default async (ctx, next) => {
  // if (!ctx.state.isSignedIn()) {
  //   if (ctx.flash) {
  //     ctx.flash.set(`Not authorised to access ${ctx.path}`);
  //   }
  //   ctx.redirect('/');
  //   return;
  // }
  await next();
};
