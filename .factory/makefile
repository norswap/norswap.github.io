make:
	rm -rf ../../web2/*
	cp -r top/* ../../web2/
	node ribosome.js generate.js

preview:
	cd .. && .factory/node_modules/.bin/http-server

.PHONY:\
  make \
  preview

.SILENT:
