# AION2 椿夏军团

AION2 天族希埃尔服务器 PVE 休闲军团管理系统

## 项目简介

这是一个为 AION2 游戏军团打造的角色管理和展示平台,提供角色信息查询、装备展示、军团成员管理等功能。

## 功能特性

- **角色查询** - 支持多服务器角色信息查询和展示
- **装备详情** - 详细展示角色装备属性、魔石、附魔等信息
- **军团管理** - 军团成员列表、角色详情页面
- **攻击力计算** - 角色攻击力分析和计算工具
- **裂缝倒计时** - 游戏裂缝活动倒计时提醒
- **攻击力统计系统** - 角色攻击力统计和分析
- **管理后台** - 管理员数据管理功能

## 技术栈

### 前端
- React 19
- TypeScript
- React Router 7
- Vite 7

### 后端
- Node.js
- Express

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

同时启动前端和后端:

```bash
npm run dev
```

仅启动前端:

```bash
npm run dev:frontend
```

仅启动后端:

```bash
npm run dev:backend
```

### 构建生产版本

```bash
npm run build
```

### 生产环境运行

```bash
npm start
```

## 项目结构

```
chunxia-legion/
├── public/              # 静态资源
│   ├── data/            # 角色数据文件
│   └── images/          # 图片资源
├── server/              # 后端服务
├── src/
│   ├── components/      # React 组件
│   ├── contexts/        # React Context
│   ├── data/            # 静态数据
│   ├── hooks/           # 自定义 Hooks
│   ├── pages/           # 页面组件
│   ├── services/        # API 服务
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── scripts/             # 构建脚本
└── package.json
```

## 主要页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 角色查询 | 角色信息查询和展示 |
| `/legion` | 军团 | 军团成员列表 |
| `/member/:id` | 成员详情 | 军团成员详细信息 |
| `/character/:serverId/:characterId` | 角色详情 | 跨服角色详细信息 |
| `/tools` | 工具 | 实用工具集合 |
| `/join-legion` | 加入军团 | 入团申请页面 |
| `/admin` | 管理后台 | 数据管理(需登录) |

## License

Private
