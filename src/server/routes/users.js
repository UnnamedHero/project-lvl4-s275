import buildFormObj from '../../lib/formObjectBuilder';
import { User } from '../models'; //eslint-disable-line 
import { encrypt } from '../../lib/secure';

const getUserBy = async params => User.findOne({
  where: {
    ...params,
  },
});

export default (router, { logger }) => {
  router
    .get('newUser', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
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
    .get('allUsers', '/users/all', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users', { users });
    })
    .get('editCurrentUser', '/users/currentUser', async (ctx) => {
      if (!ctx.session.userId) {
        ctx.flash.set('You must sign in to edit your profile');
        ctx.redirect(router.url('root'));
        return;
      }
      const user = await getUserBy({ id: ctx.session.userId });
      ctx.render('users/edit', { f: buildFormObj(user), id: user.id });
    })
    .get('changeCurrentUserPassword', '/users/currentUser/password', async (ctx) => {
      if (!ctx.session.userId) {
        ctx.flash.set('You must sign in to change your password');
        ctx.redirect(router.url('root'));
        return;
      }
      const passwordForm = {
        password: '',
        newPassword: '',
        confirmPassword: '',
      };
      ctx.render('users/changePassword', { f: buildFormObj(passwordForm), id: ctx.session.userId });
    })
    .patch('saveUserProfile', '/users/:id', async (ctx) => {
      const { id } = ctx.params;
      logger(`try to change userId ${id}, while logged id ${ctx.session.userId}`);
      if (ctx.session.userId && String(ctx.session.userId) === id) {
        const { form: updatedUserData } = ctx.request.body;
        const user = await getUserBy({ id });
        try {
          await user.update({ ...updatedUserData });
          logger(`userid ${id} modified`);
          ctx.flash.set('User has been modified');
          ctx.redirect(router.url('root'));
        } catch (e) {
          logger(`userid ${id} NOT modified, ${e}`);
          ctx.render('users/edit', { f: buildFormObj(user, e), id: user.id });
        }
        return;
      }
      ctx.flash.set('You do not have permission to edit other users');
      ctx.redirect(router.url('root'));
    })
    .patch('changeUserPassword', '/users/:id/password', async (ctx) => {
      const { id } = ctx.params;
      if (!(ctx.session.userId && String(ctx.session.userId) === id)) {
        ctx.flash.set('You do not have permission to edit other users');
        ctx.redirect(router.url('root'));
        return;
      }
      const { form } = ctx.request.body;
      const user = await getUserBy({ id });

      if (form.newPassword !== form.confirmPassword) {
        ctx.flash.set('newPassword must match with confirmPassword');
        ctx.render('users/changePassword', { f: buildFormObj(form), id });
        return;
      }
      if (!(user && user.passwordDigest === encrypt(form.password))) {
        ctx.flash.set('Wrong password');
        ctx.render('users/changePassword', { f: buildFormObj(form), id });
        return;
      }

      try {
        await user.update({ password: form.newPassword });
        ctx.flash.set('Password has been modified');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/changePassword', { f: buildFormObj(form, e), id });
      }
    })
    .delete('deleteCurrentUser', '/user', async (ctx) => {
      if (!ctx.session.userId) {
        ctx.flash.set('You must sign in to delete your own profile');
        ctx.redirect(router.url('root'));
        return;
      }
      const user = await getUserBy({ id: ctx.session.userId });
      if (user) {
        try {
          await user.destroy();
        } catch (e) {
          ctx.flash.set('Something going wrong while deleting user');
          ctx.session = {};
          ctx.redirect(router.url('root'));
          return;
        }
      }
      ctx.flash.set('Profile deleted. Good buy.');
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
