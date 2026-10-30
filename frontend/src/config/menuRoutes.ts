import React from 'react';
import {
  Gauge,
  Wallet,
  Send,
  PlayCircle,
  CalendarCheck,
  FileText,
  ShieldAlert,
  BookOpen,
  FileCheck2,
  Network,
  Settings,
  Activity,
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
    id: 'dashboard',
    title: '系统首页',
    icon: Gauge,
    children: [{ path: '/dashboard/index', title: '工作台首页' }],
  },
  {
    id: 'property',
    title: '流程资产',
    icon: Wallet,
    children: [
      { path: '/property/overview', title: '流程概览' },
      { path: '/property/verify', title: '我的负责' },
      { path: '/property/partake', title: '我的参与' },
    ],
  },
  {
    id: 'build',
    title: '流程建设',
    icon: Send,
    children: [
      { path: '/build/design', title: '流程设计' },
      { path: '/build/verify', title: '流程审核' },
      { path: '/build/terms', title: '流程术语' },
      { path: '/build/repeal', title: '废止申请' },
      { path: '/build/roles', title: '角色库' },
    ],
  },
  {
    id: 'execute',
    title: '流程执行',
    icon: PlayCircle,
    children: [{ path: '/execute/process', title: '流程运行' }],
  },
  {
    id: 'task',
    title: '任务中心',
    icon: CalendarCheck,
    children: [
      { path: '/task/todolist', title: '待办任务' },
      { path: '/task/finishlist', title: '已办任务' },
    ],
  },
  {
    id: 'sysdoc',
    title: '制度文件',
    icon: FileText,
    children: [
      { path: '/sysdoc/index2', title: '制度文件库' },
      { path: '/sysdoc/indexview', title: '制度查阅' },
    ],
  },
  {
    id: 'risk',
    title: '风险合规',
    icon: ShieldAlert,
    children: [
      { path: '/risk/index', title: '风险合规库' },
      { path: '/risk/riskview', title: '风险查阅' },
    ],
  },
  {
    id: 'mining',
    title: '流程挖掘',
    icon: Activity,
    children: [
      { path: '/mining/engine', title: '挖掘诊断' },
    ],
  },
  {
    id: 'flowdoc',
    title: '权责管控',
    icon: FileCheck2,
    children: [
      { path: '/flowdoc/duty', title: '权责建设' },
      { path: '/flowdoc/verify', title: '权责审核' },
      { path: '/flowdoc/dutyList', title: '权责手册' },
      { path: '/flowdoc/file', title: '归档手册' },
      { path: '/flowdoc/history', title: '变更记录' },
    ],
  },
  {
    id: 'org',
    title: '组织架构',
    icon: Network,
    children: [
      { path: '/org/dept', title: '部门组织' },
      { path: '/org/user', title: '用户管理' },
      { path: '/org/role', title: '权限管理' },
    ],
  },
  {
    id: 'system',
    title: '系统设置',
    icon: Settings,
    children: [
      { path: '/system/company', title: '公司授权' },
      { path: '/system/column', title: '表单引擎' },
      { path: '/system/api', title: 'API管理' },
    ],
  },
];
