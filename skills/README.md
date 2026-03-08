# Skills

本目录用于封装【AI 热点监控工具】的 Agent Skills。

设计原则：
- 仅新增 Skills 资源，不修改 `frontend/` 与 `backend/` 现有业务代码。
- Skill 通过既有 API 与数据契约工作，避免侵入式改造。
- 优先提供稳定、可复用、可评测的输入输出格式。

当前已提供：
- `ai-hotspot-orchestrator/`：热点监控总控技能（关键词管理、监控刷新、搜索分析、策略通知）。
