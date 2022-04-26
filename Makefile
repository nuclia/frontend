base-image:
	docker build -t eu.gcr.io/stashify-218417/base-monorepo:latest . -f docker/Base.Dockerfile
	docker push eu.gcr.io/stashify-218417/base-monorepo:latest
