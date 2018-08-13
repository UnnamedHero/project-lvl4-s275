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
    .post('registerUser', '/users', async (ctx) => {
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
    .get('allUsers', '/users', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users', { users });
    })
    .get('getCurrentUserProfile', '/users/profile', async (ctx) => {
      if (!ctx.session.userId) {
        ctx.flash.set('You must sign in to edit your profile');
        ctx.redirect(router.url('root'));
        return;
      }
      const user = await getUserBy({ id: ctx.session.userId });
      ctx.render('users/edit', { f: buildFormObj(user) });
    })
    .patch('saveCurrentUserProfile', '/users/profile', async (ctx) => {
      if (ctx.session.userId) {
        const { userId } = ctx.session;
        const { form: updatedUserData } = ctx.request.body;
        const user = await getUserBy({ id: userId });
        try {
          await user.update({ ...updatedUserData });
          logger(`userid ${userId} modified`);
          ctx.flash.set('Your profile has been modified');
          ctx.redirect(router.url('root'));
        } catch (e) {
          logger(`userid ${userId} NOT modified, ${e}`);
          ctx.render('users/edit', { f: buildFormObj(user, e) });
        }
        return;
      }
      ctx.flash.set('You are not signed in');
      ctx.redirect(router.url('root'));
    })
    .get('changeCurrentUserPassword', '/users/profile/password', async (ctx) => {
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
    .patch('changeUserPassword', '/users/profile/password', async (ctx) => {
      if (!ctx.session.userId) {
        ctx.status = 403;
        ctx.redirect(router.url('root'));
        return;
      }
      const { form } = ctx.request.body;
      const user = await getUserBy({ id: ctx.session.userId });

      if (form.newPassword !== form.confirmPassword) {
        ctx.flash.set('newPassword must match with confirmPassword');
        logger('newPassword must match with confirmPassword');
        ctx.render('users/changePassword', { f: buildFormObj(form) });
        return;
      }
      if (!(user && user.passwordDigest === encrypt(form.password))) {
        logger(`Wrong password, ${user.id}, ${user.email}, ${form.password}`);
        ctx.flash.set('Wrong password');
        ctx.render('users/changePassword', { f: buildFormObj(form) });
        return;
      }
      try {
        await user.update({ password: form.newPassword });
        ctx.flash.set('Password has been modified');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/changePassword', { f: buildFormObj(form, e) });
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
