import request from 'supertest';
import faker from 'faker';
import matchers from 'jest-supertest-matchers';
import sequelizeFixtures from 'sequelize-fixtures';
import path from 'path';

import app from '../src/server';
import { User, TaskStatus, sequelize } from '../src/server/models'; //eslint-disable-line
import { signInUser, getCookies } from './helpers';

const fixturesPath = path.join(__dirname, '__fixtures__');
const pathToFixture = name => path.join(fixturesPath, name);

const loadUserFixtures = async () => sequelizeFixtures.loadFile(pathToFixture('users.yml'), { User });


const makeTaskStatus = () => ({ name: faker.lorem.word() });

const postTaskStatus = async (server, authResponse, taskStatus) => request.agent(server)
  .post('/taskStatuses')
  .set('Cookie', getCookies(authResponse))
  .send({ form: { ...taskStatus } });

beforeAll(async () => {
  jasmine.addMatchers(matchers);
  await User.sync({ force: true });
  await TaskStatus.sync({ force: true });
  await loadUserFixtures();
});

describe('task statuses CRUD', () => {
  let server;
  let authResponse;
  const status = makeTaskStatus();

  beforeEach(async () => {
    server = app().listen();
    authResponse = await signInUser(server, { email: 'john.snow@wall.westeross' }, 'js');
  });

  test('create/read', async () => {
    console.log(status);
    await postTaskStatus(server, authResponse, status);


    const anotherStatus = makeTaskStatus();
    await postTaskStatus(server, authResponse, anotherStatus);

    const taskStatuses = await TaskStatus.findAll();
    expect(taskStatuses).toHaveLength(2);
  });

  test('update', async () => {
    const updatedStatusName = makeTaskStatus();
    const id = 1;
    await TaskStatus.findOne({ where: { id } });
    await request.agent(server)
      .patch(`/taskStatuses/${id}`)
      .set('Cookie', getCookies(authResponse))
      .send({ form: { ...updatedStatusName } });
    const updatedStatus = await TaskStatus.findOne({ where: { id } });
    expect(updatedStatus).toMatchObject(updatedStatusName);
  });

  test('delete', async () => {
    const id = 1;
    await request.agent(server)
      .delete(`/taskStatuses/${id}`)
      .set('Cookie', getCookies(authResponse));
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
