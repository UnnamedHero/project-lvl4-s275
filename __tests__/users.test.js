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
    const response = await request.agent(server)
      .get('/users/profile');
    expect(response).toHaveHTTPStatus(302);
  });

  test('edit self', async () => {
    const response = await signInUser(server, user, userPassword);
    const signedInUser = await getUserBy({ email: user.email });
    const newUserData = makeUser();
    await request.agent(server)
      .patch('/users/profile')
      .set('Cookie', getCookies(response))
      .send({
        form: {
          ...newUserData,
        },
      });
    const changedUser = await getUserBy({ id: signedInUser.id });
    expect(changedUser).toMatchObject(newUserData);
  });

  test('change password', async () => {
    const response = await signInUser(server, user, userPassword);
    const newPassword = faker.internet.password();
    await request.agent(server)
      .patch('/users/profile/password')
      .set('Cookie', getCookies(response))
      .send({
        form: {
          password: userPassword,
          newPassword,
          confirmPassword: newPassword,
        },
      });

    const loginResponseWithOldPasssword = await signInUser(server, user, userPassword);
    const responseWithOldPassword = await request.agent(server)
      .get('/users/profile')
      .set('Cookie', getCookies(loginResponseWithOldPasssword));
    expect(responseWithOldPassword).toHaveHTTPStatus(302);

    const loginResponseWithNewPassword = await signInUser(server, user, newPassword);
    const responseWithNewPassword = await request.agent(server)
      .get('/users/profile')
      .set('Cookie', getCookies(loginResponseWithNewPassword));
    expect(responseWithNewPassword).toHaveHTTPStatus(200);
  });

  test('delete user', async () => {
    const usersCount = 2;
    const usersListAtStart = await User.findAll();
    expect(usersListAtStart).toHaveLength(usersCount);

    const notSignedInResponse = await request.agent(server)
      .delete('/user');
    expect(notSignedInResponse).toHaveHTTPStatus(302);

    const response = await signInUser(server, hackerUser, hackerUserPassword);
    await request.agent(server)
      .delete('/user')
      .set('Cookie', getCookies(response));
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
