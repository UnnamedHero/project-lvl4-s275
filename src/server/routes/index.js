import welcome from './welcome';
import sessions from './sessions';
import users from './users';

const controllers = [welcome, sessions, users];

export default (router, container) => controllers.forEach(c => c(router, container));
