# API Contract Reference

本文件汇总当前项目可复用的后端接口契约，用于 Skill 调用时做参数与结果校验。

## Base
- 默认服务：`http://localhost:5001`
- 通用返回：

```json
{
  "success": true,
  "data": {},
  "error": "",
  "message": ""
}
```

## 关键词管理
- `GET /api/keywords`
- `POST /api/keywords`
  - body: `{ "name": "string", "description": "string?" }`
- `PATCH /api/keywords/:id/status`
  - body: `{ "status": "active|paused" }`
- `DELETE /api/keywords/:id`

## 热点管理
- `GET /api/hotspots`
  - query: `keyword, source, importance, timeRange, minHotness, maxHotness, sortBy, limit, offset, isRead, isSaved`
- `POST /api/hotspots/refresh`
- `GET /api/hotspots/:id`
- `PATCH /api/hotspots/:id/read`
- `PATCH /api/hotspots/:id/save`
  - body: `{ "isSaved": true|false }`
- `PATCH /api/hotspots/:id/like`
  - body: `{ "like": true|false }`

## 搜索
- `GET /api/search`
  - query: `q, mode=db|live, limit`

## 策略与通知
- `GET /api/config/source-policy`
- `PUT /api/config/source-policy`
- `POST /api/config/source-policy/reset`
- `POST /api/config/email/test`

## Socket 事件
- 服务端推送：`hotspot:new`, `newHotspot`, `refresh:done`
- 客户端发送：`subscribe`, `unsubscribe`

## 错误约定
- 参数错误：HTTP 400
- 资源不存在：HTTP 404
- 服务器错误：HTTP 500

Skill 在任何写操作前必须执行参数检查，并在输出中给出错误修复建议。
