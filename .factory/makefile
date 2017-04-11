make:
	rm -rf ../../web/*
	node ribosome.js generate.js
	cp -r top/* ../../web/

preview:
	cd .. && .factory/node_modules/http-server/bin/http-server

.PHONY:\
  make \
  preview

.SILENT:
