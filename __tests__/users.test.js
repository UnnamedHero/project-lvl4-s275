import request from 'supertest';
import faker from 'faker';
import matchers from 'jest-supertest-matchers';

import app from '../src/server';
import { User, sequelize } from '../src/server/models'; //eslint-disable-line

const getCookies = res => res.headers['set-cookie'][0]
  .split(',')
  .map(item => item.split(';')[0])
  .join(';');

const makeUser = (userParams = {}) => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  email: faker.internet.email(),
  ...userParams,
});

const signUpUser = async (server, user, password) => request.agent(server)
  .post('/users')
  .send({
    form: {
      ...user,
      password,
    },
  });

const signInUser = async (server, user, password) => request.agent(server)
  .post('/session')
  .send({
    form: {
      email: user.email,
      password,
    },
  });

const getUserBy = async params => User.findOne({
  where: {
    ...params,
  },
});

beforeAll(async () => {
  jasmine.addMatchers(matchers);
  await User.sync({ force: true });
});

beforeEach(async () => {
  await User.destroy({ where: {}, force: true });
});

describe('Create user', () => {
  let server;

  beforeAll(() => {
    server = app().listen();
  });

  const user = makeUser();
  const twinUser = makeUser({ email: user.email });

  test('create', async () => {
    await signUpUser(server, user, faker.internet.password());
    const expectedUser = await getUserBy({ email: user.email });
    expect(expectedUser).toMatchObject(user);

    await signUpUser(server, twinUser, faker.internet.password());
    const registeredUsers = await User.findAll();
    expect(registeredUsers).toHaveLength(1);
  });

  afterAll((done) => {
    server.close();
    done();
  });
});

describe('Edit user', () => {
  let server;
  const user = makeUser();
  const userPassword = faker.internet.password();

  const hackerUser = makeUser();
  const hackerUserPassword = faker.internet.password();

  beforeEach(async () => {
    server = app().listen();
    await signUpUser(server, user, userPassword);
    await signUpUser(server, hackerUser, hackerUserPassword);
  });

  test('edit user while not signed in', async () => {
    const res = await request.agent(server)
      .get('/user');
    expect(res).toHaveHTTPStatus(302);
  });

  test('hacker try to edit victim user', async () => {
    const res = await signInUser(server, hackerUser, hackerUserPassword);
    const victimUser = await getUserBy({ email: user.email });
    await request.agent(server)
      .patch(`/users/${victimUser.id}`)
      .set('Cookie', getCookies(res))
      .send({
        form: {
          ...makeUser(),
        },
      });
    const expectedUser = await getUserBy({ id: victimUser.id });
    expect(expectedUser).toEqual(victimUser);
  });

  test('edit self', async () => {
    const res = await signInUser(server, user, userPassword);
    const signedInUser = await getUserBy({ email: user.email });
    const newUserData = makeUser();
    await request.agent(server)
      .patch(`/users/${signedInUser.id}`)
      .set('Cookie', getCookies(res))
      .send({
        form: {
          ...newUserData,
        },
      });
    const changedUser = await getUserBy({ id: signedInUser.id });
    expect(changedUser).toMatchObject(newUserData);
  });

  test('change password', async () => {
    const res = await signInUser(server, user, userPassword);
    const signedInUser = await getUserBy({ email: user.email });
    const newPassword = faker.internet.password();
    await request.agent(server)
      .patch(`/users/${signedInUser.id}/password`)
      .set('Cookie', getCookies(res))
      .send({
        form: {
          password: userPassword,
          newPassword,
          confirmPassword: newPassword,
        },
      });

    const loginResWithOldPasssword = await signInUser(server, user, userPassword);
    const resWithOldPassword = await request.agent(server)
      .get('/user')
      .set('Cookie', getCookies(loginResWithOldPasssword));
    console.log(resWithOldPassword.status);
    expect(resWithOldPassword).toHaveHTTPStatus(302);

    const loginResWithNewPassword = await signInUser(server, user, newPassword);
    const resWithNewPassword = await request.agent(server)
      .get('/user')
      .set('Cookie', getCookies(loginResWithNewPassword));
    expect(resWithNewPassword).toHaveHTTPStatus(200);
  });

  test('delete user', async () => {
    const usersCount = 2;
    const usersListAtStart = await User.findAll();
    expect(usersListAtStart).toHaveLength(usersCount);

    const guestResp = await request.agent(server)
      .delete('/user');
    expect(guestResp).toHaveHTTPStatus(302);

    const resHacker = await signInUser(server, hackerUser, hackerUserPassword);
    await request.agent(server)
      .delete('/user')
      .set('Cookie', getCookies(resHacker));
    const usersListAfterDeletion = await User.findAll();
    expect(usersListAfterDeletion).toHaveLength(usersCount - 1);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});

afterAll(async () => {
  await sequelize.close();
});
