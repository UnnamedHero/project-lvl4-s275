import welcome from './welcome';
import session from './session';
import users from './users';

const controllers = [welcome, session, users];

export default (router, container) => controllers.forEach(c => c(router, container));
