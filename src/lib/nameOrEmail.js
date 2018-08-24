export default (user) => {
  if (user) {
    const fullName = user.fullName.trim();
    return `${fullName.length > 0 ? `${fullName} [${user.email}]` : user.email}`;
  }
  return 'Nobody';
};
