import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { Task, User, TaskStatus, Tag } from '../models'; //eslint-disable-line
import { hasErrors, buildErrorsObj } from '../../lib/formErrorObjectBuilder';
import getTags from '../../lib/models/tags';

const makeAssignedToList = async (selectedId = 'nobody') => {
  const users = await User.findAll();
  const usersData = users.map((user) => {
    const { email, id, fullName } = user;
    const name = fullName && fullName.trim().length > 0 ? fullName : email;
    const selected = selectedId === id;
    return ({ id, name, selected });
  });
  const nobody = { id: 'nobody', name: 'Nobody', selected: selectedId === 'nobody' };
  return [nobody, ...usersData];
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

const isTaskAssigned = taskForm => taskForm.assignedTo !== 'nobody';

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
      const errors = {};

      const task = Task.build(form);

      const creator = await User.findOne({ where: { id: 1 } });
      if (!creator) {
        logger(JSON.stringify(creator));
        errors.creator = 'Bad creator id';
      }

      let assignedToUser;
      if (isTaskAssigned(form)) {
        assignedToUser = await User.findOne({ where: { id: form.assignedTo } });
        if (!assignedToUser) {
          errors.assignedTo = 'Bad assignedTo user id';
        }
      }
      const taskStatus = await TaskStatus.find({ where: { id: form.taskStatus } });
      if (!taskStatus) {
        errors.taskStatus = 'invalid task status';
      }

      const tags = await getTags(form.tags);
      try {
        if (hasErrors(errors)) {
          logger(`we have errorrs: ${JSON.stringify(errors)}`);
          throw new Error(buildErrorsObj(errors));
        }
        await task.save();
        await task.setCreator(creator);
        if (assignedToUser) {
          await task.setAssignedTo(assignedToUser);
        }
        await task.setTaskStatus(taskStatus);
        await task.setTags(tags);
        ctx.flash.set('Task creates successsfully!');
        ctx.redirect('/');
      } catch (e) {
        logger(`task save error: ${JSON.stringify(e, null, ' ')}`);
        const taskStatuses = await makeTaskStatusesList();
        const assignedTo = await makeAssignedToList();
        ctx.render('tasks/new', { f: buildFormObj(task, e), taskStatuses, assignedTo });
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
      ctx.render('tasks/showTask', { task });
    })
    .get('editTask', '/tasks/:id/edit', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const task = await Task.findOne({ where: { id } });
      if (!task) {
        ctx.status = 404;
        ctx.flash.set(`Task id ${id} not found}`);
        ctx.redirect(router.url('getTasks'));
      }
      const taskStatuses = await makeTaskStatusesList(task.taskStatusId);
      const assignedTo = await makeAssignedToList(task.assignedToId);
      ctx.render('tasks/edit', { f: buildFormObj(task), taskStatuses, assignedTo });
    })
    .delete('deleteTask', '/tasks/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
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
