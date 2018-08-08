import buildFormObj from '../../lib/formObjectBuilder';
import { User } from '../models'; //eslint-disable-line 

export default (router) => {
  router
    .get('users', '/users', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users', { users });
    })
    .get('newUser', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .get('editUser', '/user', (ctx) => {
      ctx.redirect(router.url('root'));
    })
    .post('users', '/users', async (ctx) => {
      const { form } = ctx.request.body;
      const user = User.build(form);
      try {
        await user.save();
        ctx.flash.set('User has been created');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    })
    .delete('deleteUser', '/user', (ctx) => {
      ctx.redirect(router.url('root'));
    });
  // .patch('changeUser', '/users/';
};
