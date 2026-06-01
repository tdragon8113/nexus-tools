<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-[2000]"
      aria-label="底部导航"
    >
      <van-tabbar
        :fixed="false"
        :border="true"
        safe-area-inset-bottom
        route
        active-color="#4f46e5"
        inactive-color="#64748b"
        class="mobile-tabbar font-sans pointer-events-auto border-t border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
      >
        <van-tabbar-item replace to="/manage/time" icon="notes-o">
          记录
        </van-tabbar-item>
        <van-tabbar-item replace to="/manage/time/stats" icon="bar-chart-o">
          统计
        </van-tabbar-item>
        <van-tabbar-item replace to="/manage/time/insights" icon="comment-o">
          感悟
        </van-tabbar-item>
        <van-tabbar-item replace to="/profile" icon="user-o">
          我的
        </van-tabbar-item>
      </van-tabbar>
    </div>
  </Teleport>
</template>

<style scoped>
.mobile-tabbar :deep(.van-tabbar-item) {
  font-size: 0.75rem;
  line-height: 1.2;
}

.mobile-tabbar :deep(.van-tabbar-item__text) {
  line-height: 1.2;
  text-align: center;
}

.mobile-tabbar :deep(.van-tabbar-item__icon) {
  font-size: 1.4rem;
  margin-bottom: 0.125rem;
}
</style>
