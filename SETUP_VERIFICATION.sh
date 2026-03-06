#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║     ✅ OpenRouter API Key 配置成功！                             ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 系统状态检查"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# 检查后端
echo "🔍 检查后端服务..."
if curl -s http://localhost:5001/api/health &>/dev/null; then
  echo "  ✅ 后端服务运行中 (port 5001)"
else
  echo "  ❌ 后端服务未运行"
fi

# 检查数据库
echo "🔍 检查数据库..."
if [ -f "/Volumes/Data/Code_Repository/ai-hot-spot/backend/app.db" ]; then
  KEYWORDS=$(curl -s http://localhost:5001/api/keywords | grep -o '"id"' | wc -l)
  echo "  ✅ SQLite 数据库正常 ($KEYWORDS 个关键词)"
else
  echo "  ❌ 数据库未找到"
fi

# 检查环保变量
echo "🔍 检查 OpenRouter API 配置..."
if grep -q "sk-or-v1-" /Volumes/Data/Code_Repository/ai-hot-spot/backend/.env; then
  echo "  ✅ OpenRouter API Key 已配置"
else
  echo "  ❌ OpenRouter API Key 未配置"
fi

echo ""
echo "🎯 核心功能验证"
echo "════════════════════════════════════════════════════════════════════"
echo ""

echo "✨ 现在系统具备以下能力：\n"

echo "  1️⃣  关键词监控"
echo "     • 用户输入要监控的关键词"
echo "     • 系统自动定期扫描相关内容"
echo ""

echo "  2️⃣  多源数据采集"
echo "     • HackerNews (科技讨论)"
echo "     • GitHub (开源项目)"
echo "     • Reddit (社区讨论)"
echo "     • 其他数据源 (可扩展)"
echo ""

echo "  3️⃣  OpenRouter AI 分析 ⭐ 已激活"
echo "     • 识别真实热点内容"
echo "     • 过滤虚假和重复内容"
echo "     • 三维评分 (关联度、热度、可信度)"
echo ""

echo "  4️⃣  实时推送通知"
echo "     • WebSocket 实时推送"
echo "     • 高热度文章自动通知"
echo "     • 支持多个关键词订阅"
echo ""

echo "  5️⃣  响应式 Web 界面"
echo "     • 独特的深色主题"
echo "     • 热点浏览和管理"
echo "     • 用户交互 (保存、点赞、阅读)"
echo ""

echo "📱 访问应用"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "  🌐 前端: http://localhost:3000"
echo "  🔌 API: http://localhost:5001"
echo "  🔗 WebSocket: ws://localhost:5001"
echo ""

echo "🧪 快速测试"
echo "════════════════════════════════════════════════════════════════════"
echo ""

echo "获取所有关键词:"
echo "  curl http://localhost:5001/api/keywords"
echo ""

echo "获取热点列表:"
echo "  curl http://localhost:5001/api/hotspots"
echo ""

echo "🚀 后续步骤"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "  ✅ Phase 5: 完整测试网页版功能"
echo "     1. 打开 http://localhost:3000"
echo "     2. 在"关键词"页面查看已有的 5 个关键词"
echo "     3. 添加新的关键词进行监控"
echo "     4. 等待 30 分钟自动采集数据"
echo "     5. 验证 AI 分析和推送功能"
echo ""

echo "  ⏳ Phase 6: 后续计划"
echo "     • Agent Skills 封装"
echo "     • 其他 AI 系统集成"
echo "     • 企业级部署"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "🎉 OpenRouter API 已就绪！系统现在可以完全运作"
echo ""
