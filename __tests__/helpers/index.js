import request from 'supertest';
import { User } from '../../src/server/models'; //eslint-disable-line

export const getCookies = res => res.headers['set-cookie'][0]
  .split(',')
  .map(item => item.split(';')[0])
  .join(';');

export const signUpUser = async (server, user, password) => request.agent(server)
  .post('/users')
  .send({
    form: {
      ...user,
      password,
    },
  });

export const signInUser = async (server, user, password) => request.agent(server)
  .post('/session')
  .send({
    form: {
      email: user.email,
      password,
    },
  });

export const getUserBy = async params => User.findOne({
  where: {
    ...params,
  },
});
