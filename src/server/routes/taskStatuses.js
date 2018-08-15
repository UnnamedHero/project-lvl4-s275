import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { TaskStatus } from '../models'; //eslint-disable-line

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
        ctx.redirect(router.url('getTaskStatuses'));
      } catch (e) {
        ctx.render('taskStatuses/new', { f: buildFormObj(taskStatus, e) });
      }
    })
    .delete('deleteTaskStatus', '/taskStatuses/:id', ensureLoggedIn, async (ctx) => {
      const totalTaskStatuses = await TaskStatus.count({ where: {} });
      if (totalTaskStatuses <= 1) {
        ctx.flash.set('Cannot delete last task status. At least one task status must present');
        ctx.redirect(router.url('getTaskStatuses'));
        return;
      }

      const { id } = ctx.params;

      const taskStatus = await TaskStatus.findOne({
        where: { id },
      });
      logger(`${id}: ${taskStatus}`);
      try {
        await taskStatus.destroy();
        ctx.flash.set(`Task status ${taskStatus.name} deleted`);
      } catch (e) {
        ctx.flash.set(`Task status ${taskStatus.name} NOT deleted!!!`);
      }
      ctx.redirect(router.url('getTaskStatuses'));
    });
};
