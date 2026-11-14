#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 正在启动「清敬雅和 · 微信公众号 AI 仿写与视觉排版工作台」..."
(sleep 2 && open "http://localhost:3000") &
npm run dev
