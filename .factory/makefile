make: build watch

build:
	node ribosome.js generate.js build

preview:
	cd .. && .factory/node_modules/http-server/bin/http-server -o

rebuild: generate.js.rna
	rm -rf ../../web/*
	node $< build
	cp -r top/* ../../web/

watch: generate.js.rna
	node $< watch

%.rna: %
	node ribosome.js --rna $< > $@

.PHONY:\
  make \
  preview \
  build \
  rebuild

.SILENT:
