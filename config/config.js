module.exports = {
  development: {
    storage: './db.development.sqlite',
    dialect: 'sqlite',
  },
  test: {
    storage: ':memory:',
    dialect: 'sqlite',
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
    },
  },
};
