FROM nginx:alpine

# 避免基础镜像自带的 Welcome to nginx 页面在 COPY 未覆盖时残留
RUN rm -rf /usr/share/nginx/html/*

COPY .output/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 构建期校验：主页面静态资源必须已打入镜像
RUN test -f /usr/share/nginx/html/manage/time/index.html \
  && grep -q 'Nexus Time' /usr/share/nginx/html/manage/time/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
