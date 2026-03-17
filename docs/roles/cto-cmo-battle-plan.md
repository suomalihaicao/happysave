# CTO ↔ CMO 协作战 — 技术分解

## CMO 策略 → CTO 技术分解表

### 体系1: 用户体系
| CMO 需求 | CTO 技术方案 | 页面/组件 | API | 优先级 |
|---------|------------|----------|-----|-------|
| 用户注册登录 | 邮箱+Google OAuth+微信登录 | LoginPage, RegisterPage | /api/v1/auth/login, /api/v1/auth/register | P0 |
| 用户等级系统 | user_profiles表 + 等级计算逻辑 | UserProfileCard, LevelBadge | /api/v1/users/profile | P1 |
| 积分体系 | user_points表 + 积分规则引擎 | PointsHistory, PointsRules | /api/v1/points | P1 |
| 积分商城 | rewards表 + 兑换逻辑 | PointsShop, RewardCard | /api/v1/rewards | P2 |
| 个人中心 | 合并收藏+积分+历史 | UserDashboard | /api/v1/users/dashboard | P1 |

### 体系2: 财务体系
| CMO 需求 | CTO 技术方案 | 页面/组件 | API | 优先级 |
|---------|------------|----------|-----|-------|
| 佣金追踪 | finance_transactions表 | CommissionTable | /api/v1/finance/transactions | P0 |
| 收入仪表盘 | Chart.js 折线图+饼图 | RevenueChart, CommissionPie | /api/v1/finance/dashboard | P0 |
| 分商家对比 | SQL聚合+排序 | StoreRevenueRank | /api/v1/finance/by-store | P1 |
| 提现管理 | finance_withdrawals表 | WithdrawForm, WithdrawHistory | /api/v1/finance/withdraw | P2 |
| 对账系统 | 联盟API对比脚本 | ReconciliationReport | /api/v1/finance/reconcile | P2 |

### 体系3: 运营体系
| CMO 需求 | CTO 技术方案 | 页面/组件 | API | 优先级 |
|---------|------------|----------|-----|-------|
| 实时大盘 | stats聚合+定时刷新 | RealtimeDashboard | /api/v1/stats/realtime | P0 |
| 商家健康度 | 定时扫描优惠码状态 | HealthDashboard | /api/v1/health | P1 |
| 行为漏斗 | click_logs聚合分析 | FunnelChart | /api/v1/analytics/funnel | P1 |
| A/B测试 | ab_tests表+分流逻辑 | ABTestPanel | /api/v1/ab-tests | P2 |
| 自动告警 | alerts表+定时检查 | AlertPanel | /api/v1/alerts | P1 |

### 体系4: 分享裂变
| CMO 需求 | CTO 技术方案 | 页面/组件 | API | 优先级 |
|---------|------------|----------|-----|-------|
| 分享追踪 | short_links扩展+唯一ID | ShareStats | /api/v1/share/track | P0 |
| 邀请机制 | referrals表 | InviteCode, InviteHistory | /api/v1/referrals | P1 |
| 分享排行榜 | SQL排序+定时刷新 | ShareLeaderboard | /api/v1/share/rank | P2 |
| 社群分享模板 | 分享文案模板库 | ShareTemplatePicker | /api/v1/share/templates | P2 |

### 体系5: 营销自动化
| CMO 需求 | CTO 技术方案 | 页面/组件 | API | 优先级 |
|---------|------------|----------|-----|-------|
| 定时发布 | marketing_schedules表 | ScheduleForm, Timeline | /api/v1/marketing/schedule | P1 |
| 邮件营销 | 邮件队列+模板 | EmailCampaign, EmailTemplate | /api/v1/marketing/email | P2 |
| 个性化推荐 | 用户行为分析+推荐算法 | RecommendedStores | /api/v1/recommend | P2 |
| 节日营销 | 节日模板+自动触发 | HolidayCampaign | /api/v1/marketing/holidays | P2 |

---

## 开发路线图

### Phase 1 (本周): 用户+财务基础
- [ ] 用户注册/登录页面
- [ ] 个人中心页面
- [ ] 财务仪表盘页面
- [ ] 佣金追踪API

### Phase 2 (下周): 运营+分享
- [ ] 实时运营大盘
- [ ] 分享追踪系统
- [ ] 邀请机制

### Phase 3 (第三周): 营销自动化
- [ ] 定时发布
- [ ] 邮件营销
- [ ] 推荐算法

### Phase 4 (第四周): 优化+迭代
- [ ] A/B测试框架
- [ ] 自动告警
- [ ] 积分商城
