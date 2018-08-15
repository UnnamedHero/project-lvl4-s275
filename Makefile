console:
		DEBUG="app:*" npm run gulp -- console


init-db:
	npm run sequelize -- db:migrate

populate-db:
	npm run sequelize -- db:seed:all

drop-db:
	npm run sequelize -- db:drop

lint:
	npm run lint ./src

publish:
	git push heroku master

test:
	DEBUG="app" NODE_ENV=test npm test

watch:
	DEBUG="app" NODE_ENV=test npm test -- --watch

start:
	npm run webpack -- -p --env development
	DEBUG="app*" NODE_ENV=development npm run nodemon -- --watch './src/server' --ext '.js, .pug' --exec npm run gulp -- server

.PHONY: test
