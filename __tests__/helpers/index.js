import request from 'supertest';
import path from 'path';
import sequelizeFixtures from 'sequelize-fixtures';

import models from '../../src/server/models'; //eslint-disable-line

const getCookies = res => res.headers['set-cookie'][0]
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

const signInUser = async (server, user, password) => request.agent(server)
  .post('/session')
  .send({
    form: {
      email: user.email,
      password,
    },
  });

export const getUserBy = async params => models.User.findOne({
  where: {
    ...params,
  },
});

export const getAuthCookies = async (server, user, password) => {
  const response = await signInUser(server, user, password);
  return getCookies(response);
};

const fixturesPath = path.join(__dirname, '..', '__fixtures__');
const pathToFixture = name => path.join(fixturesPath, name);

export const loadFixtures = async (fileNames) => {
  const paths = fileNames.map(fileName => pathToFixture(fileName));
  await sequelizeFixtures.loadFiles(paths, models);
};

export const getTagsFromTask = task => task.Tags.map(tag => tag.name).join(' ');
