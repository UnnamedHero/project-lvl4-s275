start:
	DEBUG="app:*" npm run nodemon -- --watch .  --ext '.js' --exec npm run gulp -- server

test:
	npm test
						
.PHONY: test
