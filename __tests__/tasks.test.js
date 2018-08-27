import request from 'supertest';
import faker from 'faker';
import uniq from 'lodash/uniq';

import app from '../src/server';
import { Task, Tag, sequelize } from '../src/server/models'; //eslint-disable-line
import {
  getAuthCookies, loadFixtures, getTagsFromTask,
} from './helpers';

const makeTask = (assignedToId = null) => ({
  name: faker.lorem.word(),
  description: faker.lorem.words(),
  assignedToId,
  taskStatusId: faker.random.number({ max: 4 }),
});

const makeTags = () => uniq(faker.lorem.words(5).split(' ')).join(' ');

beforeEach(async () => {
  await sequelize.sync({ force: true });
  await loadFixtures(['users.yml', 'taskStatuses.yml']);
});

describe('Tasks CRUD', () => {
  let server;
  let authCookies;

  beforeEach(async () => {
    server = app().listen();
    authCookies = await getAuthCookies(server, { email: 'john.snow@wall.westeross' }, 'js');
  });

  test('create/read', async () => {
    const task = makeTask();
    const tags = makeTags();
    await request.agent(server)
      .post('/tasks')
      .set('Cookie', authCookies)
      .send({ form: { ...task, tags } });
    const publishedTask = await Task.findOne({ where: { id: 1 }, include: [{ model: Tag, through: 'TaskTags' }] });
    expect(publishedTask).toMatchObject(task);

    const taskTags = getTagsFromTask(publishedTask);
    expect(taskTags).toBe(tags);
  });

  test('update', async () => {
    await loadFixtures(['tags.yml', 'tasks.yml']);
    const newAssignedToId = 3;
    const newTaskData = makeTask(newAssignedToId);
    const newTags = makeTags();
    await request.agent(server)
      .patch('/tasks/2')
      .set('Cookie', authCookies)
      .send({ form: { ...newTaskData, tags: newTags } });

    const editedTask = await Task.findOne({ where: { id: 2 }, include: [{ model: Tag, through: 'TaskTags' }] });
    expect(editedTask).toMatchObject(newTaskData);

    const editedTaskTags = getTagsFromTask(editedTask);
    expect(editedTaskTags).toBe(newTags);
  });

  test('delete', async () => {
    await loadFixtures(['tags.yml', 'tasks.yml']);
    const beforeCount = await Task.count();
    expect(beforeCount).toBe(3);

    await request.agent(server)
      .delete('/tasks/1')
      .set('Cookie', authCookies);
    const afterCount = await Task.count();
    expect(afterCount).toBe(beforeCount - 1);

    const task1 = await Task.findById(1);
    expect(task1).toBeNull();
  });

  afterEach(() => {
    server.close();
  });
});

afterAll(async () => {
  await sequelize.close();
});
