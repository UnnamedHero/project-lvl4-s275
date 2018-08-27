import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { Task, User, TaskStatus, Tag } from '../models'; //eslint-disable-line
// import { hasErrors, buildErrorsObj } from '../../lib/formErrorObjectBuilder';
import nameOrEmail from '../../lib/nameOrEmail';
import { getTags, makeTags } from '../../lib/models/tags';

const makeAssignedToList = async (selectedId = 'nobody') => {
  const users = await User.findAll();
  const usersWithSelecled = users.map((user) => {
    const { id } = user;
    const name = nameOrEmail(user);
    const selected = selectedId === user.id;
    return ({ id, name, selected });
  });
  const nobody = {
    id: 'nobody', name: 'Nobody', selected: selectedId === 'nobody',
  };
  return [nobody, ...usersWithSelecled];
};

const makeTaskStatusesList = async (selectedId) => {
  const taskStatuses = await TaskStatus.findAll();
  const realSelectedId = selectedId || taskStatuses[0].id;
  const taskStatusesWithSelected = taskStatuses.map(taskStatus => ({
    id: taskStatus.id,
    name: taskStatus.name,
    selected: realSelectedId === taskStatus.id,
  }));
  return taskStatusesWithSelected;
};

export default (router, { logger }) => {
  router
    .get('newTask', '/tasks/new', ensureLoggedIn, async (ctx) => {
      const task = Task.build();
      const taskStatuses = await makeTaskStatusesList();
      const assignedTo = await makeAssignedToList();
      ctx.render('tasks/new', { f: buildFormObj(task), taskStatuses, assignedTo });
    })
    .post('publishTask', '/tasks', ensureLoggedIn, async (ctx) => {
      const { form } = ctx.request.body;

      const creator = await User.findOne({ where: { id: 1 } });

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
        return;
      } catch (e) {
        logger(`task save error: ${JSON.stringify(e, null, ' ')}`);
        const taskStatuses = await makeTaskStatusesList();
        const assignedTo = await makeAssignedToList();
        ctx.render('tasks/new', { f: buildFormObj(goodForm, e), taskStatuses, assignedTo });
      }
    })
    .get('getTasks', '/tasks', ensureLoggedIn, async (ctx) => {
      const tasks = await Task.findAll({
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'taskStatus' },
        ],
      });
      ctx.render('tasks', { tasks });
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
      task.tags = makeTags(task.Tags);
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
      const taskStatuses = await makeTaskStatusesList(task.taskStatusId);
      const assignedTo = await makeAssignedToList(task.assignedToId);
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
      try {
        const { assignedToId } = form;
        const goodForm = {
          ...form,
          assignedToId: assignedToId === 'nobody' ? null : assignedToId,
        };
        logger(`new task data: ${goodForm}`);
        await task.update(goodForm);
        const tags = await getTags(form.tags);
        logger('updating tags');
        await task.setTags(tags);
        logger('tags updated');
        ctx.flash.set('Task edited successsfully!');
        ctx.redirect(router.url('showTask', { id }));
      } catch (e) {
        logger(`error editing task id ${id} with error: ${JSON.stringify(e)}`);
        const taskStatuses = await makeTaskStatusesList(task.taskStatusId);
        const assignedTo = await makeAssignedToList(task.assignedToId);
        task.tags = form.tags;
        ctx.render('tasks/edit', {
          f: buildFormObj(task, e), id, taskStatuses, assignedTo,
        });
      }
    })
    .delete('deleteTask', '/tasks/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      // TODO: byId
      const task = await Task.findOne({
        where: { id },
      });
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
