make:
	rm -rf ../../web/*
	cp -r top/* ../../web/
	node ribosome.js generate.js

preview:
	cd .. && .factory/node_modules/http-server/bin/http-server

.PHONY:\
  make \
  preview

.SILENT:
