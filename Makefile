console:
		DEBUG="app:*" npm run gulp -- console

init-db:
	npm run sequelize -- db:migrate

lint:
	npm run lint ./src

publish:
	git push heroku master

test:
	npm test

start:
	npm run webpack -- -p --env development
	DEBUG="koa-flash*" NODE_ENV=development npm run nodemon -- --watch './src/server' --ext '.js, .pug' --exec npm run gulp -- server

.PHONY: test
