import buildFormObj from '../../lib/formObjectBuilder';
import { ensureLoggedIn } from '../../lib/middlewares';
import { Task, TaskStatus } from '../models'; //eslint-disable-line

export default (router, { logger }) => {
  router.get('newTask', '/tasks/new', ensureLoggedIn, async (ctx) => {
    const task = Task.build();
    const taskStatuses = await TaskStatus.findAll({ attributes: ['id', 'name'] });
    taskStatuses[0].selected = true;
    logger(`taskStatuses: ${taskStatuses[0].selected}, ${taskStatuses[0].name}`);
    ctx.render('tasks/new', { f: buildFormObj(task), taskStatuses });
  });
};
