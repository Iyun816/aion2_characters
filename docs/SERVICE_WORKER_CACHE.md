# Service Worker 图片缓存说明

## 功能概述

站点通过 Service Worker 自动缓存常用的远程图片资源（角色头像、装备图标等），减少重复请求、加快加载速度，并支持断网后读取已缓存的图片。

## 缓存策略

- **缓存域名**：`assets.playnccdn.com`、`tw.ncsoft.com`、`download.plaync.com.tw`、`fizz-download.playnccdn.com`
- **文件类型**：`.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`、`.svg`
- **生命周期**：首次访问写入缓存；24 小时内命中缓存直接返回；过期后自动重新请求并更新；离线状态下优先使用缓存。

## 缓存管理提示

Service Worker 缓存完全存放在访问者自己的浏览器中，不会占用服务器空间。如需手动清除，可使用以下任一方式：

1. Chrome DevTools → Application → Cache Storage → 删除 `image-cache-v2-images`
2. 控制台执行：
   ```js
   caches.delete('image-cache-v2-images');
   navigator.serviceWorker.getRegistration().then(reg => reg?.unregister());
   ```
3. 直接清空浏览器缓存或站点数据

## 文件结构

```
public/
  sw.js                           # Service Worker 主文件
src/
  utils/
    serviceWorker.ts              # Service Worker 工具
  main.tsx                        # 注册 Service Worker
```

## 调试与排查

- **查看缓存内容**：DevTools → Application → Cache Storage → `image-cache-v2-images`
- **检查日志**：Console 中过滤 `[SW]`，可看到命中/更新情况

## 更新日志

- **v1.1 (2026-01-12)**：移除后台缓存清理入口，仅保留浏览器手动清理方案；补充文档说明
- **v1.0 (2026-01-04)**：实现图片缓存、默认 24 小时失效、支持手动清理脚本
