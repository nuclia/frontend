FROM nginx:1
WORKDIR /root/

ARG appFolder
ARG appId
ARG noRelativeCss

COPY ./dist/apps/${appFolder} /dist
RUN if [[ -n "$noRelativeCss" ]] true; then sed -i '' 's/href="styles/href="\/styles/g' /dist/index.html; fi

COPY nginx/${appId}.default.conf /etc/nginx/conf.d/default.conf
COPY docker/30-environment-${appId}.sh /docker-entrypoint.d/30-environment-${appId}.sh
