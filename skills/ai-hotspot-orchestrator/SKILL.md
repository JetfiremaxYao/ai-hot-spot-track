---
name: ai-hotspot-orchestrator
description: 用于驱动 AI 热点监控系统的总控技能。凡是用户提到“热点监控、关键词监控、热点刷新、全网搜索、策略配置、邮件提醒、Socket 实时推送、热点分析”时都应优先启用本技能，即使用户没有明确提到 skill 或 API。该技能负责将用户意图路由到关键词管理、热点刷新与检索、实时通知、策略配置四条流程，并输出统一结果。
---

# AI Hotspot Orchestrator

## 目标
将已有 AI 热点监控系统能力编排为一个单入口技能，面向“监控 + 搜索 + 分析 + 通知”全流程任务。

## 触发时机
当用户出现以下诉求时，直接使用本技能：
- 管理监控关键词（新增、暂停、恢复、删除、查看状态）
- 手动触发热点刷新并查看结果
- 查询热点（筛选、排序、分页、已读/收藏、详情）
- 执行一次性搜索（数据库搜索或实时全网搜索）
- 调整采集策略、发送测试邮件、查看通知链路

## 前置检查
1. 读取 `references/api-contract.md`，确认可用接口、参数与响应结构。
2. 对写操作先做参数校验，再调用接口。
3. 若用户描述不完整，先补齐关键参数再执行。

## 输入协议
将用户请求规范化为以下结构：

```json
{
  "intent": "keywords.manage | hotspots.refresh | hotspots.query | search.run | policy.update | notification.test",
  "payload": {},
  "constraints": {
    "dryRun": false,
    "maxItems": 20
  }
}
```

字段说明：
- `intent`：动作类型。
- `payload`：动作参数。
- `constraints.dryRun`：只做参数检查，不实际调用写接口。
- `constraints.maxItems`：限制返回条目数。

## 输出协议
始终输出 JSON，对齐如下模板：

```json
{
  "success": true,
  "intent": "hotspots.query",
  "summary": "一句话总结",
  "data": {},
  "nextActions": [
    "可执行下一步 1",
    "可执行下一步 2"
  ],
  "errors": []
}
```

要求：
- `summary` 必须简洁可读。
- `errors` 中放结构化错误对象或错误信息。
- 失败时 `success=false`，并给出可执行的恢复建议。

## 执行路由
### A. 关键词管理 (`keywords.manage`)
1. 查询：调用 `GET /api/keywords`。
2. 新增：调用 `POST /api/keywords`，校验 `name` 非空。
3. 状态更新：调用 `PATCH /api/keywords/:id/status`，状态仅允许 `active|paused`。
4. 删除：调用 `DELETE /api/keywords/:id`。
5. 输出最新关键词统计（总数、活跃数、暂停数）。

### B. 热点刷新 (`hotspots.refresh`)
1. 调用 `POST /api/hotspots/refresh`。
2. 返回“任务已启动”后，提示用户可监听 `refresh:done` 或稍后查询热点列表。
3. 若收到实时结果，汇总 `newCount` 与 `totalProcessed`。

### C. 热点查询 (`hotspots.query`)
1. 调用 `GET /api/hotspots`。
2. 支持组合参数：`keyword/source/importance/timeRange/sortBy/isRead/isSaved/limit/offset`。
3. 若用户要详情：调用 `GET /api/hotspots/:id`。
4. 若用户要交互写入：
- 已读：`PATCH /api/hotspots/:id/read`
- 收藏：`PATCH /api/hotspots/:id/save`
- 点赞：`PATCH /api/hotspots/:id/like`

### D. 搜索 (`search.run`)
1. 参数校验：`q` 不能为空。
2. 默认 `mode=db`，需要实时抓取时用 `mode=live`。
3. 调用 `GET /api/search?q=...&mode=...`。
4. 输出结果数量、来源分布、建议下一步（是否加入关键词监控）。

### E. 策略配置 (`policy.update`)
1. 查询策略：`GET /api/config/source-policy`。
2. 更新策略：`PUT /api/config/source-policy`。
3. 重置策略：`POST /api/config/source-policy/reset`。
4. 对阈值参数做边界提醒（如 `ultraHotThreshold` 合理区间）。

### F. 通知测试 (`notification.test`)
1. 触发 `POST /api/config/email/test`。
2. 校验 smtp 配置完整性（邮箱、主机、端口、账号、密码）。
3. 输出成功/失败数量及下一步排障建议。

## 错误处理
- 400：参数问题，返回可直接修复的字段提示。
- 404：资源不存在，建议先查询列表确认 ID。
- 500：系统错误，建议重试或降级为只读查询。
- 网络超时：提示稍后重试，并建议缩小查询范围。

## 安全与边界
- 不输出任何密钥、密码、授权码。
- 不猜测不存在的 API。
- 不直接修改数据库文件。
- 仅通过既有后端接口执行操作。

## 结果质量检查清单
执行完成后检查：
1. 是否严格使用了定义内的 intent 与输出协议。
2. 是否对写操作做了参数校验。
3. 是否给出了下一步建议。
4. 是否暴露敏感信息（必须为否）。

## 示例
### 示例 1：新增关键词
输入：
```json
{
  "intent": "keywords.manage",
  "payload": {"action": "create", "name": "OpenAI Agents"}
}
```

输出：
```json
{
  "success": true,
  "intent": "keywords.manage",
  "summary": "关键词已新增并默认启用监控",
  "data": {"name": "OpenAI Agents", "status": "active"},
  "nextActions": ["立即触发一次热点刷新", "订阅该关键词的实时推送"],
  "errors": []
}
```

### 示例 2：实时搜索
输入：
```json
{
  "intent": "search.run",
  "payload": {"q": "Claude code agent", "mode": "live"}
}
```

输出：
```json
{
  "success": true,
  "intent": "search.run",
  "summary": "已完成实时全网搜索，返回 12 条结果",
  "data": {"count": 12, "mode": "live"},
  "nextActions": ["将高相关关键词加入监控", "按热度降序查看热点列表"],
  "errors": []
}
```
