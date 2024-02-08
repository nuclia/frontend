base-image:
	docker build -t eu.gcr.io/stashify-218417/base-monorepo:latest . -f docker/Base.Dockerfile
	docker push eu.gcr.io/stashify-218417/base-monorepo:latest
	docker tag eu.gcr.io/stashify-218417/base-monorepo:latest europe-west4-docker.pkg.dev/nuclia-internal/private/base-monorepo:latest
	docker push europe-west4-docker.pkg.dev/nuclia-internal/private/base-monorepo:latest
