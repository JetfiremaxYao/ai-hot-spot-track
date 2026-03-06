#!/bin/bash
# Quick start script for AI Hot Spot monitoring system

set -e

echo "🚀 AI 热点监控系统 - 快速启动"
echo "================================"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "❌ 需要 Node.js v22 或更高版本"
  echo "当前版本: $(node -v)"
  exit 1
fi

echo "✅ Node.js 版本检查通过"
echo ""

# Install backend dependencies
echo "📦 安装后端依赖..."
cd backend
npm install --loglevel=warn
echo "✅ 后端依赖安装完成"
echo ""

# Install frontend dependencies
echo "📦 安装前端依赖..."
cd ../frontend
npm install --loglevel=warn
echo "✅ 前端依赖安装完成"
echo ""

# Database setup
cd ../backend
echo "🗄️  初始化数据库..."
npm run migrate -- --force --skip-seed >/dev/null 2>&1 || true
npm run seed >/dev/null 2>&1
echo "✅ 数据库初始化完成"
echo ""

# Environment variables check
echo "🔧 环境变量检查..."
if [ ! -f "backend/.env" ]; then
  echo "⚠️  创建 backend/.env..."
  cat > backend/.env << EOF
PORT=5001
DATABASE_URL="file:./app.db"
# OPENROUTER_API_KEY=your_api_key_here
FRONTEND_URL=http://localhost:3000
EOF
fi

if [ ! -f "frontend/.env" ]; then
  echo "⚠️  创建 frontend/.env..."
  cat > frontend/.env << EOF
VITE_API_BASE_URL=http://localhost:5001
EOF
fi
echo "✅ 环境变量配置完成"
echo ""

echo "======================================"
echo "✅ 启动准备完成！"
echo ""
echo "📋 后续步骤:"
echo "  1. 后台运行后端服务:"
echo "     cd backend && npm run dev"
echo ""
echo "  2. 前台运行前端服务 (新终端):"
echo "     cd frontend && npm run dev"
echo ""
echo "  3. 打开浏览器访问:"
echo "     http://localhost:3000"
echo ""
echo "💡 提示:"
echo "  - 后端 API: http://localhost:5001"
echo "  - WebSocket: ws://localhost:5001"
echo "  - 核心特性: 实时热点推送、热度评分、多源数据采集"
echo ""
echo "📚 文档: 查看 README.md 获取完整信息"
echo "======================================"
