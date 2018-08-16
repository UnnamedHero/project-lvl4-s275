import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { TaskStatus } from '../models'; //eslint-disable-line

const getTaskStatusById = async id => TaskStatus.findOne({ where: { id } });

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
      const taskStatus = await getTaskStatusById(id);
      ctx.render('taskStatuses/edit', { f: buildFormObj(taskStatus), id });
    })
    .patch('editTaskStatus', '/taskStatuses/:id', ensureLoggedIn, async (ctx) => {
      const { id } = ctx.params;
      const { form } = ctx.request.body;
      const taskStatus = await getTaskStatusById(id);
      logger(`going to change status ${id}: ${taskStatus.name} to ${form.name}`);
      try {
        await taskStatus.update(form);
        ctx.flash.set('Task status updated');
      } catch (e) {
        ctx.flash.set(`Task ${taskStatus.name} NOT updated`);
      }
      ctx.redirect(router.url('getTaskStatuses'));
    })
    .delete('deleteTaskStatus', '/taskStatuses/:id', ensureLoggedIn, async (ctx) => {
      const totalTaskStatuses = await TaskStatus.count({ where: {} });
      if (totalTaskStatuses <= 1) {
        ctx.flash.set('Cannot delete last task status. At least one task status must present');
        ctx.redirect(router.url('getTaskStatuses'));
        return;
      }

      const { id } = ctx.params;
      const taskStatus = await getTaskStatusById(id);
      try {
        await taskStatus.destroy();
        ctx.flash.set(`Task status ${taskStatus.name} deleted`);
        logger(`Task status deleted ${id}: ${taskStatus.name}`);
      } catch (e) {
        ctx.flash.set(`Task status ${taskStatus.name} NOT deleted!!!`);
        logger(`Task status NOT deleted ${id}: ${taskStatus.name}`);
      }
      ctx.redirect(router.url('getTaskStatuses'));
    });
};
