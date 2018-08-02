start:
	DEBUG="app:*" npm run nodemon -- --watch .  --ext '.js' --exec npm run gulp -- server

lint:
	npm run lint .

test:
	npm test

publish:
	git push heroku master
	
.PHONY: test
