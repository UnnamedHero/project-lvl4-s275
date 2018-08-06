start:
	DEBUG="app:*" NODE_ENV=development npm run nodemon -- --watch .  --ext '.js' --ext '.pug' --exec npm run gulp -- server

lint:
	npm run lint .

test:
	npm test

publish:
	git push heroku master

init-db:
	npm run sequelize -- db:migrate

.PHONY: test
