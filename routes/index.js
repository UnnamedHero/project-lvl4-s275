import welcome from './welcome';

const controllers = [welcome];

export default (router, container) => controllers.forEach(c => c(router, container));
