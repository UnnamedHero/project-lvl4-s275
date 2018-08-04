const uri = process.env.DATABASE_URL || {};

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
    ...uri,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
    },
  },
};
