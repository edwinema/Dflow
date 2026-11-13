import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Send,
  PlayCircle,
  Sparkles,
  Scale,
  ShieldCheck,
  Settings,
  Users,
} from 'lucide-react';

export interface SubMenuItem {
  path: string;
  title: string;
}

export interface MenuRouteItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: SubMenuItem[];
}

export const MENU_ROUTES: MenuRouteItem[] = [
  {
    id: 'workspace',
    title: '协同工作',
    icon: LayoutDashboard,
    children: [
      { path: '/dashboard/index', title: '综合首页' },
      { path: '/task/todolist', title: '待办任务' },
      { path: '/task/finishlist', title: '已办任务' },
      { path: '/task/learning', title: '流程培训' },
      { path: '/property/verify', title: '我的负责' },
      { path: '/property/partake', title: '我的参与' },
    ],
  },
  {
    id: 'property',
    title: '流程资产',
    icon: Wallet,
    children: [
      { path: '/property/overview', title: '架构全景' },
      { path: '/property/integrate', title: '业务集成' },
      { path: '/property/catalog', title: '目录清单' },
    ],
  },
  {
    id: 'build',
    title: '流程设计',
    icon: Send,
    children: [
      { path: '/build/design', title: '流程设计' },
      { path: '/build/verify', title: '流程审核' },
      { path: '/build/roles', title: '流程角色' },
      { path: '/build/terms', title: '流程术语' },
    ],
  },
  {
    id: 'execute',
    title: '流程运行',
    icon: PlayCircle,
    children: [
      { path: '/execute/process', title: '流程实例运行' },
    ],
  },
  {
    id: 'mining',
    title: '流程挖掘',
    icon: Sparkles,
    children: [
      { path: '/mining/engine', title: '流程挖掘诊断' },
    ],
  },
  {
    id: 'duty',
    title: '权责管控',
    icon: Scale,
    children: [
      { path: '/flowdoc/duty', title: '权责建设' },
      { path: '/flowdoc/manual', title: '权责手册' },
      { path: '/flowdoc/verify', title: '权责审核' },
    ],
  },
  {
    id: 'governance',
    title: '风控合规',
    icon: ShieldCheck,
    children: [
      { path: '/sysdoc/index2', title: '制度文件库' },
      { path: '/sysdoc/indexview', title: '制度查阅' },
      { path: '/risk/index', title: '风险合规库' },
      { path: '/risk/riskview', title: '风险查阅' },
      { path: '/build/repeal', title: '流程废止归档' },
    ],
  },
  {
    id: 'organization',
    title: '组织权限',
    icon: Users,
    children: [
      { path: '/org/dept', title: '部门组织' },
      { path: '/org/user', title: '用户管理' },
      { path: '/org/role', title: '权限管理' },
    ],
  },
  {
    id: 'settings',
    title: '系统设置',
    icon: Settings,
    children: [
      { path: '/system/column', title: '表单引擎' },
      { path: '/system/company', title: '公司授权' },
      { path: '/system/api', title: 'API管理' },
      { path: '/system/models', title: '模型配置' },
    ],
  },
];
