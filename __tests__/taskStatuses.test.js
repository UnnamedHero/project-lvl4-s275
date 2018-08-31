import request from 'supertest';
import faker from 'faker';
import matchers from 'jest-supertest-matchers';

import app from '../src/server';
import { User, TaskStatus, Task, sequelize } from '../src/server/models'; //eslint-disable-line
import { getAuthCookies, loadFixtures } from './helpers';

const taskStatusesSet = new Set();

const makeTaskStatus = () => {
  const expectedName = faker.lorem.word();
  if (taskStatusesSet.has(expectedName)) {
    return makeTaskStatus();
  }
  taskStatusesSet.add(expectedName);
  return { name: expectedName };
};

const postTaskStatus = async (server, authCookies, taskStatus) => request.agent(server)
  .post('/taskStatuses')
  .set('Cookie', authCookies)
  .send({ form: { ...taskStatus } });

beforeAll(async () => {
  jasmine.addMatchers(matchers);
  await User.sync({ force: true });
  await loadFixtures(['users.yml']);
});

describe('task statuses CRUD', () => {
  let server;
  let authCookies;


  beforeEach(async () => {
    await TaskStatus.sync({ force: true });
    taskStatusesSet.clear();
    server = app().listen();
    authCookies = await getAuthCookies(server, { email: 'john.snow@wall.westeross' }, 'js');
  });

  test('create/read', async () => {
    const status = makeTaskStatus();
    const anotherStatus = makeTaskStatus();
    await postTaskStatus(server, authCookies, status);
    await postTaskStatus(server, authCookies, anotherStatus);

    const taskStatuses = await TaskStatus.findAll();
    expect(taskStatuses).toHaveLength(2);
  });

  test('update', async () => {
    await loadFixtures(['taskStatuses.yml']);
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
    await Task.sync();
    await loadFixtures(['taskStatuses.yml']);
    const id = 2;
    await request.agent(server)
      .delete(`/taskStatuses/${id}`)
      .set('Cookie', authCookies);
    const taskStatuses = await TaskStatus.findAll();
    expect(taskStatuses).toHaveLength(3);
  });

  afterEach(() => {
    server.close();
  });
});

afterAll(async () => {
  await sequelize.close();
});
