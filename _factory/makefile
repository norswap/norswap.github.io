make: build watch

build:
	bun run build.ts
.PHONY: build

rebuild:
	bun run build.ts rebuild
.PHONY: rebuild

clean:
	rm -rf $$(find ../../web -maxdepth 1 -name "*" ! -name "web" ! -name ".git*" ! -name "*_factory")
.PHONY: clean

preview:
	bun browser-sync .. --watch
.PHONY: preview
