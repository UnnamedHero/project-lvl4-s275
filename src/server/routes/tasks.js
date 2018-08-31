import find from 'lodash/find';
import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { Task, User, TaskStatus, Tag, sequelize } from '../models'; //eslint-disable-line
import { makeUserLists, makeTaskStatusLists } from '../../lib/models/tasks';
import { getTags, makeTagsString, getTagsFromString } from '../../lib/models/tags';
import makePaginationItems from '../../lib/pagination';
import { buildErrorsObj, hasErrors } from '../../lib/formErrorObjectBuilder';

const scopeTable = [
  {
    name: 'createdBy',
    getScope: value => (value === 'any'
      ? null
      : { method: ['creator', value] }),
  },
  {
    name: 'taskStatus',
    getScope: value => (value === 'any'
      ? null
      : { method: ['taskStatus', value] }),
  },
  {
    name: 'assignedTo',
    getScope: value => (value === 'any'
      ? null
      : { method: ['assignedTo', value === 'nobody' ? null : value] }),
  },
  {
    name: 'tags',
    getScope: (value) => {
      const tags = getTagsFromString(value);
      return tags.length === 0
        ? null
        : { method: ['tags', tags] };
    },
  },
];

const getTaskScopes = request => Object.keys(request)
  .reduce((acc, attr) => {
    const scopeObj = find(scopeTable, { name: attr });
    return scopeObj ? [...acc, scopeObj.getScope(request[attr])] : acc;
  }, ['defaultTagScope'])
  .filter(s => s);

export default (router, { logger }) => {
  router
    .get('newTask', '/tasks/new', ensureLoggedIn, async (ctx) => {
      const task = Task.build();
      const { taskStatuses } = await makeTaskStatusLists();
      const users = await User.findAll();
      const { userId } = ctx.session;
      const { assignedTo } = makeUserLists(users, userId, 'nobody');
      ctx.render('tasks/new', { f: buildFormObj(task), taskStatuses, assignedTo });
    })
    .post('publishTask', '/tasks', ensureLoggedIn, async (ctx) => {
      const { form } = ctx.request.body;
      const { userId } = ctx.session;
      const creator = await User.findById(userId);

      const { assignedToId } = form;
      const goodForm = {
        ...form,
        assignedToId: assignedToId === 'nobody' ? null : assignedToId,
      };
      try {
        const task = await creator.createTask(goodForm);
        const tags = await getTags(form.tags);
        await task.setTags(tags);
        ctx.flash.set('Task creates successsfully!');
        ctx.redirect('/');
      } catch (e) {
        logger(`task save error: ${JSON.stringify(e, null, ' ')}, with this dataset: ${JSON.stringify(goodForm)}`);
        const { taskStatuses } = await makeTaskStatusLists(form.taskStatusId);
        const users = await User.findAll();
        const { assignedTo } = makeUserLists(users, userId, assignedToId);
        ctx.render('tasks/new', { f: buildFormObj(goodForm, e), taskStatuses, assignedTo });
      }
    })
    .get('getTasks', '/tasks', ensureLoggedIn, async (ctx) => {
      const offset = Number(ctx.request.query.offset) || 0;
      const limit = Number(ctx.request.query.limit) || 5;
      const { query } = ctx.request;
      const scopes = getTaskScopes(query);
      const { count, rows: tasks } = await Task.scope(scopes).findAndCountAll({
        offset,
        limit,
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'taskStatus' },
        ],
        distinct: true,
      });
      const { userId } = ctx.session;
      const users = await User.findAll();
      const { createdBy } = makeUserLists(users, userId, query.createdBy);
      const { assignedToForFilter } = makeUserLists(users, userId, query.assignedTo);

      const currentTaskStatus = query.taskStatus || 'any';
      const { taskStatusesForFilter } = await makeTaskStatusLists(currentTaskStatus);

      const pagination = {
        items: makePaginationItems(count, offset, limit),
        urlAlias: 'getTasks',
      };

      const searchForm = {
        createdBy,
        assignedTo: assignedToForFilter,
        taskStatuses: taskStatusesForFilter,
        tags: query.tags,
      };
      const f = buildFormObj(searchForm);
      f.name = '';

      searchForm.name = null;
      ctx.render('tasks', {
        f,
        tasks,
        pagination,
        users: createdBy,
        assignedTo: assignedToForFilter,
        taskStatuses: taskStatusesForFilter,
        tags: query.tags,
        query,
      });
    })
    .get('showTask', '/tasks/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findOne({
        where: { id },
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'taskStatus' },
          { model: Tag, through: 'TaskTags' },
        ],
      });
      if (!task) {
        ctx.flash.set(`Task id#${id} not found`);
        ctx.redirect(router.url('getTasks'));
        return;
      }
      ctx.render('tasks/showTask', { task });
    })
    .get('editTask', '/tasks/:id/edit', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findOne({
        where: { id },
        include: [{ model: Tag, through: 'TaskTags' }],
      });
      if (!task) {
        ctx.flash.set(`Task id ${id} not found}`);
        ctx.redirect(router.url('getTasks'));
      }
      const { userId } = ctx.session;
      const { taskStatuses } = await makeTaskStatusLists(task.taskStatusId);
      const users = await User.findAll();
      const { assignedTo } = await makeUserLists(users, userId, task.assignedToId);
      task.tags = makeTagsString(task.Tags);
      ctx.render('tasks/edit', {
        f: buildFormObj(task), id, taskStatuses, assignedTo,
      });
    })
    .patch('saveEditedTask', '/tasks/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const { form } = ctx.request.body;
      const task = await Task.findById(id);
      if (!task) {
        ctx.flash.set(`Task #${id} not found`);
        ctx.redirect(router.url('getTasks'));
      }
      const { assignedToId } = form;
      const goodForm = {
        ...form,
        assignedToId: assignedToId === 'nobody' ? null : assignedToId,
      };
      logger(`new task data: ${JSON.stringify(goodForm)}`);

      try {
        const tagsArray = getTagsFromString(form.tags);
        const errors = {};
        if (tagsArray.length === 0) {
          errors.tags = 'Tag cannot be empty';
        }

        if (hasErrors(errors)) {
          throw buildErrorsObj(errors);
        }

        await task.update(goodForm);
        const tags = await getTags(form.tags);
        await task.setTags(tags);
        ctx.flash.set('Task edited successsfully!');
        ctx.redirect(router.url('showTask', { id }));
      } catch (e) {
        logger(`error editing task id ${id} with error: ${JSON.stringify(e)} with data: ${JSON.stringify(goodForm)}`);
        const { userId } = ctx.session;
        const { taskStatuses } = await makeTaskStatusLists(task.taskStatusId);
        const users = await User.findAll();
        const { assignedTo } = await makeUserLists(users, userId, task.assignedToId);
        ctx.render('tasks/edit', {
          f: buildFormObj(task, e), id, taskStatuses, assignedTo,
        });
      }
    })
    .delete('deleteTask', '/tasks/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findById(id);
      if (!task) {
        ctx.status = 404;
        ctx.redirect(router.url('getTasks'));
      }
      try {
        await task.setTags([]);
        await task.destroy();
        ctx.flash.set(`Task #${id} deleted`);
      } catch (e) {
        logger(`cannot delete task #${id}, ${e}`);
        ctx.flash.set(`Task #${id} NOT deleted`);
      }
      ctx.redirect(router.url('getTasks'));
    });
};
