# Runtime image for scheduler-ui. The build context is the project root and
# expects `dist/` from `nx run scheduler-ui:build`; use
# `nx run scheduler-ui:docker:build`.
ARG NGINX_VERSION=1.30

FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine

# Where /api requests are proxied to; override at deploy time
ENV API_UPSTREAM=http://scheduler-api:3000

# Makes the entrypoint set NGINX_LOCAL_RESOLVERS from /etc/resolv.conf
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY dist/browser /usr/share/nginx/html

# nginx-unprivileged listens on 8080 and already runs as a non-root user
EXPOSE 8080
