import request from 'supertest';
import faker from 'faker';

import app from '../src/server';
import { User } from '../src/server/models'; //eslint-disable-line

describe('Create user', () => {
  let server;
  const user = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
  };
  const twinUser = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: user.email,
  };

  beforeAll(async () => {
    server = app().listen();
    await User.sync({ force: true });
  });

  test('create', async () => {
    await request.agent(server)
      .post('/users')
      .send({
        form: {
          ...user,
          password: faker.internet.password,
        },
      });

    const expectedUser = await User.findOne({
      where: {
        email: user.email,
      },
    });
    expect(expectedUser).toMatchObject(user);

    await request.agent(server)
      .post('/users')
      .send({
        form: {
          ...twinUser,
          password: faker.internet.password,
        },
      });
    const registeredUsers = await User.findAll();
    expect(registeredUsers).toHaveLength(1);
  });

  afterAll((done) => {
    server.close();
    done();
  });
});
