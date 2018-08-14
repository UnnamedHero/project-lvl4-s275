import buildFormObj from '../../lib/formObjectBuilder';
import { encrypt } from '../../lib/secure';
import { User } from '../models'; //eslint-disable-line
import { hasErrors, makeErrorsObj } from '../../lib/formErrorObjectBuilder';

export default (router, { logger }) => {
  router
    .get('newSession', '/session/new', async (ctx) => {
      const data = {};
      ctx.render('sessions/new', { f: buildFormObj(data) });
    })
    .post('session', '/session', async (ctx) => {
      const { email, password } = ctx.request.body.form;
      const user = await User.findOne({
        where: {
          email,
        },
      });

      const errors = { };
      if (!user) {
        errors.email = 'User does not exist';
      }
      if (user && user.passwordDigest !== encrypt(password)) {
        errors.password = 'Wrong password';
      }
      if (hasErrors(errors)) {
        ctx.render('sessions/new', { f: buildFormObj({ email }, makeErrorsObj(errors)) });
        return;
      }

      ctx.session.userId = user.id;
      ctx.redirect(router.url('root'));
      logger(`${user.email} logged in, id: ${ctx.session.userId}`);
    })
    .delete('session', '/session', (ctx) => {
      ctx.session = {};
      ctx.redirect(router.url('root'));
    });
};
