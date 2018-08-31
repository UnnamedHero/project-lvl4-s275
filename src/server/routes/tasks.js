import find from 'lodash/find';
import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { Task, User, TaskStatus, Tag, sequelize } from '../models'; //eslint-disable-line
// import { hasErrors, buildErrorsObj } from '../../lib/formErrorObjectBuilder';
import nameOrEmail from '../../lib/nameOrEmail';
import { getTags, makeTags, getTagsFromString } from '../../lib/models/tags';
import makePaginationItems from '../../lib/pagination';

const makeUsersList = (users, currentUserId) => {
  const otherUsers = users
    .filter(user => String(user.id) !== String(currentUserId))
    .map((user) => {
      const { id } = user;
      const name = nameOrEmail(user);
      return ({ id, name });
    });

  const currentUser = {
    id: currentUserId,
    name: 'Me',
  };
  return [currentUser, ...otherUsers];
};

const makeFilterUser = (name, selectedId) => {
  const id = name.toLowerCase();
  return {
    id,
    name,
    selected: selectedId === id,
  };
};

const makeCreatedByList = (users, selectedId = 'any') => {
  const usersForSelect = users.map(user => ({
    ...user,
    selected: String(user.id) === selectedId,
  }));
  return [
    makeFilterUser('Any', selectedId),
    ...usersForSelect,
  ];
};

const makeAssignedToList = (users, selectedId = 'any') => {
  const [any, ...others] = makeCreatedByList(users, selectedId);
  return [
    any,
    makeFilterUser('Nobody', selectedId),
    ...others,
  ];
};

const makeTaskStatusesList = async (selectedId) => {
  const taskStatuses = await TaskStatus.findAll();
  const realSelectedId = selectedId || String(taskStatuses[0].id);
  const taskStatusesWithSelected = taskStatuses.map(taskStatus => ({
    id: taskStatus.id,
    name: taskStatus.name,
    selected: realSelectedId === String(taskStatus.id),
  }));
  return taskStatusesWithSelected;
};

const prependAnyTo = (list, selectedId = 'nobody') => [
  {
    id: 'any', name: 'Any', selected: selectedId === 'any',
  },
  ...list,
];

const makeSearchTaskStatusList = async (selectedId) => {
  const list = await makeTaskStatusesList(selectedId);
  return prependAnyTo(list, selectedId);
};

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
      const taskStatuses = await makeTaskStatusesList();
      const { assignedTo } = await makeUsersList(ctx.session.userId);
      ctx.render('tasks/new', { f: buildFormObj(task), taskStatuses, assignedTo });
    })
    .post('publishTask', '/tasks', ensureLoggedIn, async (ctx) => {
      const { form } = ctx.request.body;
      const id = ctx.session.userId;
      const creator = await User.findById(id);

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
        const taskStatuses = await makeTaskStatusesList();
        const { assignedTo } = await makeUsersList(id);
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
      const usersList = makeUsersList(users, userId);
      const createdBy = makeCreatedByList(usersList, query.createdBy);
      const assignedTo = makeAssignedToList(usersList, query.assignedTo);

      const currentTaskStatus = query.taskStatus || 'any';
      const taskStatuses = await makeSearchTaskStatusList(currentTaskStatus);

      const pagination = {
        items: makePaginationItems(count, offset, limit),
        urlAlias: 'getTasks',
      };

      ctx.render('tasks', {
        tasks,
        pagination,
        users: createdBy,
        assignedTo,
        taskStatuses,
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
        ctx.status = 404;
        ctx.flash.set(`Task id#${id} not found`);
        ctx.redirect(router.url('getTasks'));
        return;
      }
      // task.tags = makeTags(task.Tags);
      ctx.render('tasks/showTask', { task });
    })
    .get('editTask', '/tasks/:id/edit', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findOne({
        where: { id },
        include: [{ model: Tag, through: 'TaskTags' }],
      });
      if (!task) {
        ctx.status = 404;
        ctx.flash.set(`Task id ${id} not found}`);
        ctx.redirect(router.url('getTasks'));
      }
      const { userId } = ctx.session;
      const taskStatuses = await makeTaskStatusesList(task.taskStatusId);
      const { assignedTo } = await makeUsersList(userId, task.assignedToId);
      task.tags = makeTags(task.Tags);
      ctx.render('tasks/edit', {
        f: buildFormObj(task), id, taskStatuses, assignedTo,
      });
    })
    .patch('saveEditedTask', '/tasks/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const { form } = ctx.request.body;
      const task = await Task.findById(id);
      if (!task) {
        ctx.status = 404;
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
        await task.update(goodForm);
        const tags = await getTags(form.tags);
        await task.setTags(tags);
        ctx.flash.set('Task edited successsfully!');
        ctx.redirect(router.url('showTask', { id }));
      } catch (e) {
        logger(`error editing task id ${id} with error: ${JSON.stringify(e)} with data: ${JSON.stringify(goodForm)}`);
        const { userId } = ctx.session;
        const taskStatuses = await makeTaskStatusesList(task.taskStatusId);
        const { assignedTo } = await makeUsersList(userId, task.assignedToId);
        task.tags = form.tags;
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
