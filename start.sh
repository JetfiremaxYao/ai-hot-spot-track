#!/bin/bash
# Development startup helper script

echo "╔════════════════════════════════════════════════════════╗"
echo "║     AI 热点监控系统 - 开发环境启动助手                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT=$(pwd)

echo -e "${BLUE}📍 项目路径:${NC} $PROJECT_ROOT"
echo ""

# Check if both services should be started
if [ "$1" == "all" ]; then
  echo -e "${GREEN}✓ 启动所有服务...${NC}"
  echo ""
  
  # Start backend
  echo -e "${YELLOW}启动后端服务 (port 5001)...${NC}"
  cd backend
  npm run dev &
  BACKEND_PID=$!
  echo -e "${GREEN}✓ 后端进程 ID: $BACKEND_PID${NC}"
  echo ""
  
  # Wait a bit for backend to start
  sleep 3
  
  # Start frontend
  echo -e "${YELLOW}启动前端服务 (port 3000)...${NC}"
  cd ../frontend
  npm run dev &
  FRONTEND_PID=$!
  echo -e "${GREEN}✓ 前端进程 ID: $FRONTEND_PID${NC}"
  echo ""
  
  echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}✓ 所有服务已启动！${NC}"
  echo ""
  echo -e "${BLUE}📋 服务信息:${NC}"
  echo -e "  • 前端: ${GREEN}http://localhost:3000${NC}"
  echo -e "  • 后端: ${GREEN}http://localhost:5001${NC}"
  echo -e "  • WebSocket: ${GREEN}ws://localhost:5001${NC}"
  echo ""
  echo -e "${YELLOW}💡 提示:${NC}"
  echo -e "  1. 浏览器打开 http://localhost:3000"
  echo -e "  2. 导航到\"关键词\"页面查看初始化数据"
  echo -e "  3. 系统每 30 分钟自动采集热点"
  echo -e "  4. 按 Ctrl+C 停止所有服务"
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
  
  # Wait for processes
  wait
  
elif [ "$1" == "backend" ]; then
  echo -e "${YELLOW}启动后端服务...${NC}"
  cd backend
  npm run dev
  
elif [ "$1" == "frontend" ]; then
  echo -e "${YELLOW}启动前端服务...${NC}"
  cd frontend
  npm run dev
  
else
  echo -e "${YELLOW}用法:${NC}"
  echo ""
  echo "  启动所有服务:"
  echo -e "    ${GREEN}./start.sh all${NC}"
  echo ""
  echo "  启动后端 (port 5001):"
  echo -e "    ${GREEN}./start.sh backend${NC}"
  echo ""
  echo "  启动前端 (port 3000):"
  echo -e "    ${GREEN}./start.sh frontend${NC}"
  echo ""
  echo ""
  echo -e "${BLUE}📚 相关命令:${NC}"
  echo ""
  echo "  初次设置 (安装依赖和初始化数据库):"
  echo -e "    ${GREEN}./setup.sh${NC}"
  echo ""
  echo "  后端开发 (需要 Node.js v22+):"
  echo -e "    ${GREEN}cd backend${NC}"
  echo -e "    ${GREEN}npm install${NC}"
  echo -e "    ${GREEN}npm run dev${NC}"
  echo ""
  echo "  前端开发:"
  echo -e "    ${GREEN}cd frontend${NC}"
  echo -e "    ${GREEN}npm install${NC}"
  echo -e "    ${GREEN}npm run dev${NC}"
  echo ""
  echo "  数据库管理:"
  echo -e "    ${GREEN}cd backend${NC}"
  echo -e "    ${GREEN}npm run migrate${NC}      # 执行迁移"
  echo -e "    ${GREEN}npm run seed${NC}         # 插入初始数据"
  echo -e "    ${GREEN}npm run prisma:studio${NC} # Prisma Studio 可视化编辑"
  echo ""
  echo -e "${BLUE}🔗 链接:${NC}"
  echo -e "  • 项目文档: 查看 README.md"
  echo -e "  • 完成报告: 查看 COMPLETION_REPORT.md"
  echo -e "  • 需求文档: 查看 REQUIREMENTS.md"
  echo ""
fi
