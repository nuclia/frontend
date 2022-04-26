FROM nginx:1
WORKDIR /root/

ARG appFolder
ARG appId

COPY ./dist/apps/${appFolder} /dist
COPY nginx/${appId}.default.conf /etc/nginx/conf.d/default.conf
COPY docker/30-environment-${appId}.sh /docker-entrypoint.d/30-environment-${appId}.sh