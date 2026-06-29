FROM nginx:alpine

# 避免基础镜像自带的 Welcome to nginx 页面在 COPY 未覆盖时残留
RUN rm -rf /usr/share/nginx/html/*

COPY dist /usr/share/nginx/html/manage/time
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 构建期校验：SPA 入口须位于 base 路径下
RUN test -f /usr/share/nginx/html/manage/time/index.html \
  && grep -q '时光记' /usr/share/nginx/html/manage/time/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
