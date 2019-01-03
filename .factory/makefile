make: build watch

build: generate.js.rna
	node $< build

preview:
	cd .. && .factory/node_modules/http-server/bin/http-server -o

rebuild: generate.js.rna
	rm -rf ../../web/*
	echo '[]' > posts.json
	node $< rebuild
	cp -r top/* ../../web/

watch: generate.js.rna
	node $< watch

%.rna: %.dna
	node ribosome.js --rna $< > $@

ifeq ($(OS),Windows_NT)

install:
	npm install

update:
	npm update

setup:
	rm -rf node_modules
	ln -sF node_modules_win node_modules
#	mklink /J node_modules node_modules_win

else

install:
	npm install --python=python2.7

update:
    npm update --python=python2.7

setup:
	rm -rf node_modules
	ln -sF node_modules_mac node_modules

endif

.PHONY:\
  make \
  preview \
  build \
  rebuild

.SILENT:
