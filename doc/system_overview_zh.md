# Roblox 资产管理系统文档

## 1. 系统概述

该系统是一个基于 Next.js 的 Web 应用程序，专为管理 Roblox 游戏资产、游戏和广告活动而设计。它提供了一个全面的平台，用于资产管理、游戏跟踪和性能分析。

## 2. 架构

### 2.1 技术栈
- **前端框架**: Next.js 与 TypeScript
- **样式**: Tailwind CSS
- **数据存储**: 基于 JSON 的文件系统（可迁移至数据库）
- **认证**: 自定义认证系统
- **API**: RESTful API 端点
- **附加工具**: Roblox 集成 Python 脚本 (`uploadToRoblox.py`)

### 2.2 目录结构
```
├── data/                  # JSON 数据存储
├── src/
│   ├── app/              # Next.js 应用路由
│   │   ├── api/          # API 路由
│   │   └── dashboard/    # 仪表板页面
│   ├── components/       # React 组件
│   ├── types/           # TypeScript 类型定义
│   └── lib/             # 工具函数
├── public/              # 静态资源
└── scripts/            # 工具脚本
```

## 3. 数据模型

### 3.1 游戏数据库 (`games.json`)
游戏数据库存储所有游戏相关的信息，包括基本信息、性能指标和 Roblox 集成数据。

#### 数据结构
```typescript
interface Game {
  id: string;                // 游戏ID
  name: string;              // 游戏名称
  robloxLink: string;        // Roblox链接
  genre: string;             // 游戏类型
  description: string;       // 游戏描述
  metrics: {                 // 游戏指标
    dau: number;             // 日活跃用户
    mau: number;             // 月活跃用户
    day1Retention: number;   // 首日留存率
    topGeographicPlayers: Array<{  // 地理分布
      country: string;       // 国家
      percentage: number;    // 百分比
    }>;
  };
  dates: {                   // 日期信息
    created: string;         // 创建日期
    lastUpdated: string;     // 最后更新
    mgnJoined: string;       // MGN加入日期
  };
  thumbnail: string;         // 缩略图
  owner: {                   // 所有者信息
    name: string;            // 名称
    discordId: string;       // Discord ID
    email: string;           // 电子邮件
    country: string;         // 国家
  };
  robloxInfo?: {             // Roblox信息
    placeId: number;         // 地点ID
    universeId: number;      // 宇宙ID
    creator: {               // 创建者信息
      name: string;          // 名称
      id: number;            // ID
      type: string;          // 类型
    };
    stats: {                 // 统计数据
      playing: number;       // 正在玩
      visits: number;        // 访问量
      favorites: number;     // 收藏数
      likes: number;         // 点赞数
      dislikes: number;      // 点踩数
    };
    media: {                 // 媒体信息
      images: Array<{        // 图片数组
        id: string;          // 图片ID
        type: string;        // 类型
        approved: boolean;   // 是否批准
        title: string;       // 标题
        localPath: string;   // 本地路径
        thumbnailUrl: string;// 缩略图URL
        width: number;       // 宽度
        height: number;      // 高度
        uploadedAt: string;  // 上传时间
      }>;
      videos: any[];         // 视频数组
    };
  };
}
```

#### 示例数据
```json
{
  "id": "game_001",
  "name": "Adopt Me!",
  "robloxLink": "https://www.roblox.com/games/920587237/Adopt-Me",
  "genre": "Role-Playing",
  "description": "Adopt pets, trade items, and build your dream home in this enchanting role-playing experience!",
  "metrics": {
    "dau": 250000,
    "mau": 4500000,
    "day1Retention": 45.2,
    "topGeographicPlayers": [
      {
        "country": "United States",
        "percentage": 35.5
      },
      {
        "country": "Brazil",
        "percentage": 15.2
      }
    ]
  },
  "dates": {
    "created": "2017-07-14T00:00:00Z",
    "lastUpdated": "2024-03-15T00:00:00Z",
    "mgnJoined": "2023-01-15T00:00:00Z"
  },
  "thumbnail": "/games/adopt-me.png",
  "owner": {
    "name": "DreamCraft Studios",
    "discordId": "dreamcraft#1234",
    "email": "contact@dreamcraftstudios.com",
    "country": "United States"
  }
}
```

### 3.2 资产数据库 (`assets.json`)
资产数据库管理所有游戏资产，包括模型、贴图、音频等资源。

#### 数据结构
```typescript
interface Asset {
  id: string;                // 资产ID
  name: string;              // 资产名称
  type: string;              // 资产类型
  status: string;            // 状态
  robloxId?: string;         // Roblox资产ID
  creator: {                 // 创建者信息
    id: string;              // 创建者ID
    name: string;            // 创建者名称
  };
  metadata: {                // 元数据
    size: number;            // 文件大小
    format: string;          // 文件格式
    dimensions?: {           // 尺寸（图片/模型）
      width: number;
      height: number;
      depth?: number;
    };
    tags: string[];          // 标签
  };
  versions: Array<{          // 版本历史
    version: string;         // 版本号
    createdAt: string;       // 创建时间
    changes: string;         // 变更说明
  }>;
  relationships: {           // 关联关系
    games: string[];         // 关联游戏
    playlists: string[];     // 关联播放列表
  };
}
```

#### 示例数据
```json
{
  "id": "asset_001",
  "name": "Fantasy Sword",
  "type": "Model",
  "status": "approved",
  "robloxId": "rbxassetid://123456789",
  "creator": {
    "id": "creator_001",
    "name": "John Doe"
  },
  "metadata": {
    "size": 1024000,
    "format": "rbxm",
    "dimensions": {
      "width": 100,
      "height": 200,
      "depth": 50
    },
    "tags": ["weapon", "fantasy", "sword"]
  },
  "versions": [
    {
      "version": "1.0",
      "createdAt": "2024-03-01T00:00:00Z",
      "changes": "Initial release"
    }
  ],
  "relationships": {
    "games": ["game_001", "game_002"],
    "playlists": ["playlist_001"]
  }
}
```

### 3.3 游戏广告数据库 (`game-ads.json`)
游戏广告数据库管理广告活动和性能指标。

#### 数据结构
```typescript
interface GameAd {
  id: string;                // 广告ID
  gameId: string;            // 关联游戏ID
  name: string;              // 广告名称
  type: string;              // 广告类型
  status: string;            // 状态
  schedule: {                // 排期
    startDate: string;       // 开始日期
    endDate: string;         // 结束日期
    timezone: string;        // 时区
  };
  targeting: {               // 定向设置
    countries: string[];     // 目标国家
    ageGroups: string[];     // 年龄组
    platforms: string[];     // 平台
  };
  metrics: {                 // 性能指标
    impressions: number;     // 展示次数
    clicks: number;          // 点击次数
    ctr: number;             // 点击率
    conversions: number;     // 转化次数
  };
}
```

#### 示例数据
```json
{
  "id": "ad_001",
  "gameId": "game_001",
  "name": "Summer Sale Campaign",
  "type": "banner",
  "status": "active",
  "schedule": {
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z",
    "timezone": "UTC"
  },
  "targeting": {
    "countries": ["US", "CA", "UK"],
    "ageGroups": ["13-17", "18-24"],
    "platforms": ["web", "mobile"]
  },
  "metrics": {
    "impressions": 1000000,
    "clicks": 50000,
    "ctr": 5.0,
    "conversions": 2500
  }
}
```

### 3.4 播放列表数据库 (`playlists.json`)
播放列表数据库管理资产集合和分类。

#### 数据结构
```typescript
interface Playlist {
  id: string;                // 播放列表ID
  name: string;              // 播放列表名称
  description: string;       // 描述
  type: string;              // 类型
  createdBy: string;         // 创建者
  createdAt: string;         // 创建时间
  updatedAt: string;         // 更新时间
  assets: Array<{            // 资产列表
    assetId: string;         // 资产ID
    order: number;           // 排序
    addedAt: string;         // 添加时间
  }>;
  metadata: {                // 元数据
    tags: string[];          // 标签
    category: string;        // 分类
    visibility: string;      // 可见性
  };
}
```

#### 示例数据
```json
{
  "id": "playlist_001",
  "name": "Fantasy Weapons Collection",
  "description": "A collection of fantasy-themed weapons for RPG games",
  "type": "asset_collection",
  "createdBy": "user_001",
  "createdAt": "2024-03-01T00:00:00Z",
  "updatedAt": "2024-03-15T00:00:00Z",
  "assets": [
    {
      "assetId": "asset_001",
      "order": 1,
      "addedAt": "2024-03-01T00:00:00Z"
    },
    {
      "assetId": "asset_002",
      "order": 2,
      "addedAt": "2024-03-01T00:00:00Z"
    }
  ],
  "metadata": {
    "tags": ["weapons", "fantasy", "rpg"],
    "category": "game_assets",
    "visibility": "public"
  }
}
```

## 4. API 结构

### 4.1 核心端点
- `/api/games` - 游戏管理
- `/api/assets` - 资产管理
- `/api/game-ads` - 广告管理
- `/api/playlists` - 播放列表管理
- `/api/roblox` - Roblox 集成

### 4.2 Roblox 集成
- 资产上传/下载
- 缩略图管理
- 资产删除和更新

## 5. 主要功能

### 5.1 资产管理
- 上传和组织资产
- 资产版本控制
- 缩略图生成
- 资产关系管理

### 5.2 游戏管理
- 游戏跟踪
- 性能指标
- 地理分析
- 所有者信息

### 5.3 广告
- 活动管理
- 性能跟踪
- 地理定向
- 分析仪表板 