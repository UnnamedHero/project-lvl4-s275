import welcome from './welcome';
import sessions from './sessions';
import users from './users';
import taskStatuses from './taskStatuses';
import tasks from './tasks';

const controllers = [welcome, sessions, users, taskStatuses, tasks];

export default (router, container) => controllers.forEach(c => c(router, container));
