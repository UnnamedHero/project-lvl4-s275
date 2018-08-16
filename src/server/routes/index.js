import welcome from './welcome';
import sessions from './sessions';
import users from './users';
import taskStatuses from './taskStatuses';

const controllers = [welcome, sessions, users, taskStatuses];

export default (router, container) => controllers.forEach(c => c(router, container));
