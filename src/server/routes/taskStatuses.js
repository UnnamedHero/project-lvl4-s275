import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { TaskStatus, Task, sequelize } from '../models'; //eslint-disable-line

export default (router, { logger }) => {
  router
    .get('getTaskStatuses', '/taskStatuses', ensureLoggedIn, async (ctx) => {
      const allTaskStatuses = await TaskStatus.findAll();
      ctx.render('taskStatuses', { allTaskStatuses });
    })
    .get('newTaskStatus', '/taskStatuses/new', ensureLoggedIn, async (ctx) => {
      const taskStatus = TaskStatus.build();
      ctx.render('taskStatuses/new', { f: buildFormObj(taskStatus) });
    })
    .post('addTaskStatus', '/taskStatuses', ensureLoggedIn, async (ctx) => {
      const { form } = ctx.request.body;
      const taskStatus = TaskStatus.build(form);
      try {
        await taskStatus.save();
        ctx.flash.set('Task status added!');
        logger(`task status ${taskStatus.name} added`);
        ctx.redirect(router.url('getTaskStatuses'));
      } catch (e) {
        logger(`task status ${taskStatus.name} not added`);
        ctx.render('taskStatuses/new', { f: buildFormObj(taskStatus, e) });
      }
    })
    .get('getTaskStatus', '/taskStatuses/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const taskStatus = await TaskStatus.findById(id);
      ctx.render('taskStatuses/edit', { f: buildFormObj(taskStatus), id });
    })
    .patch('editTaskStatus', '/taskStatuses/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const { form } = ctx.request.body;
      const taskStatus = await TaskStatus.findById(id);
      logger(`going to change status ${id}: ${taskStatus.name} to ${form.name}`);
      try {
        await taskStatus.update(form);
        ctx.flash.set('Task status updated');
        ctx.redirect(router.url('getTaskStatuses'));
      } catch (e) {
        ctx.render('taskStatuses/edit', { f: buildFormObj(taskStatus, e), id });
      }
    })
    .delete('deleteTaskStatus', '/taskStatuses/:id', ensureLoggedIn, async (ctx) => {
      // const totalTaskStatuses = await TaskStatus.count();

      const { id } = ctx.params;
      if (id === String(1)) {
        ctx.flash.set('Cannot delete first task status.');
        ctx.redirect(router.url('getTaskStatuses'));
        return;
      }

      const taskStatus = await TaskStatus.findById(id);
      try {
        const fallbackTaskStatus = await TaskStatus.findById(1);
        await Task.update({ taskStatusId: 1 }, { where: { taskStatusId: taskStatus.id } });
        await taskStatus.destroy();
        ctx.flash.set(`Task status ${taskStatus.name} deleted. Affected tasks status set to '${fallbackTaskStatus.name}'`);
        logger(`Task status deleted ${id}: ${taskStatus.name}`);
      } catch (e) {
        ctx.flash.set(`Task status ${taskStatus.name} NOT deleted!!!`);
        logger(`Task status NOT deleted ${id}: ${taskStatus.name} reason: ${JSON.stringify(e)}`);
      }
      ctx.redirect(router.url('getTaskStatuses'));
    });
};
