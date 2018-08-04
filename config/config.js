const uriParser = require('parse-database-url');

const uri = process.env.DATABASE_URL || '';
const productionConfig = uriParser(uri);

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
    ...productionConfig,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
    },
  },
};
