# Cloudflare 部署说明

这个仓库是无需构建的 Cloudflare Pages 版本：根目录 `index.html` 是前端页面，`functions/` 是后端 API，`migrations/` 是 D1 数据库表结构。

## Cloudflare Pages

创建 Pages 项目并连接本仓库：

```text
Repository: camliesj/industrial-aps-viewer-cloudflare
Build command: 留空
Build output directory: /
Production branch: main
```

## D1 数据库

创建 D1 数据库：

```text
industrial-aps-viewer
```

执行 `migrations/0001_initial.sql`。

然后把 D1 绑定到 Pages 项目：

```text
Binding name: DB
Database: industrial-aps-viewer
```

## 环境变量

Variables：

```text
APS_BUCKET_KEY=sj-industrial-viewer-20260701
APS_REGION=US
```

Secrets：

```text
APS_CLIENT_ID=你的 Autodesk APS Client ID
APS_CLIENT_SECRET=你的 Autodesk APS Client Secret
```

## Android APP

部署成功后，把 APK 的 WebView 地址改成 Pages 地址，例如：

```xml
<string name="viewer_url">https://industrial-aps-viewer.pages.dev</string>
```

然后重新打包 APK。

## 上传策略

文件不会经过 Cloudflare Worker。前端先请求 `/api/models/init-upload` 获取 Autodesk signed upload URL，然后浏览器或 APP 直接上传到 Autodesk OSS，最后调用 `/api/models/:id/complete-upload` 启动转换。
