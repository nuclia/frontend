base-image:
	docker build -t europe-west4-docker.pkg.dev/nuclia-internal/private/base-monorepo:latest . -f docker/Base.Dockerfile
	docker push europe-west4-docker.pkg.dev/nuclia-internal/private/base-monorepo:latest
