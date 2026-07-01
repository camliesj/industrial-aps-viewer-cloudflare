# 移动端优先 Viewer 路线

目标：最终产品以手机和平板为主要使用端，而不是把 PC 端 APS Viewer 简单封装进 WebView。

## 当前阶段：移动端可用预览

Cloudflare 线上版先提供移动端轻量预览：

- 项目和文件管理继续使用 Cloudflare Pages + Functions + D1。
- 上传和转换继续使用 Autodesk APS。
- 手机端点击文件时默认展示 APS 缩略图。
- PC/平板仍可尝试完整 APS Viewer。

这一步解决“手机端完全打不开”的阻塞，但不是最终 Viewer 形态。

## 最终架构

```text
移动 APP
  -> Cloudflare API：项目、文件、权限、状态
  -> 转换服务：生成移动端友好资产
  -> 原生 / 移动端渲染器：打开图纸和模型
```

## 2D 图纸路线

优先把 DWG/DXF/DWF 转为移动端友好格式：

- PDF：适合图纸查看、缩放、标注和分享。
- PNG/JPEG 瓦片：适合大图纸快速缩放和平移。
- SVG：适合轻量矢量图纸，但 CAD 复杂图层兼容性需要验证。

第一版推荐：

```text
DWG/DXF -> PDF 或高分辨率图片 -> 手机端查看器
```

## 3D 模型路线

移动端不要依赖 APS Viewer 作为核心渲染器。推荐转换为：

- glTF / GLB
- Draco 压缩网格
- KTX2 / Basis 纹理

APP 渲染选型：

- Flutter：`flutter_cube` / 原生 SceneView 插件 / 自定义平台视图
- React Native：Three.js + Expo GL 或原生 SceneView
- Android 原生：Filament / SceneView
- Unity：功能强，但包体和工程复杂度更高

第一版推荐：

```text
Android 原生 / Flutter + GLB 查看器
```

## 转换服务

Cloudflare Workers 不适合跑 CAD/3D 重型转换任务。需要新增一个转换服务：

- 阿里云 ECS + Docker
- 阿里云函数计算容器
- 后续可替换为 Kubernetes / 队列任务

职责：

- 从 Autodesk OSS 或自有对象存储拉取源文件。
- 对 2D 生成 PDF/图片瓦片。
- 对 3D 生成 GLB/压缩资产。
- 回写资产 URL 和转换状态到 Cloudflare D1 或业务 API。

## MVP 里程碑

### M1：手机端可用

- 上传文件
- 查看项目和文件列表
- 查看转换状态
- 手机端显示缩略图/预览图
- PC 端保留完整 APS Viewer

### M2：移动端 2D 图纸

- DWG/DXF 转 PDF 或图片
- 手机端支持缩放、平移、截图分享
- 支持图纸分页/图层基础信息

### M3：移动端 3D 模型

- STEP/IFC/RVT 等转换为 GLB
- 手机端旋转、缩放、平移
- 基础构件选择和属性展示

### M4：工业级能力

- 测量
- 剖切
- 爆炸视图
- 大模型分片
- 离线缓存
- 权限和协作

## 当前代码状态

- Cloudflare Pages 线上地址：`https://industrial-aps-viewer-cloudflare.pages.dev`
- 手机端默认打开轻量预览。
- 缩略图接口：`GET /api/models/:id/thumbnail`
- 完整 APS Viewer 作为可选尝试，不再作为手机端主路径。
