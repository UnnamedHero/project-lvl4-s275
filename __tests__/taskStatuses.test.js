import request from 'supertest';
import faker from 'faker';
import matchers from 'jest-supertest-matchers';

import app from '../src/server';
import { User, TaskStatus, sequelize } from '../src/server/models'; //eslint-disable-line
import { getAuthCookies, loadFixtures } from './helpers';

const makeTaskStatus = () => ({ name: faker.lorem.word() });

const postTaskStatus = async (server, authCookies, taskStatus) => request.agent(server)
  .post('/taskStatuses')
  .set('Cookie', authCookies)
  .send({ form: { ...taskStatus } });

beforeAll(async () => {
  jasmine.addMatchers(matchers);
  await User.sync({ force: true });
  await TaskStatus.sync({ force: true });
  await loadFixtures(['users.yml']);
});

describe('task statuses CRUD', () => {
  let server;
  let authCookies;
  const status = makeTaskStatus();

  beforeEach(async () => {
    server = app().listen();
    authCookies = await getAuthCookies(server, { email: 'john.snow@wall.westeross' }, 'js');
  });

  test('create/read', async () => {
    await postTaskStatus(server, authCookies, status);
    const anotherStatus = makeTaskStatus();
    await postTaskStatus(server, authCookies, anotherStatus);

    const taskStatuses = await TaskStatus.findAll();
    expect(taskStatuses).toHaveLength(2);
  });

  test('update', async () => {
    const updatedStatusName = makeTaskStatus();
    const id = 1;
    await TaskStatus.findOne({ where: { id } });
    await request.agent(server)
      .patch(`/taskStatuses/${id}`)
      .set('Cookie', authCookies)
      .send({ form: { ...updatedStatusName } });

    const updatedStatus = await TaskStatus.findOne({ where: { id } });
    expect(updatedStatus).toMatchObject(updatedStatusName);
  });

  test('delete', async () => {
    const id = 1;
    await request.agent(server)
      .delete(`/taskStatuses/${id}`)
      .set('Cookie', authCookies);
    const taskStatuses = await TaskStatus.findAll();
    expect(taskStatuses).toHaveLength(1);
  });

  afterEach(() => {
    server.close();
  });
});

afterAll(async () => {
  await sequelize.close();
});
