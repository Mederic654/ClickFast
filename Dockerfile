FROM nginx:alpine3.24

RUN apk add --no-cache libcap && \
    setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx

# change le chemin d'écriture pour éviter les problèmes de root
RUN mkdir -p /var/cache/nginx /run && \
    chown -R nginx:nginx /var/cache/nginx /run /var/log/nginx

COPY index.html style.css script.js /usr/share/nginx/html/

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]