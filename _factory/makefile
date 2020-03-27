make: build watch

build: generate.js.rna
	node $< build

preview:
	cd .. && _factory/node_modules/live-server/live-server.js

rebuild: generate.js.rna
	rm -rf ../../web/*
	echo '[]' > posts.json
	node $< rebuild
	cp -r top/* ../../web/

watch: generate.js.rna
	node $< watch

generate.js.rna: generate.js
	node ribosome.js --rna $< > $@

%.rna: %.dna
	node ribosome.js --rna $< > $@

ifeq ($(OS),Windows_NT)

install:
# Uncomment if getting a VCBuild.exe error
#	npm install -g --production windows-build-tools
#	npm install -g node-gyp@latest
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
	chmod +x node_modules/live-server/live-server.js

endif

.PHONY:\
  make \
  preview \
  build \
  rebuild

#.SILENT:
