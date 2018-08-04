const uri = process.env.DATABASE_URL || {};

export default {
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
