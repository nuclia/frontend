.PHONY: publish
publish:
	python bump.py $(ARGS)
	pip install wheel twine
	pip wheel -w dist ./
	twine upload dist/*
