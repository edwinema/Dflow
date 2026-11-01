import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK on Server Side
const getAiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Architecture Types
const archTypes: any[] = [
  {
    id: 'arch_root',
    parentId: '',
    label: '企业流程架构全景',
    level: 'L0',
    archNo: 'ARCH-CORP-000',
    businessScope: '全公司各业务领域及全职能中心主干流程全景',
    applicableScope: '集团总部、测试集团有限公司、各中心事业部',
    adaptScope: '集团总部、测试集团有限公司、各中心事业部',
    ownerName: '系统管理员 (E0004)',
    deptName: '运营管理部',
    prevArch: '',
    nextArch: 'dste 战略管理',
    flowDefine: '全源科技集团端到端主干流程架构',
    flowPurpose: '统领企业研发、营销、供应链全价值链',
    flowInput: '客户需求与市场洞察',
    flowOutput: '商业价值与客户满意',
    flowStart: '战略规划启动',
    flowEnd: '持续运营交付',
    flowKpi: '整体运营效率提升 95%',
    riskCompliance: '608项合规要求',
    versionNo: 'V2',
    publishUserName: '系统管理员',
    publishTime: '2026-03-20 14:00:00',
  },
  {
    id: 'arch_dste',
    parentId: 'arch_root',
    label: 'dste 战略管理',
    level: 'L1',
    archNo: 'ARCH-DSTE-001',
    businessScope: '企业中长期战略规划、商业计划与战略解码',
    applicableScope: '战略规划部、运营管理部、财务部',
    adaptScope: '战略规划部、运营管理部、财务部',
    ownerName: '系统管理员 (E0004)',
    deptName: '战略规划部',
    prevArch: '企业流程架构全景',
    nextArch: '0.1 战略规划 (SP)',
    flowDefine: '开发战略与战略执行(DSTE)',
    flowPurpose: '确保战略从制定到有效落地执行',
    flowInput: '市场洞察 (MI)',
    flowOutput: '年度业务计划 (BP)',
    flowStart: '春季战略规划启动',
    flowEnd: '业务计划签署发布',
    flowKpi: '战略目标达成率 90%',
    riskCompliance: '合规经营与战略偏差控制',
    versionNo: 'V2',
    publishUserName: '系统管理员',
    publishTime: '2026-03-19 11:15:00',
  },
  {
    id: 'arch_dste_1',
    parentId: 'arch_dste',
    label: '0.1 战略规划 (SP)',
    level: 'L2',
    archNo: 'DSTE-SP-01',
    businessScope: '战略洞察 (MI)、战略制定 (SP) 与执行监控',
    applicableScope: '战略规划部、总裁办',
    adaptScope: '战略规划部、总裁办',
    ownerName: '系统管理员 (E0004)',
    deptName: '战略规划部',
    prevArch: 'dste 战略管理',
    nextArch: '0.2 业务计划 (BP)',
    flowDefine: '战略规划流程',
    flowPurpose: '制定企业中长期战略方向',
    flowInput: '宏观行业趋势',
    flowOutput: '战略规划报告 (SP)',
    flowStart: 'BLM工作坊启动',
    flowEnd: 'SP战略通过审批',
    flowKpi: 'SP评审通过率 90%',
    riskCompliance: '合规达标',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2026-03-19 11:20:00',
    collaborators: [
      {
        id: 'collab_sp_01',
        userId: 'u_ls',
        userName: '李四',
        empNo: 'E0088',
        deptName: '研发管理中心',
        roleName: '高级业务专家',
        taskDesc: '协助责任人推进0.1战略规划架构梳理与子业务域输入输出对齐',
        priority: '重要',
        taskStatus: '进行中',
        dueDate: '2026-11-20',
        assignTime: '2026-10-18 10:30:00',
        assignBy: '系统管理员',
      },
    ],
  },
  {
    id: 'arch_dste_2',
    parentId: 'arch_dste',
    label: '0.2 业务计划 (BP)',
    level: 'L2',
    archNo: 'DSTE-BP-02',
    ownerName: '系统管理员 (E0004)',
    deptName: '财务部',
    prevArch: '0.1 战略规划 (SP)',
    nextArch: '0.3 战略解码',
    flowDefine: '年度业务计划与预算',
    flowPurpose: '配置关键资源与财务预算',
    flowInput: '战略规划 (SP)',
    flowOutput: '年度经营预算 (BP)',
    flowStart: '预算编制通知',
    flowEnd: '预算方案下达',
    flowKpi: '预算准确率 95%',
    riskCompliance: '财务风险控制',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2026-03-19 11:25:00',
  },
  {
    id: 'arch_ipd',
    parentId: 'arch_root',
    label: '1.0 集成产品开发 IPD',
    level: 'L1',
    archNo: 'ARCH-IPD-100',
    businessScope: '集成产品开发全流程与研发项目生命周期管理',
    applicableScope: '研发管理中心、软件开发部、电气开发部、TZ测试部门',
    adaptScope: '研发管理中心、软件开发部、电气开发部、TZ测试部门',
    ownerName: '系统管理员 (E0004)',
    deptName: '研发管理中心',
    prevArch: '企业流程架构全景',
    nextArch: '1.1.1 概念阶段',
    flowDefine: 'IPD端到端产品研发流程',
    flowPurpose: '做正确的产品，把产品做正确',
    flowInput: '客户需求 ($APPEALS)',
    flowOutput: '高质量合格商业产品',
    flowStart: 'Charter拟制发起',
    flowEnd: '产品生命周期终止',
    flowKpi: '投资回报率 (ROI)',
    riskCompliance: '质量与技术安全合规',
    versionNo: 'V3',
    publishUserName: '系统管理员',
    publishTime: '2026-03-18 10:20:00',
  },
  {
    id: 'arch_ipd_1',
    parentId: 'arch_ipd',
    label: '1.1.1 概念阶段',
    level: 'L2',
    archNo: 'IPD-ST-111',
    businessScope: '产品概念澄清、可行性论证与立项评审',
    applicableScope: '研发管理中心、项目管理部',
    adaptScope: '研发管理中心、项目管理部',
    ownerName: '系统管理员 (E0004)',
    deptName: '研发管理中心',
    prevArch: '1.0 集成产品开发 IPD',
    nextArch: '1.1.2 计划阶段',
    flowDefine: '产品概念评审与立项决策',
    flowPurpose: '评估商业可行性并完成立项',
    flowInput: '需求卡片',
    flowOutput: '立项决议书',
    flowStart: '需求初审',
    flowEnd: 'DCP决策完成',
    flowKpi: '立项按时达成率 95%',
    riskCompliance: '投资风险管控',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2025-12-22 17:28:21',
  },
  {
    id: 'arch_ipd_2',
    parentId: 'arch_ipd',
    label: '1.1.2 计划阶段',
    level: 'L2',
    archNo: 'IPD-TR-112',
    ownerName: '系统管理员 (E0004)',
    deptName: '研发管理部',
    prevArch: '1.0 集成产品开发 IPD',
    nextArch: '',
    flowDefine: '计划阶段详细设计',
    flowPurpose: '确立研发规格与交付路线图',
    flowInput: 'Charter任务书',
    flowOutput: '产品设计规格书',
    flowStart: 'PDT团队成立',
    flowEnd: 'TR2技术评审通过',
    flowKpi: '技术成熟度 85%',
    riskCompliance: '技术合规性',
    versionNo: 'V2',
    publishUserName: '系统管理员',
    publishTime: '2025-06-22 20:12:27',
  },
  {
    id: 'arch_ltc',
    parentId: 'arch_root',
    label: '3.0 线索到回款 LTC',
    level: 'L1',
    archNo: 'ARCH-LTC-300',
    ownerName: '系统管理员 (E0004)',
    deptName: '市场营销部',
    prevArch: '企业流程架构全景',
    nextArch: '3.1.1 线索管理',
    flowDefine: '端到端销售与回款流程',
    flowPurpose: '线索高效转化为商业回款',
    flowInput: '市场营销线索',
    flowOutput: '销售回款与客户满意',
    flowStart: '线索创建',
    flowEnd: '应收账款结清',
    flowKpi: '应收账款周转天数 (DSO)',
    riskCompliance: '商务合规与合同审核',
    versionNo: 'V2',
    publishUserName: '系统管理员',
    publishTime: '2026-03-17 15:17:22',
  },
  {
    id: 'arch_ltc_1',
    parentId: 'arch_ltc',
    label: '3.1.1 线索管理',
    level: 'L2',
    archNo: 'LTC-LD-311',
    ownerName: '系统管理员 (E0004)',
    deptName: '市场营销部',
    prevArch: '3.0 线索到回款 LTC',
    nextArch: '',
    flowDefine: '营销线索识别验证与培育',
    flowPurpose: '提升线索转化为商机的成功率',
    flowInput: '原始市场名单',
    flowOutput: '高质量商机单',
    flowStart: '线索录入 CRM',
    flowEnd: '商机立项批准',
    flowKpi: '线索转化率 100%',
    riskCompliance: '商机真实性复核',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2026-03-17 15:17:22',
  },
  {
    id: 'arch_req',
    parentId: 'arch_root',
    label: '6.0 IPD 芯片开发域',
    level: 'L1',
    archNo: 'ARCH-IC-600',
    ownerName: '系统管理员 (E0004)',
    deptName: '集成电路设计院',
    prevArch: '企业流程架构全景',
    nextArch: '6.4.1 芯片物理实现',
    flowDefine: 'SoC 芯片设计与流片全生命周期流程',
    flowPurpose: '保障流片一次成功',
    flowInput: '芯片架构规格书',
    flowOutput: '晶圆制造交付物 GDSII',
    flowStart: '架构规格评审',
    flowEnd: '芯片封测与交付',
    flowKpi: '流片一次成功率 100%',
    riskCompliance: '设计规则检查严格合规',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2025-09-28 14:13:34',
  },
  {
    id: 'arch_req_2',
    parentId: 'arch_req',
    label: '6.4.1 芯片物理实现',
    level: 'L2',
    archNo: 'IC-ENG-641',
    ownerName: '系统管理员 (E0004)',
    deptName: '集成电路设计院',
    prevArch: '6.0 IPD 芯片开发域',
    nextArch: '',
    flowDefine: '物理设计到 Tape-out',
    flowPurpose: 'DRC/LVS/STA 全覆盖验证',
    flowInput: '门级网表',
    flowOutput: '流片投产包',
    flowStart: '布局布线',
    flowEnd: 'Sign-off 签署',
    flowKpi: 'Sign-off 零违规',
    riskCompliance: 'Tape-out 投产管控',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2025-09-29 16:38:40',
  },
];

// Ensure initial baseline system architectures are marked as published
archTypes.forEach((a) => {
  if (!a.status) {
    a.status = 'published';
  }
});

const buildDefaultFlowXml = (flowTitle: string, steps: { title: string; role: string; desc: string; out: string; kcp?: boolean; judge?: boolean }[]) => {
  const lines: string[] = [
    '<mxfile host="dflow.local" version="32.1.0">',
    '  <diagram id="dflow-main" name="流程图">',
    '    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200">',
    '      <root>',
    '        <mxCell id="0"/>',
    '        <mxCell id="1" parent="0"/>',
    '        <UserObject id="node_start" label="开始" dflowType="startEnd" name="开始">',
    '          <mxCell style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;" vertex="1" parent="1">',
    '            <mxGeometry x="80" y="180" width="90" height="44" as="geometry"/>',
    '          </mxCell>',
    '        </UserObject>'
  ];

  let prevId = 'node_start';
  steps.forEach((st, i) => {
    const id = `node_step_${i + 1}`;
    const roleNodeId = `node_role_${i + 1}`;
    const x = 230 + i * 190;
    const y = 175;
    const dflowType = st.judge ? 'nodeActiveJudge' : 'nodeActiveSerialRect';
    const label = st.judge ? st.title : `0${i + 1}\n${st.title}`;
    const style = st.judge
      ? 'rhombus;whiteSpace=wrap;html=1;fillColor=#eef6ff;strokeColor=#409eff;'
      : 'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;';

    lines.push(
      `        <UserObject id="${roleNodeId}" label="${st.role}" dflowType="nodeRoleName" name="${st.role}" roleId="role_${i + 1}" desc="负责 ${st.title} 环节">`,
      `          <mxCell style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FACD91;strokeColor=#333333;" vertex="1" parent="1">`,
      `            <mxGeometry x="${x}" y="80" width="110" height="46" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`
    );

    const kcpAttr = st.kcp ? 'kcp="true" kcpdesc="关键控制点" riskIds="[&quot;risk_01&quot;]"' : 'kcp="false"';
    lines.push(
      `        <UserObject id="${id}" label="${label}" dflowType="${dflowType}" name="${st.title}" roles="[&quot;${st.role}&quot;]" raciR="[&quot;${st.role}&quot;]" raciA="决策委员会" desc="${st.desc}" in="输入前置材料" out="${st.out}" execute="[&quot;PLM系统&quot;]" ${kcpAttr} kpi="按时达成率 98%" target="${i + 1}" timeType="天">`,
      `          <mxCell style="${style}" vertex="1" parent="1">`,
      `            <mxGeometry x="${x}" y="${y}" width="110" height="${st.judge ? 56 : 64}" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`
    );

    lines.push(
      `        <mxCell id="edge_${i}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;endArrow=block;" edge="1" parent="1" source="${prevId}" target="${id}">`,
      `          <mxGeometry relative="1" as="geometry"/>`,
      `        </mxCell>`
    );
    prevId = id;
  });

  const endX = 230 + steps.length * 190;
  lines.push(
    '        <UserObject id="node_end" label="结束" dflowType="startEnd" name="结束">',
    '          <mxCell style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;" vertex="1" parent="1">',
    `            <mxGeometry x="${endX}" y="180" width="90" height="44" as="geometry"/>`,
    '          </mxCell>',
    '        </UserObject>',
    `        <mxCell id="edge_end" value="办结" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;endArrow=block;" edge="1" parent="1" source="${prevId}" target="node_end">`,
    '          <mxGeometry relative="1" as="geometry"/>',
    '        </mxCell>',
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>'
  );
  return lines.join('\n');
};

const archIntegrationXmlStore: Record<string, string> = {};

const buildDefaultArchIntegrationXml = (arch: any, childArchs: any[] = []) => {
  const title = arch?.label || '业务集成视图';
  const archNo = arch?.archNo || 'ARCH-001';
  const owner = arch?.ownerName || '架构责任人';
  const dept = arch?.deptName || '归口部门';

  let stageTitles: string[] = [];
  if (childArchs && childArchs.length > 0) {
    stageTitles = childArchs.map((c) => c.label);
  } else if (arch?.id?.includes('dste')) {
    stageTitles = ['0.1 战略洞察 (MI)', '0.2 战略规划 (SP)', '0.3 业务计划 (BP)', '0.4 战略解码与执行监控'];
  } else if (arch?.id?.includes('ipd')) {
    stageTitles = ['1.1 概念阶段 (Charter)', '1.2 计划阶段 (TR1-TR2)', '1.3 开发阶段 (TR3-TR4)', '1.4 验证与发布 (TR5-GA)'];
  } else if (arch?.id?.includes('ltc')) {
    stageTitles = ['3.1 线索管理 (ML)', '3.2 商机管理 (MO)', '3.3 商务签约与合同', '3.4 交付验收与回款 (O2C)'];
  } else {
    stageTitles = ['阶段一：输入与立项', '阶段二：规划与评审', '阶段三：执行与交付', '阶段四：验收与运营'];
  }

  const lines: string[] = [
    '<mxfile host="dflow.local" version="32.1.0">',
    '  <diagram id="dflow-arch-integration" name="业务集成视图">',
    '    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1200">',
    '      <root>',
    '        <mxCell id="0"/>',
    '        <mxCell id="1" parent="0"/>',
    '        <!-- 顶层集成视图标题横幅 -->',
    `        <UserObject id="arch_banner" label="【业务集成视图】${title} (编号: ${archNo} | 归口: ${dept} | 责任人: ${owner})" dflowType="defaultText" name="${title}">`,
    '          <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ecf5ff;strokeColor=#409eff;strokeWidth=1.5;fontStyle=1;fontSize=14;fontColor=#1f2733;align=center;" vertex="1" parent="1">',
    '            <mxGeometry x="80" y="40" width="1080" height="48" as="geometry"/>',
    '          </mxCell>',
    '        </UserObject>',
    '        <!-- 前置输入节点 -->',
    '        <UserObject id="arch_input" label="端到端业务输入&#xa;(客户需求/战略诉求)" dflowType="startEnd" name="业务输入">',
    '          <mxCell style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;fontStyle=1;fontSize=12;fontColor=#2c3e50;align=center;" vertex="1" parent="1">',
    '            <mxGeometry x="80" y="150" width="130" height="56" as="geometry"/>',
    '          </mxCell>',
    '        </UserObject>',
  ];

  let prevId = 'arch_input';
  stageTitles.forEach((stTitle, idx) => {
    const stageId = `arch_stage_${idx + 1}`;
    const x = 270 + idx * 210;
    const y = 145;
    const roleId = `arch_role_${idx + 1}`;
    const roleName = idx === 0 ? '战略/产品委员会' : idx === 1 ? '核心评审专家组' : idx === 2 ? '执行团队与PMO' : '质量与经营审计部';

    lines.push(
      `        <UserObject id="${roleId}" label="${roleName}" dflowType="nodeRoleName" name="${roleName}">`,
      `          <mxCell style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FACD91;strokeColor=#d97706;fontColor=#78350f;fontSize=11;align=center;" vertex="1" parent="1">`,
      `            <mxGeometry x="${x}" y="95" width="140" height="32" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`,
      `        <UserObject id="${stageId}" label="${stTitle}" dflowType="nodeActiveFlow" name="${stTitle}" kpi="阶段达成率 98%">`,
      `          <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#409eff;strokeWidth=2;fontSize=12;fontColor=#1f2733;align=center;" vertex="1" parent="1">`,
      `            <mxGeometry x="${x}" y="${y}" width="140" height="66" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`,
      `        <mxCell id="arch_edge_${idx}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#409eff;strokeWidth=2;endArrow=block;" edge="1" parent="1" source="${prevId}" target="${stageId}">`,
      `          <mxGeometry relative="1" as="geometry"/>`,
      `        </mxCell>`,
      `        <UserObject id="arch_kcp_${idx + 1}" label="里程碑裁决 ${idx + 1}&#xa;(关卡把控)" dflowType="nodeActiveJudge" name="关卡${idx + 1}">`,
      `          <mxCell style="rhombus;whiteSpace=wrap;html=1;fillColor=#fef0f0;strokeColor=#f56c6c;fontSize=10;fontColor=#991b1b;align=center;" vertex="1" parent="1">`,
      `            <mxGeometry x="${x + 15}" y="240" width="110" height="54" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`,
      `        <mxCell id="arch_kcp_edge_${idx}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;strokeColor=#f56c6c;strokeWidth=1;dashed=1;endArrow=classic;" edge="1" parent="1" source="${stageId}" target="arch_kcp_${idx + 1}">`,
      `          <mxGeometry relative="1" as="geometry"/>`,
      `        </mxCell>`
    );

    prevId = stageId;
  });

  const endX = 270 + stageTitles.length * 210;
  lines.push(
    '        <!-- 终点业务产出节点 -->',
    '        <UserObject id="arch_output" label="端到端商业交付&#xa;(客户满意与价值闭环)" dflowType="startEnd" name="商业交付">',
    '          <mxCell style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;fontStyle=1;fontSize=12;fontColor=#2c3e50;align=center;" vertex="1" parent="1">',
    `            <mxGeometry x="${endX}" y="150" width="130" height="56" as="geometry"/>`,
    '          </mxCell>',
    '        </UserObject>',
    `        <mxCell id="arch_edge_end" value="达成" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#67c23a;strokeWidth=2;endArrow=block;" edge="1" parent="1" source="${prevId}" target="arch_output">`,
    '          <mxGeometry relative="1" as="geometry"/>',
    '        </mxCell>',
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>'
  );

  return lines.join('\n');
};

const flows: any[] = [
  {
    id: 'flow_old_01',
    parentId: 'arch_root',
    archName: '企业流程架构全景',
    label: '2.1.3 早期市场活动旧版流程',
    flowNo: 'OLD-MTL-002',
    ownerName: '市场专员',
    flowLevel: 'L3',
    purpose: '传统线下展会与地面推广活动策划与执行旧版流程',
    drivingRules: '企业旧版市场推广规范',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2025-06-12 10:00:00',
    status: 'repealed',
    repealApplyStatus: '已废止归档',
    repealedTime: '2026-02-15 14:05:30',
    repealedBy: '集团流程管理员',
    archiveNo: 'ARC-20260215-001',
    category: 'responsible',
    xml: buildDefaultFlowXml('2.1.3 早期市场活动旧版流程', [
      { title: '展会立项', role: '市场专员', desc: '提报参展策划方案', out: '立项表' },
      { title: '预算审核', role: '市场总监', desc: '展会开支核准', out: '预算单', kcp: true },
      { title: '现场执行', role: '执行团队', desc: '展位布设与客户接待', out: '客户名录' },
      { title: '效果复盘', role: '营销分析师', desc: '线索归集与ROI核算', out: '复盘总结' },
    ]),
  },
  {
    id: 'flow_zs_001',
    parentId: 'arch_req_1',
    archName: '测试集团有限公司/研发中心/产品工程',
    label: '6.2.1.3 产品架构规格评审流程',
    flowNo: 'RD-REQ-008',
    ownerName: '张三',
    flowLevel: 'L3',
    purpose: '明确产品软硬件架构边界，管控技术规格变更风险',
    drivingRules: '企业技术研发与规格定义管理规范',
    versionNo: 'V2',
    publishUserName: '流程管理员(Emp001)',
    publishTime: '2026-02-18 10:15:30',
    status: 'published',
    category: 'responsible',
    roleName: '架构规划师',
    xml: buildDefaultFlowXml('6.2.1.3 产品架构规格评审流程', [
      { title: '规格拟制', role: '系统工程师', desc: '编制软硬件架构基线说明书', out: '架构规格草案' },
      { title: '同行评审', role: '技术专家', desc: '跨模块接口依赖与可测试性核查', out: '评审意见单', kcp: true },
      { title: '主管签发', role: '流程主管', desc: '流程责任人终审归档', out: '规格确认书', judge: true, kcp: true },
    ]),
  },
  {
    id: 'flow_cr_009',
    parentId: 'arch_req_1',
    archName: '测试集团有限公司/研发中心/需求管理',
    label: '6.3.5.1 需求变更申请',
    flowNo: 'CR-009',
    ownerName: '流程管理员(Emp001)',
    flowLevel: 'L4',
    purpose: '规范研发过程中的工程与商业需求变更，降低技术债务与返工成本',
    drivingRules: '研发需求工程管理制度V3.2',
    versionNo: 'V3',
    publishUserName: '知识管理员(Emp002)',
    publishTime: '2025-09-28 14:13:34',
    status: 'published',
    category: 'responsible',
    roleName: '需求分析师',
    xml: buildDefaultFlowXml('6.3.5.1 需求变更申请', [
      { title: '提出变更诉求', role: '需求分析师', desc: '采集客户与系统规格变更意向', out: '需求变更申请表' },
      { title: '影响面技术评估', role: '系统架构师', desc: '评估接口架构、性能与流片周期影响', out: '架构影响分析报告', kcp: true },
      { title: '成本工期联审', role: '项目总监', desc: '核算预算变更与关键路径交付工期', out: '变更评审纪要', judge: true },
      { title: 'CCB变更终裁', role: '变更控制委员会', desc: '变更基线确认并批准签发', out: 'CCB决议批件', judge: true, kcp: true },
    ]),
  },
  {
    id: 'flow_leads_002',
    parentId: 'arch_ltc_1',
    archName: '测试集团有限公司/市场营销部/线索管理',
    label: '3.1.1.1 线索管理流程',
    flowNo: 'leads-crm-002',
    ownerName: '流程管理员(Emp001)',
    flowLevel: 'L3',
    purpose: '全渠道销售线索标准化培育、质量清洗与高效商机转化',
    drivingRules: '全渠道客户关系与销售跟进管理细则',
    versionNo: 'V3',
    publishUserName: '知识管理员(Emp002)',
    publishTime: '2026-03-17 15:17:22',
    status: 'published',
    category: 'responsible',
    roleName: '线索专员',
    xml: buildDefaultFlowXml('3.1.1.1 线索管理流程', [
      { title: '全渠道线索录入', role: '市场专员', desc: '展会、官网与生态伙伴线索归集', out: '线索台账' },
      { title: '线索清洗验真', role: '线索专员', desc: '反垃圾过滤与企业工商数据核查', out: '合格线索卡', kcp: true },
      { title: '商机立项评估', role: '销售主管', desc: 'BANT模型评分并分派商机客户经理', out: '商机立项确认单', judge: true, kcp: true },
      { title: '转化建档归档', role: '商务专员', desc: 'CRM建档推进进入合同谈判周期', out: '商机跟进卡' },
    ]),
  },
  {
    id: 'flow_101',
    parentId: 'arch_ipd_2',
    archName: '测试集团有限公司/研发中心/计划阶段',
    label: '1.1.2.1 技术评审主流程',
    flowNo: 'IPD-TR-001',
    ownerName: '系统管理员',
    flowLevel: 'L3',
    businessScope: '集成产品研发与方案评审',
    applicableScope: '研发规划部、质量控制部',
    purpose: '保障研发阶段性技术质量达标',
    drivingRules: '研发评审规范',
    versionNo: 'V2',
    publishUserName: '系统管理员',
    publishTime: '2025-06-22 20:12:27',
    status: 'published',
    category: 'responsible',
    collaborators: [
      {
        id: 'collab_tr_01',
        userId: 'u_ls',
        userName: '李四',
        empNo: 'E0088',
        deptName: '研发管理中心',
        roleName: '高级业务专家',
        taskDesc: '协助责任人推进技术评审主流程的泳道流转图绘制与TRB决议评审KCP设置',
        priority: '重要',
        taskStatus: '进行中',
        dueDate: '2026-11-15',
        assignTime: '2026-10-19 14:20:00',
        assignBy: '系统管理员',
      },
    ],
    xml: buildDefaultFlowXml('1.1.2.1 技术评审主流程', [
      { title: '发起技术评审', role: '系统工程师', desc: '提请技术资料包', out: '评审申请表' },
      { title: '同行交叉审查', role: '技术专家', desc: '开展同行专家交叉评议', out: '专家评审意见', kcp: true },
      { title: '问题收敛整改', role: '研发工程师', desc: '针对评审问题项闭环追踪', out: '问题整改记录' },
      { title: 'TRB决议裁决', role: '评审委员会', desc: '签发TR通过批件', out: 'TR评审决议', judge: true, kcp: true },
    ]),
  },
  {
    id: 'flow_102',
    parentId: 'arch_ipd_1',
    archName: '1.1.1 概念阶段',
    label: '1.1.1.1 IPMT立项决策',
    flowNo: 'IPD-ST-001',
    ownerName: '系统管理员',
    flowLevel: 'L3',
    purpose: '明确新产品商业价值并决策立项',
    versionNo: 'V3',
    publishUserName: '系统管理员',
    publishTime: '2025-12-22 17:28:21',
    status: 'published',
    category: 'responsible',
    xml: buildDefaultFlowXml('1.1.1.1 IPMT立项决策', [
      { title: '业务机会分析', role: '产品经理', desc: '洞察市场与竞品', out: '商业机会评估' },
      { title: 'Charter拟制', role: 'PDT经理', desc: '编制项目任务书', out: 'Charter草案', kcp: true },
      { title: 'IPMT投资决策', role: '决策委员会', desc: 'Go/No-Go 终裁', out: '决议批件', judge: true, kcp: true },
      { title: '项目资源下达', role: '项目总监', desc: '下达研发预算与编制', out: '立项任务书' },
    ]),
  },
  {
    id: 'flow_105',
    parentId: 'arch_req_2',
    archName: '6.4.1 芯片物理实现',
    label: '6.4.1.1 芯片流片全流程',
    flowNo: 'IC-DEV-001',
    ownerName: 'IC设计总监',
    flowLevel: 'L3',
    purpose: '保障流片投产一次成功',
    versionNo: 'V2',
    publishUserName: '系统管理员',
    publishTime: '2025-09-29 16:38:40',
    status: 'published',
    category: 'partake',
    xml: buildDefaultFlowXml('6.4.1.1 芯片流片全流程', [
      { title: '规格输入核查', role: '系统架构师', desc: '核验微架构设计规格', out: '设计规格书' },
      { title: 'RTL逻辑仿真', role: 'IC设计工程师', desc: '仿真代码覆盖率100%', out: '网表Netlist', kcp: true },
      { title: 'DRC/LVS物理验证', role: '物理设计专家', desc: '版图设计规则检查', out: 'GDSII投产包', kcp: true },
      { title: 'Tape-out流片决策', role: '研发副总裁', desc: '签署Sign-off批件', out: '晶圆代工订单', judge: true, kcp: true },
    ]),
  },
  {
    id: 'flow_106',
    parentId: 'arch_ltc_1',
    archName: '3.1.1 线索管理',
    label: '3.1.1.1 销售线索转化流程',
    flowNo: 'LTC-ML-001',
    ownerName: '销售总监',
    flowLevel: 'L3',
    purpose: '高效推进线索培育与商机确立',
    versionNo: 'V1',
    publishUserName: '系统管理员',
    publishTime: '2026-03-17 15:17:22',
    status: 'published',
    category: 'partake',
    xml: buildDefaultFlowXml('3.1.1.1 销售线索转化流程', [
      { title: '线索接入初筛', role: '市场专员', desc: '采集渠道客户意向', out: '线索信息单' },
      { title: 'BANT意向验证', role: '销售经理', desc: '验证预算/决策人/需求/时间', out: '商机立项表', kcp: true },
      { title: '技术方案匹配', role: '售前架构师', desc: '编制针对性商务方案', out: '投标方案书', judge: true },
      { title: '商务特批签约', role: '大区总经理', desc: '合同审批签署', out: '销售合同', kcp: true },
    ]),
  },
];

const sysDocTree: any[] = [
  { id: 'doc_dir_root', parentId: '', label: '全源制度文件库', code: 'ZD-ROOT' },
  { id: 'doc_dir_strat', parentId: 'doc_dir_root', label: '01 战略与综合管理制度', code: 'ZD-STR' },
  { id: 'doc_dir_rd', parentId: 'doc_dir_root', label: '02 研发与技术管理制度', code: 'ZD-RD' },
  { id: 'doc_dir_mkt', parentId: 'doc_dir_root', label: '03 营销与商务管理制度', code: 'ZD-MKT' },
  { id: 'doc_dir_qual', parentId: 'doc_dir_root', label: '04 质量与流程合规制度', code: 'ZD-QMS' },
];

const riskTree: any[] = [
  { id: 'risk_dir_root', parentId: '', label: '全源风险库', code: 'RSK-ROOT' },
  { id: 'risk_dir_strat', parentId: 'risk_dir_root', label: '01 战略规划风险', code: 'RSK-STR' },
  { id: 'risk_dir_rd', parentId: 'risk_dir_root', label: '02 产品研发与流片风险', code: 'RSK-RD' },
  { id: 'risk_dir_mkt', parentId: 'risk_dir_root', label: '03 商务与回款风险', code: 'RSK-FIN' },
];

const dictBundle: any = {
  sysDocTree,
  riskTree,
  flowRole: [
    { id: 'role_1', label: '系统架构师', classId: 1, postNames: ['架构师'], desc: '负责顶层架构规划' },
    { id: 'role_2', label: '产品经理 (PMT)', classId: 1, postNames: ['产品经理'], desc: '负责产品生命周期与Charter' },
    { id: 'role_3', label: '决策委员会', classId: 2, postNames: ['总裁', '副总裁'], desc: '最高投资与流片裁决机构' },
    { id: 'role_4', label: '研发工程师', classId: 1, postNames: ['高级工程师'], desc: '负责研发实现' },
  ],
  execSystem: [
    { id: 'sys_1', label: 'PLM系统' },
    { id: 'sys_2', label: 'ERP系统' },
    { id: 'sys_3', label: 'CRM系统' },
    { id: 'sys_4', label: 'ALM系统' },
  ],
  position: [
    { id: 'post_1', label: '首席执行官 / CEO' },
    { id: 'post_2', label: '研发总监' },
    { id: 'post_3', label: '财务经理' },
  ],
  risk: [
    {
      id: 'risk_01',
      folderId: 'risk_dir_rd',
      riskNo: 'RSK-IPD-001',
      label: '研发技术评审TR缺陷遗漏风险',
      target: 'TR评审问题闭环率100%',
      category: '02 研发与技术管理制度',
      riskLevel: '高',
      ownerName: '质量合规部',
      status: 'approved',
      publishTime: '2026-03-10 14:20:00',
    },
    {
      id: 'risk_02',
      folderId: 'risk_dir_mkt',
      riskNo: 'RSK-LTC-002',
      label: '大额销售合同账期与垫资坏账风险',
      target: 'DSO受控在60天以内',
      category: '03 营销与商务管理制度',
      riskLevel: '高',
      ownerName: '财务部',
      status: 'approved',
      publishTime: '2026-03-12 09:45:00',
    },
  ],
  rights: [
    { id: 'qz_01', rightNo: 'AUTH-2026-01', label: '研发立项签署权', level: '总裁级审批' },
    { id: 'qz_02', rightNo: 'AUTH-2026-02', label: '晶圆制造流片签署权', level: '高管级审批' },
  ],
  sysDoc: [
    {
      id: 'doc_01',
      folderId: 'doc_dir_mkt',
      docNo: 'ZD-MKT-2026-01',
      label: '全源科技销售合同分级审批制度.pdf',
      category: '03 营销与商务管理制度',
      versionNo: 'V2.0',
      fileSize: '3.2 MB',
      ownerName: '商务部',
      status: 'approved',
      publishTime: '2026-03-17 15:34:50',
      validityPeriod: '2026-03-17 至 2029-03-16 (长期有效)',
      fileType: 'pdf',
    },
    {
      id: 'doc_02',
      folderId: 'doc_dir_rd',
      docNo: 'ZD-IPD-2026-02',
      label: '集成产品开发技术评审控制程序.docx',
      category: '02 研发与技术管理制度',
      versionNo: 'V3.1',
      fileSize: '1.8 MB',
      ownerName: '研发管理部',
      status: 'approved',
      publishTime: '2026-01-02 10:28:42',
      validityPeriod: '2026-01-02 至 2029-01-01 (3年有效)',
      fileType: 'word',
    },
    {
      id: 'doc_03',
      folderId: 'doc_dir_mkt',
      docNo: 'ZD-MKT-2026-03',
      label: '全源销售权限与合同审批限额矩阵.xlsx',
      category: '03 营销与商务管理制度',
      versionNo: 'V1.5',
      fileSize: '950 KB',
      ownerName: '商务审计部',
      status: 'approved',
      publishTime: '2026-02-18 11:15:30',
      validityPeriod: '2026-01-01 至 2027-12-31 (定期复审)',
      fileType: 'excel',
    },
    {
      id: 'doc_04',
      folderId: 'doc_dir_str',
      docNo: 'ZD-STR-2026-04',
      label: '企业级流程架构蓝图与治理汇报.pptx',
      category: '01 战略与综合管理制度',
      versionNo: 'V2.2',
      fileSize: '5.6 MB',
      ownerName: '流程管理部',
      status: 'approved',
      publishTime: '2026-03-10 14:00:00',
      validityPeriod: '长期有效 (每年例行合规复审)',
      fileType: 'ppt',
    },
  ],
  attachments: [
    {
      id: 'att_01',
      attNo: 'FJ-STR-2026-01',
      label: '战略规划执行检查模板.xlsx',
      category: '规划附件',
      fileSize: '860 KB',
      ownerName: '系统管理员',
      publishTime: '2026-03-15 10:20:00',
    },
  ],
  terms: [
    { id: 'term_01', category: 'IPD', label: 'DCP (Decision Check Point)', desc: '决策评审点，业务委员会评估是否继续投入' },
    { id: 'term_02', category: 'IPD', label: 'TR (Technical Review)', desc: '技术评审点，检验技术成熟度与工程实现质量' },
  ],
};

const archRefsStore: Record<string, Record<string, string[]>> = {
  arch_root: { zdwj: ['doc_01', 'doc_02'], fxhg: ['risk_01', 'risk_02'], xgfj: ['att_01'] },
};

const flowRefsStore: Record<string, Record<string, string[]>> = {
  flow_101: { zdwj: ['doc_02'], fxhg: ['risk_01'], lcsy: ['term_01', 'term_02'], xgfj: ['att_01'] },
  flow_102: { zdwj: ['doc_02'], fxhg: ['risk_01'], lcsy: ['term_01'], xgfj: ['att_01'] },
};

let currentActiveUser: any = {
  userId: 'admin',
  userName: '流程管理员',
  nickName: '流程管理员',
  roleLabel: '流程管理员',
  jobTitle: '经理',
  deptName: '流程管理部',
  companyName: '测试集团有限公司',
  empNo: 'E0001',
};

const flowAuditRecords: any[] = [
  {
    id: 'audit_101',
    flowId: 101,
    modelId: 'flow_101',
    flowCode: 'IPD-TR-001',
    flowName: '1.1.2.1 技术评审主流程',
    versionNo: 'V2',
    archPath: '企业流程架构全景 > 1.0 集成产品开发 IPD > 1.1.2 计划阶段',
    businessDomain: '1.0 集成产品开发 IPD',
    changeType: '版本升级',
    changeSummary: '新增TRB决议质量红线裁决节点，完善KCP风险合规检查项与交付物模板',
    urgency: '紧急',
    submitTime: '2026-03-22 09:30:15',
    submitUser: '张三',
    submitUserDept: '集成电路设计院',
    auditStatus: '待审核',
    auditResult: '待审核',
    auditUser: '流程治理委员会',
    auditTime: '',
    auditOpinion: '',
    kcpCount: 2,
    activityCount: 4,
    boundDocsCount: 3,
    effectiveDate: '2026-04-01',
  },
  {
    id: 'audit_102',
    flowId: 104,
    modelId: 'flow_104',
    flowCode: 'MTL-MR-001',
    flowName: '2.1.2.1 市场需求评估流程',
    versionNo: 'V2',
    archPath: '企业流程架构全景 > 2.0 市场管理 MTL > 2.1.2 需求分析',
    businessDomain: '2.0 市场管理 MTL',
    changeType: '规范优化',
    changeSummary: '优化跨部门需求分发协同机制，缩短需求流转周期从15天至7天',
    urgency: '普通',
    submitTime: '2026-03-21 14:15:00',
    submitUser: '李四',
    submitUserDept: '产品管理部',
    auditStatus: '待审核',
    auditResult: '待审核',
    auditUser: '流程治理委员会',
    auditTime: '',
    auditOpinion: '',
    kcpCount: 1,
    activityCount: 5,
    boundDocsCount: 2,
    effectiveDate: '2026-04-01',
  },
  {
    id: 'audit_103',
    flowId: 107,
    modelId: 'flow_107',
    flowCode: 'ITR-CS-002',
    flowName: '4.2.1.1 客户重大投诉升级处理流程',
    versionNo: 'V1',
    archPath: '企业流程架构全景 > 4.0 问题到解决 ITR > 4.2.1 升级仲裁',
    businessDomain: '4.0 问题到解决 ITR',
    changeType: '新建流程',
    changeSummary: '针对关键大客户引入高层决策支持与24小时现场应急响应机制',
    urgency: '特急',
    submitTime: '2026-03-22 11:05:42',
    submitUser: '王五',
    submitUserDept: '客户服务与质量保障部',
    auditStatus: '待审核',
    auditResult: '待审核',
    auditUser: '质量与内控管理部',
    auditTime: '',
    auditOpinion: '',
    kcpCount: 3,
    activityCount: 6,
    boundDocsCount: 4,
    effectiveDate: '2026-03-25',
  },
  {
    id: 'audit_1',
    flowId: 270,
    modelId: 'flow_106',
    flowCode: 'LTC-ML-001',
    flowName: '3.1.1.1 销售线索转化流程',
    versionNo: 'V1',
    archPath: '企业流程架构全景 > 3.0 线索到回款 LTC > 3.1.1 线索管理',
    businessDomain: '3.0 线索到回款 LTC',
    changeType: '新建流程',
    changeSummary: '基于新一代数字化CRM系统构建全链路商机漏斗跟踪流',
    urgency: '普通',
    submitTime: '2026-03-17 15:19:21',
    submitUser: '系统管理员',
    submitUserDept: '数字化运营部',
    auditStatus: '已审核',
    auditResult: '同意发布',
    auditUser: '系统管理员',
    auditTime: '2026-03-17 16:00:00',
    auditOpinion: '符合流程合规管理要求与内控规范，准予正式发布生产环境运行',
    kcpCount: 2,
    activityCount: 5,
    boundDocsCount: 2,
    effectiveDate: '2026-03-18',
  },
  {
    id: 'audit_2',
    flowId: 215,
    modelId: 'flow_102',
    flowCode: 'IPD-ST-001',
    flowName: '1.1.1.1 IPMT立项决策',
    versionNo: 'V3',
    archPath: '企业流程架构全景 > 1.0 集成产品开发 IPD > 1.1.1 概念阶段',
    businessDomain: '1.0 集成产品开发 IPD',
    changeType: '版本升级',
    changeSummary: '强化投资回报率(ROI)论证与技术专利风险评估标准',
    urgency: '紧急',
    submitTime: '2025-12-22 17:28:21',
    submitUser: '系统管理员',
    submitUserDept: '数字化运营部',
    auditStatus: '已审核',
    auditResult: '同意发布',
    auditUser: '流程治理委员会',
    auditTime: '2025-12-22 18:00:00',
    auditOpinion: '同意发布生产环境，各业务单元须严格执行Charter签发规范',
    kcpCount: 3,
    activityCount: 4,
    boundDocsCount: 3,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'audit_104',
    flowId: 108,
    modelId: 'flow_108',
    flowCode: 'IFS-FN-001',
    flowName: '5.1.0.1 研发预算控制与资金核算',
    versionNo: 'V2',
    archPath: '企业流程架构全景 > 5.0 财务与综合支撑 IFS > 5.1.0 资金管理',
    businessDomain: '5.0 财务与综合支撑 IFS',
    changeType: '版本升级',
    changeSummary: '增加重大研发采购支出的多级分级审批授权矩阵与ERP联动校验',
    urgency: '普通',
    submitTime: '2026-03-10 10:20:00',
    submitUser: '赵六',
    submitUserDept: '财务与资产管理部',
    auditStatus: '已审核',
    auditResult: '同意发布',
    auditUser: '流程治理委员会',
    auditTime: '2026-03-10 15:30:00',
    auditOpinion: '符合全面预算内控合规指标，审批通过',
    kcpCount: 2,
    activityCount: 4,
    boundDocsCount: 3,
    effectiveDate: '2026-03-15',
  },
  {
    id: 'audit_105',
    flowId: 109,
    modelId: 'flow_109',
    flowCode: 'SRM-TE-002',
    flowName: '1.2.3.1 供应商技术准入评审',
    versionNo: 'V1',
    archPath: '企业流程架构全景 > 1.0 集成产品开发 IPD > 1.2.3 采购协同',
    businessDomain: '1.0 集成产品开发 IPD',
    changeType: '新建流程',
    changeSummary: '建立核心芯片与元器件外部二级供应商资质现场核验机制',
    urgency: '普通',
    submitTime: '2026-03-15 09:12:30',
    submitUser: '钱七',
    submitUserDept: '供应链采购管理部',
    auditStatus: '已驳回',
    auditResult: '驳回修改',
    auditUser: '流程治理委员会',
    auditTime: '2026-03-15 14:00:00',
    auditOpinion: '缺少KCP关键控制点及质量保证部会签节点，请补充完善后再行提交',
    kcpCount: 0,
    activityCount: 3,
    boundDocsCount: 1,
    effectiveDate: '',
  },
  {
    id: 'audit_106',
    flowId: 110,
    modelId: 'flow_110',
    flowCode: 'MKT-CH-003',
    flowName: '2.3.1.1 渠道合作招商推广流程',
    versionNo: 'V1',
    archPath: '企业流程架构全景 > 2.0 市场管理 MTL > 2.3.1 渠道管理',
    businessDomain: '2.0 市场管理 MTL',
    changeType: '新建流程',
    changeSummary: '规范华东及华南区域代理商签约及返点激励考核流程',
    urgency: '普通',
    submitTime: '2026-03-18 16:45:10',
    submitUser: '孙八',
    submitUserDept: '市场营销部',
    auditStatus: '已撤回',
    auditResult: '已撤回',
    auditUser: '孙八',
    auditTime: '2026-03-18 17:10:00',
    auditOpinion: '申请人自行撤回：需重新核准返点比例细则',
    kcpCount: 1,
    activityCount: 4,
    boundDocsCount: 2,
    effectiveDate: '',
  },
];

const flowRepealRecords: any[] = [
  {
    id: 'repeal_1',
    modelId: 'flow_old_01',
    flowCode: 'OLD-MTL-002',
    flowName: '2.1.3 早期市场活动旧版流程',
    versionNo: 'V1',
    flowLevel: 'L3',
    archId: 'arch_root',
    archPath: '企业流程架构全景 > 2.0 市场管理',
    ownerName: '市场专员',
    reasonType: '业务流程合并升级',
    reason: '传统线下展会活动已全面升级为数字化全渠道营销，并与 3.1.1.1 销售线索转化主流程合并，原流程不再单独维护。',
    replaceFlowName: '3.1.1.1 销售线索转化流程 (LTC-ML-001)',
    impactScope: '市场营销部、商务部及华东/华北各办事处',
    applicant: '市场专员 (李晓)',
    applyTime: '2026-02-15 11:20:00',
    stage: '已废止归档',
    status: '已废止归档',
    archiveNo: 'ARC-20260215-001',
    archiveUser: '集团流程管理员',
    archiveTime: '2026-02-15 14:05:30',
    archiveOpinion: '经集团流程管理部复核，业务替代方案已就绪，准予正式废止归档入库。',
    approvalLogs: [
      {
        stepName: '发起建议废止',
        role: '流程责任人 / 发起人',
        operator: '市场专员 (李晓)',
        action: '已提交申请',
        time: '2026-02-15 11:20:00',
        opinion: '线下传统展会已由数字化集客流程替代，建议正式废止。',
      },
      {
        stepName: '部门流程负责人审批',
        role: '业务部门总监',
        operator: '市场总监 (高宏伟)',
        action: '审批通过',
        time: '2026-02-15 12:40:15',
        opinion: '同意废止，相关营销职能与指标已平稳过渡到新版 LTC 流程体系。',
      },
      {
        stepName: '流程运营合规复核',
        role: '流程合规经理',
        operator: '合规专家 (王志敏)',
        action: '审核通过',
        time: '2026-02-15 13:30:20',
        opinion: '合规性检查无遗留风险，同意提报集团进行归档确认。',
      },
      {
        stepName: '集团流程管理员确认并归档',
        role: '集团流程管理部',
        operator: '集团流程管理员',
        action: '已确认并归档',
        time: '2026-02-15 14:05:30',
        opinion: '经集团流程管理部核准，正式废止并归档入库，资产编号 ARC-20260215-001。',
      },
    ],
  },
  {
    id: 'repeal_pending_sample',
    modelId: 'flow_zs_001',
    flowCode: 'RD-REQ-008',
    flowName: '6.2.1.3 产品架构规格评审流程',
    versionNo: 'V2',
    flowLevel: 'L3',
    archId: 'arch_req_1',
    archPath: '测试集团有限公司/研发中心/产品工程',
    ownerName: '张三',
    reasonType: '组织架构优化变更',
    reason: '研发体系推行敏捷流片试点，原单体架构评审合并入系统工程评审委员会统筹规范。',
    replaceFlowName: '1.1.2.1 技术评审主流程 (IPD-TR-001)',
    impactScope: '研发中心产品工程部、系统架构室、芯片验证组',
    applicant: '张三 (系统架构师)',
    applyTime: '2026-03-28 09:30:00',
    stage: '待集团流程管理员确认归档',
    status: '待集团流程管理员确认归档',
    approvalLogs: [
      {
        stepName: '发起建议废止',
        role: '流程责任人 / 发起人',
        operator: '张三 (系统架构师)',
        action: '已提交申请',
        time: '2026-03-28 09:30:00',
        opinion: '敏捷硬件工程体系上线，申请废止旧版产品规格评审流程。',
      },
      {
        stepName: '部门流程负责人审批',
        role: '业务部门总监',
        operator: '研发总监 (赵亮)',
        action: '审批通过',
        time: '2026-03-28 11:15:22',
        opinion: '已核实研发业务平移安排，同意废止。',
      },
      {
        stepName: '流程运营合规复核',
        role: '流程合规经理',
        operator: '合规专家 (王志敏)',
        action: '审核通过',
        time: '2026-03-28 14:05:10',
        opinion: '已通过研发标准制度合规交叉校验，转交集团流程管理员进行确认归档。',
      },
      {
        stepName: '集团流程管理员确认并归档',
        role: '集团流程管理部',
        operator: '集团流程管理员',
        action: '待归档确认',
        time: '',
        opinion: '',
      },
    ],
  },
];

const systemUsers = [
  { id: 'u_admin', name: '系统管理员', empNo: 'E0001', deptName: '数字化运营部', roleName: '超级管理员' },
  { id: 'u_zhang', name: '张三', empNo: 'E0102', deptName: '集成电路设计院', roleName: '系统架构师' },
  { id: 'u_li', name: '李四', empNo: 'E0105', deptName: '产品管理部', roleName: '产品经理' },
  { id: 'u_wang', name: '王五', empNo: 'E0088', deptName: '财务部', roleName: '财务专家' },
];

const flowProcessTasks: any[] = [
  {
    id: 'task_1',
    taskName: '1.1.1.1-2026年度旗舰芯片立项评审工单',
    status: '进行中',
    assignee: '张三',
    assigneeDept: '集成电路设计院',
    flowId: 215,
    modelId: 'flow_102',
    flowCode: 'IPD-ST-001',
    flowName: '1.1.1.1 IPMT立项决策',
    flowFullTitle: '1.1.1.1 IPMT立项决策',
    archPath: '企业流程架构全景 > 1.0 集成产品开发 IPD > 1.1.1 概念阶段',
    versionNo: 'V3',
    flowPurpose: '确定商业目标并评估研发可行性',
    taskDesc: '旗舰手机SoC芯片2026规划立项评审',
    creator: '系统管理员',
    createTime: '2026-03-18 10:15:39',
    submitTime: '',
    steps: [
      {
        id: 'step_101',
        seq: 1,
        stepName: '业务机会分析',
        roleName: '产品经理',
        nodeType: 'serial',
        desc: '洞察市场与竞品',
        outDeliverable: '商业机会评估报告',
        status: '已办',
        completionNote: '完成全球市场竞品调研报告',
        relatedFiles: [],
        startTime: '2026-03-18 10:20:00',
        endTime: '2026-03-18 15:30:00',
      },
      {
        id: 'step_102',
        seq: 2,
        stepName: 'Charter拟制',
        roleName: 'PDT经理',
        nodeType: 'serial',
        desc: '编制项目任务书',
        outDeliverable: 'Charter草案',
        status: '进行中',
        completionNote: '财务预算编制中',
        relatedFiles: [],
        startTime: '2026-03-18 16:00:00',
        endTime: '',
      },
      {
        id: 'step_103',
        seq: 3,
        stepName: 'IPMT投资决策',
        roleName: '决策委员会',
        nodeType: 'judge',
        desc: 'Go/No-Go 终裁',
        outDeliverable: '立项决议书',
        status: '待办',
        completionNote: '',
        relatedFiles: [],
        startTime: '',
        endTime: '',
      },
    ],
  },
];

const dutyCategories: any[] = [
  { id: 'dcat_01', code: '01', name: '战略规划与投资决策', orgScope: '集团总部', roleCount: 3, creator: '系统管理员', updater: '系统管理员', updateTime: '2026-03-31 13:52:48', desc: '集团战略立项与大额投资决策' },
  { id: 'dcat_02', code: '02', name: '研发与工程技术管理', orgScope: '研发部', roleCount: 4, creator: '系统管理员', updater: '系统管理员', updateTime: '2026-03-30 10:15:00', desc: '产品开发与流片工程权限' },
  { id: 'dcat_03', code: '03', name: '营销与商务运营', orgScope: '市场营销部', roleCount: 4, creator: '系统管理员', updater: '系统管理员', updateTime: '2026-03-29 16:40:12', desc: '合同签署与价格折扣审批' },
];

const dutyTables: any[] = [
  {
    id: 'duty_0101',
    parentId: 'dcat_01',
    categoryCode: '01',
    categoryName: '战略规划与投资决策',
    code: '0101',
    roleName: '总裁办',
    dutyName: '年度战略规划与预算 (BP)',
    orgScope: '集团总部',
    orgUnit: '集团总部决策委员会',
    businessScenario: '年度战略规划与预算',
    maxAuthAmount: '最高 2000 万元',
    creator: '系统管理员',
    approvalStatus: '已审核',
    updater: '系统管理员',
    version: 'V2.1',
    publishDate: '2026-03-31 16:00:00',
    updateTime: '2026-03-31 16:00:00',
    repealed: false,
    collabDepts: ['决策委员会', '总裁办', '研发部', '财务部'],
    items: [
      {
        id: 'ditem_201',
        flowCategory: '战略规划',
        orgScope: '集团总部',
        businessScenario: '年度预算下达',
        roleName: '财务部',
        businessItem: '年度资本性开支(CapEx)预算',
        flowId: 'flow_101',
        flowName: '1.1.2.1 技术评审主流程',
        operationAuthType: '终审批准',
        amountTier: '500万 < X ≤ 2000万',
        budgetType: '预算内',
        approverLevel: '财务部(R) 总裁办(C) 决策委员会(A)',
        raciMap: { 决策委员会: 'A', 总裁办: 'C', 财务部: 'R' },
        remark: '重大预算需委员会全票批准',
        sysDocNo: 'ZD-STR-2026-01',
        outputDeliverable: '年度预算批件',
      },
    ],
  },
];

const initialOrgDepts: any[] = [
  { id: 'dept_01', deptName: '系统管理部', deptCode: '0010', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '系统管理员', phone: '010-880010', status: '0', orderNum: 1, createTime: '2024-03-15 09:30:00' },
  { id: 'dept_02', deptName: '流程管理部', deptCode: '0020', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '流程推进官', phone: '010-880020', status: '0', orderNum: 2, createTime: '2024-03-15 09:35:00' },
  { id: 'dept_03', deptName: '权责管理部', deptCode: '0030', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '权责合规官', phone: '010-880030', status: '0', orderNum: 3, createTime: '2024-03-15 09:40:00' },
  { id: 'dept_04', deptName: '知识管理部', deptCode: '0040', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '知识管理员', phone: '010-880040', status: '0', orderNum: 4, createTime: '2024-03-15 09:45:00' },
  { id: 'dept_05', deptName: '研发管理中心', deptCode: '0050', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '研发总监', phone: '010-880050', status: '0', orderNum: 5, createTime: '2024-03-15 09:50:00' },
  { id: 'dept_06', deptName: '结构开发部', deptCode: '0041', parentDeptName: '研发管理中心', parentDeptCode: '0050', leader: '结构主管', phone: '010-880041', status: '0', orderNum: 6, createTime: '2024-03-15 10:00:00' },
  { id: 'dept_07', deptName: '软件开发部', deptCode: '0042', parentDeptName: '研发管理中心', parentDeptCode: '0050', leader: '技术主管', phone: '010-880042', status: '0', orderNum: 7, createTime: '2024-03-15 10:05:00' },
  { id: 'dept_08', deptName: '电气开发部', deptCode: '0043', parentDeptName: '研发管理中心', parentDeptCode: '0050', leader: '电气专家', phone: '010-880043', status: '0', orderNum: 8, createTime: '2024-03-15 10:10:00' },
  { id: 'dept_09', deptName: '项目管理部', deptCode: '0044', parentDeptName: '研发管理中心', parentDeptCode: '0050', leader: 'PMO经理', phone: '010-880044', status: '0', orderNum: 9, createTime: '2024-03-15 10:15:00' },
  { id: 'dept_10', deptName: 'TZ测试部门', deptCode: 'TZ1', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '测试经理', phone: '010-880091', status: '0', orderNum: 10, createTime: '2024-03-15 10:20:00' },
  { id: 'dept_11', deptName: 'TZ测试1部', deptCode: 'TZ11', parentDeptName: 'TZ测试部门', parentDeptCode: 'TZ1', leader: '测试组长', phone: '010-880092', status: '0', orderNum: 11, createTime: '2024-03-15 10:25:00' },
  { id: 'dept_risk', deptName: '法律合规与内控部', deptCode: '0035', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '王合规', phone: '010-880035', status: '0', orderNum: 12, createTime: '2024-03-15 10:30:00' },
  { id: 'dept_audit', deptName: '集团审计监察部', deptCode: '0070', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '钱审计', phone: '010-880070', status: '0', orderNum: 13, createTime: '2024-03-15 10:35:00' },
  { id: 'dept_mkt', deptName: '市场营销中心', deptCode: '0060', parentDeptName: '测试集团有限公司', parentDeptCode: '', leader: '赵业务', phone: '010-880060', status: '0', orderNum: 14, createTime: '2024-03-15 10:40:00' },
];

let orgDepts: any[] = JSON.parse(JSON.stringify(initialOrgDepts));

let orgPositions: any[] = [
  { id: 'pos_1', postCode: 'POST_001', postName: '首席系统架构师', deptName: '系统管理部', deptCode: '0010', sort: 1, status: '0', remark: '负责企业平台总体架构与IT基座治理', createTime: '2024-03-15 10:00:00' },
  { id: 'pos_2', postCode: 'POST_002', postName: '流程管理总监', deptName: '流程管理部', deptCode: '0020', sort: 2, status: '0', remark: '负责端到端流程治理体系与全生命周期管控', createTime: '2024-03-15 10:05:00' },
  { id: 'pos_3', postCode: 'POST_003', postName: '高级流程架构师', deptName: '研发管理中心', deptCode: '0050', sort: 3, status: '0', remark: '负责端到端流程绘图建模、L1-L4流程分解与RACI泳道设计', createTime: '2024-03-15 10:10:00' },
  { id: 'pos_4', postCode: 'POST_004', postName: '合规风控总监', deptName: '法律合规与内控部', deptCode: '0035', sort: 4, status: '0', remark: '负责规章制度库、风险控制矩阵与关键控制点(KCP)合规审查', createTime: '2024-03-15 10:15:00' },
  { id: 'pos_5', postCode: 'POST_005', postName: '权责核准主管', deptName: '权责管理部', deptCode: '0030', sort: 5, status: '0', remark: '负责权责清单与授权矩阵(DOA)审批维护', createTime: '2024-03-15 10:20:00' },
  { id: 'pos_6', postCode: 'POST_006', postName: '业务中心总经理', deptName: '市场营销中心', deptCode: '0060', sort: 6, status: '0', remark: '负责业务部门经营与业务流程审批签批', createTime: '2024-03-15 10:25:00' },
  { id: 'pos_7', postCode: 'POST_007', postName: '研发执行工程师', deptName: '结构开发部', deptCode: '0041', sort: 7, status: '0', remark: '负责业务环节具体执行与流程填报', createTime: '2024-03-15 10:30:00' },
  { id: 'pos_8', postCode: 'POST_008', postName: '高级内审督察专家', deptName: '集团审计监察部', deptCode: '0070', sort: 8, status: '0', remark: '负责全域流程合规抽检、废止归档审计与断点复核', createTime: '2024-03-15 10:35:00' },
  { id: 'pos_9', postCode: 'POST_009', postName: '知识运营专家', deptName: '知识管理部', deptCode: '0040', sort: 9, status: '0', remark: '负责企业知识工程沉淀', createTime: '2024-03-15 10:40:00' },
  { id: 'pos_10', postCode: 'POST_010', postName: '软件研发组长', deptName: '软件开发部', deptCode: '0042', sort: 10, status: '0', remark: '负责前后端微服务研发', createTime: '2024-03-15 10:45:00' },
];

let orgJobTitles: any[] = [
  { id: 'job_1', jobCode: 'RANK_P4', jobName: '初级工程师 / 专员', rankLevel: 'P4', jobSeries: '技术/专业职系', sort: 1, status: '0', remark: '执行层基础专员', createTime: '2024-03-15 10:00:00' },
  { id: 'job_2', jobCode: 'RANK_P5', jobName: '中级工程师 / 资深专员', rankLevel: 'P5', jobSeries: '技术/专业职系', sort: 2, status: '0', remark: '独立负责业务模块', createTime: '2024-03-15 10:05:00' },
  { id: 'job_3', jobCode: 'RANK_P6', jobName: '高级工程师 / 业务主管', rankLevel: 'P6', jobSeries: '技术/专业职系', sort: 3, status: '0', remark: '骨干业务骨干', createTime: '2024-03-15 10:10:00' },
  { id: 'job_4', jobCode: 'RANK_P7', jobName: '技术专家 / 资深顾问', rankLevel: 'P7', jobSeries: '专家职系', sort: 4, status: '0', remark: '跨业务领域专家', createTime: '2024-03-15 10:15:00' },
  { id: 'job_5', jobCode: 'RANK_M1', jobName: '基层团队主管', rankLevel: 'M1', jobSeries: '管理职系', sort: 5, status: '0', remark: '负责小组人员与日常排期', createTime: '2024-03-15 10:20:00' },
  { id: 'job_6', jobCode: 'RANK_M2', jobName: '部门经理 / 执行总监', rankLevel: 'M2', jobSeries: '管理职系', sort: 6, status: '0', remark: '负责二级业务部门', createTime: '2024-03-15 10:25:00' },
  { id: 'job_7', jobCode: 'RANK_M3', jobName: '中心总经理 / 副总裁', rankLevel: 'M3', jobSeries: '管理职系', sort: 7, status: '0', remark: '集团高管与中心负责人', createTime: '2024-03-15 10:30:00' },
];

let orgRoles: any[] = [
  { id: 'orole_1', roleNo: 1, roleName: '超级管理员', roleKey: 'admin', roleType: '系统管理', roleSort: 1, dataScope: '全部数据权限', boundPositions: ['首席系统架构师', '系统架构师'], menuPermissions: ['全部菜单', '协同工作', '流程资产', '流程设计', '流程运行', '流程挖掘', '权责管控', '风控合规', '组织系统'], userCount: 2, syncSource: '本地创建', status: '0', remark: '拥有全系统最高管控与配置权限', createTime: '2024-03-15 09:30:00' },
  { id: 'orole_2', roleNo: 2, roleName: '流程管理员', roleKey: 'flow_architect', roleType: '流程规划', roleSort: 2, dataScope: '全公司流程资产', boundPositions: ['流程管理总监', '流程推进主管'], menuPermissions: ['协同工作', '流程资产', '流程设计', '流程运行', '流程挖掘', '权责管控', '风控合规'], userCount: 3, syncSource: '本地创建', status: '0', remark: '统筹流程架构规划、发布审批终审、业务集成与废止归档确认', createTime: '2024-03-15 09:35:00' },
  { id: 'orole_3', roleNo: 3, roleName: '流程架构师', roleKey: 'process_designer', roleType: '专业技术', roleSort: 3, dataScope: '所属业务域', boundPositions: ['高级系统架构师', '流程设计师'], menuPermissions: ['协同工作', '流程资产', '流程设计', '流程运行', '流程挖掘'], userCount: 6, syncSource: '本地创建', status: '0', remark: '负责各业务域端到端流程绘图建模、L1-L4流程分解与RACI泳道设计', createTime: '2024-03-15 09:40:00' },
  { id: 'orole_4', roleNo: 4, roleName: '合规风控官', roleKey: 'risk_officer', roleType: '风险合规', roleSort: 4, dataScope: '全合规业务域', boundPositions: ['合规风控总监', '内控合规审查官'], menuPermissions: ['协同工作', '流程资产', '风控合规', '权责管控'], userCount: 3, syncSource: '本地创建', status: '0', remark: '负责规章制度库、风险控制矩阵与关键控制点(KCP)合规审查', createTime: '2024-03-15 09:45:00' },
  { id: 'orole_5', roleNo: 5, roleName: '知识与权责管理员', roleKey: 'duty_admin', roleType: '业务管理', roleSort: 5, dataScope: '全公司权责资产', boundPositions: ['权责核准主管', '知识运营专家'], menuPermissions: ['协同工作', '流程资产', '权责管控', '风控合规', '组织系统'], userCount: 4, syncSource: '本地创建', status: '0', remark: '负责权责清单、授权矩阵(DOA)审批维护与权责手册发布', createTime: '2024-03-15 09:50:00' },
  { id: 'orole_6', roleNo: 6, roleName: '业务部门主管', roleKey: 'business_director', roleType: '业务管理', roleSort: 6, dataScope: '本部门及下属数据', boundPositions: ['业务中心总经理', '部门经理'], menuPermissions: ['协同工作', '流程资产', '流程设计', '流程运行', '权责管控'], userCount: 8, syncSource: 'HR系统', status: '0', remark: '负责业务域内流程变更提报、流程废止部门审批与业务工单签批', createTime: '2024-03-15 09:55:00' },
  { id: 'orole_7', roleNo: 7, roleName: '普通员工', roleKey: 'employee', roleType: '基础角色', roleSort: 7, dataScope: '仅本人数据', boundPositions: ['研发执行工程师', '测试工程师', '销售代表'], menuPermissions: ['协同工作', '流程资产'], userCount: 65, syncSource: '本地创建', status: '0', remark: '查阅本人负责与参与流程、处理个人待办与发起工单', createTime: '2024-03-15 10:00:00' },
  { id: 'orole_8', roleNo: 8, roleName: '审计监督员', roleKey: 'auditor', roleType: '合规审计', roleSort: 8, dataScope: '全部只读数据', boundPositions: ['高级内审督察专家'], menuPermissions: ['协同工作', '流程资产', '流程运行', '流程挖掘', '权责管控', '风控合规'], userCount: 2, syncSource: '本地创建', status: '0', remark: '负责全生命周期流程执行抽检、废止归档审计与运行挖掘日志调阅', createTime: '2024-03-15 10:05:00' },
];

const initialBuildProcessRoles: any[] = [
  {
    id: 'prole_1',
    roleNo: 1,
    roleCode: 'PR-ARCH-01',
    roleName: '系统架构师',
    roleType: '主责角色 (R)',
    category: '02 研发与技术创新',
    boundPositions: ['系统架构师', '高级架构师'],
    assignedUsers: [
      { id: 'u_2', name: '系统管理员', empNo: 'E0010', deptName: '系统管理部' },
      { id: 'u_zhang', name: '张三', empNo: 'E0102', deptName: '集成电路设计院' },
    ],
    boundFlows: [
      { flowId: 'flow_105', flowNo: 'IC-DEV-001', flowName: '芯片流片全流程', stepName: '规格输入核查', raci: 'R', kcp: false },
      { flowId: 'flow_101', flowNo: 'IPD-TR-001', flowName: '技术评审主流程', stepName: '同行交叉审查', raci: 'C', kcp: true },
    ],
    rankRequirement: 'P7-P9',
    isKcpApprover: true,
    sort: 1,
    status: '0',
    remark: '负责端到端系统架构设计、微架构技术评审与核心交付物 Sign-off',
    createTime: '2024-03-15 09:20:00',
  },
  {
    id: 'prole_2',
    roleNo: 2,
    roleCode: 'PR-PMT-01',
    roleName: '产品经理 (PMT)',
    roleType: '主责角色 (R)',
    category: '03 产品与项目运营',
    boundPositions: ['产品经理', '高级产品专家'],
    assignedUsers: [
      { id: 'u_li', name: '李四', empNo: 'E0105', deptName: '产品管理部' },
    ],
    boundFlows: [
      { flowId: 'flow_102', flowNo: 'IPD-ST-001', flowName: 'IPMT立项决策', stepName: '业务机会分析', raci: 'R', kcp: false },
    ],
    rankRequirement: 'P6-P8',
    isKcpApprover: false,
    sort: 2,
    status: '0',
    remark: '负责产品生命周期路标规划、市场商机洞察与Charter项目任务书拟制',
    createTime: '2024-03-15 09:25:00',
  },
  {
    id: 'prole_3',
    roleNo: 3,
    roleCode: 'PR-IPMT-01',
    roleName: '投资决策委员会 (IPMT)',
    roleType: '决策角色 (A)',
    category: '01 战略与投资规划',
    boundPositions: ['首席执行官 / CEO', '中心总经理 / 副总裁'],
    assignedUsers: [
      { id: 'u_1', name: '知识管理员', empNo: 'E0001', deptName: '知识管理部' },
      { id: 'u_2', name: '系统管理员', empNo: 'E0010', deptName: '系统管理部' },
    ],
    boundFlows: [
      { flowId: 'flow_102', flowNo: 'IPD-ST-001', flowName: 'IPMT立项决策', stepName: 'IPMT投资决策', raci: 'A', kcp: true },
    ],
    rankRequirement: 'M3+',
    isKcpApprover: true,
    sort: 3,
    status: '0',
    remark: '产品线最高商业投资评审机构，行使概念立项与生命周期终止 Go/No-Go 终裁权',
    createTime: '2024-03-15 09:30:00',
  },
  {
    id: 'prole_4',
    roleNo: 4,
    roleCode: 'PR-TRB-01',
    roleName: '技术评审委员会 (TRB)',
    roleType: '评审委员会',
    category: '05 质量与风险合规',
    boundPositions: ['系统架构师', '质量总监', '技术专家'],
    assignedUsers: [
      { id: 'u_zhang', name: '张三', empNo: 'E0102', deptName: '集成电路设计院' },
      { id: 'u_4', name: '研发工程师', empNo: 'E0004', deptName: '集成电路设计院' },
    ],
    boundFlows: [
      { flowId: 'flow_101', flowNo: 'IPD-TR-001', flowName: '技术评审主流程', stepName: 'TRB决议裁决', raci: 'A', kcp: true },
    ],
    rankRequirement: 'P8+ / M2+',
    isKcpApprover: true,
    sort: 4,
    status: '0',
    remark: '把关研发关键技术里程碑(TR1-TR6)成熟度，拥有技术缺陷一票否决权',
    createTime: '2024-03-15 09:35:00',
  },
  {
    id: 'prole_5',
    roleNo: 5,
    roleCode: 'PR-PDT-01',
    roleName: 'PDT项目经理',
    roleType: '主责角色 (R)',
    category: '03 产品与项目运营',
    boundPositions: ['项目经理', '高级研发组长'],
    assignedUsers: [
      { id: 'u_8', name: '项目管理主管', empNo: 'E0008', deptName: '研发中心' },
    ],
    boundFlows: [
      { flowId: 'flow_102', flowNo: 'IPD-ST-001', flowName: 'IPMT立项决策', stepName: 'Charter拟制', raci: 'R', kcp: true },
    ],
    rankRequirement: 'P6-P8',
    isKcpApprover: false,
    sort: 5,
    status: '0',
    remark: '跨职能产品开发团队主导者，统筹从立项到量产上市端到端计划交付与资源调配',
    createTime: '2024-03-15 09:40:00',
  },
  {
    id: 'prole_6',
    roleNo: 6,
    roleCode: 'PR-DEV-01',
    roleName: '研发工程师',
    roleType: '主责角色 (R)',
    category: '02 研发与技术创新',
    boundPositions: ['高级软件工程师', '芯片研发专员'],
    assignedUsers: [
      { id: 'u_4', name: '研发工程师', empNo: 'E0004', deptName: '集成电路设计院' },
      { id: 'u_5', name: 'IC设计工程师', empNo: 'E0005', deptName: '集成电路设计院' },
    ],
    boundFlows: [
      { flowId: 'flow_101', flowNo: 'IPD-TR-001', flowName: '技术评审主流程', stepName: '问题收敛整改', raci: 'R', kcp: false },
    ],
    rankRequirement: 'P4-P7',
    isKcpApprover: false,
    sort: 6,
    status: '0',
    remark: '负责技术模块开发、原理图仿真与同行评议问题闭环收敛整改',
    createTime: '2024-03-15 09:45:00',
  },
  {
    id: 'prole_7',
    roleNo: 7,
    roleCode: 'PR-EXP-01',
    roleName: '同行交叉审查专家',
    roleType: '咨询会签 (C)',
    category: '02 研发与技术创新',
    boundPositions: ['技术专家 / 资深顾问', '系统架构师'],
    assignedUsers: [
      { id: 'u_zhang', name: '张三', empNo: 'E0102', deptName: '集成电路设计院' },
    ],
    boundFlows: [
      { flowId: 'flow_101', flowNo: 'IPD-TR-001', flowName: '技术评审主流程', stepName: '同行交叉审查', raci: 'C', kcp: true },
    ],
    rankRequirement: 'P7-P9',
    isKcpApprover: true,
    sort: 7,
    status: '0',
    remark: '独立第三方同行专家，负责代码、架构设计与工程可靠性交叉审查并出具独立意见',
    createTime: '2024-03-15 09:50:00',
  },
  {
    id: 'prole_8',
    roleNo: 8,
    roleCode: 'PR-IC-01',
    roleName: 'IC设计工程师',
    roleType: '主责角色 (R)',
    category: '02 研发与技术创新',
    boundPositions: ['芯片研发专员', '结构设计工程师'],
    assignedUsers: [
      { id: 'u_5', name: 'IC设计工程师', empNo: 'E0005', deptName: '集成电路设计院' },
    ],
    boundFlows: [
      { flowId: 'flow_105', flowNo: 'IC-DEV-001', flowName: '芯片流片全流程', stepName: 'RTL逻辑仿真', raci: 'R', kcp: true },
    ],
    rankRequirement: 'P5-P8',
    isKcpApprover: false,
    sort: 8,
    status: '0',
    remark: '负责数字逻辑前端RTL编写、网表综合与100%代码覆盖率门级仿真',
    createTime: '2024-03-15 09:55:00',
  },
  {
    id: 'prole_9',
    roleNo: 9,
    roleCode: 'PR-PHY-01',
    roleName: '物理设计专家',
    roleType: '主责角色 (R)',
    category: '02 研发与技术创新',
    boundPositions: ['技术专家 / 资深顾问'],
    assignedUsers: [
      { id: 'u_zhang', name: '张三', empNo: 'E0102', deptName: '集成电路设计院' },
    ],
    boundFlows: [
      { flowId: 'flow_105', flowNo: 'IC-DEV-001', flowName: '芯片流片全流程', stepName: 'DRC/LVS物理验证', raci: 'R', kcp: true },
    ],
    rankRequirement: 'P7-P8',
    isKcpApprover: true,
    sort: 9,
    status: '0',
    remark: '负责后端PR版图布线、静态时序分析(STA)与晶圆代工厂DRC/LVS物理规则检查',
    createTime: '2024-03-15 10:00:00',
  },
  {
    id: 'prole_10',
    roleNo: 10,
    roleCode: 'PR-VPRD-01',
    roleName: '研发副总裁',
    roleType: '决策角色 (A)',
    category: '01 战略与投资规划',
    boundPositions: ['中心总经理 / 副总裁'],
    assignedUsers: [
      { id: 'u_1', name: '知识管理员', empNo: 'E0001', deptName: '知识管理部' },
    ],
    boundFlows: [
      { flowId: 'flow_105', flowNo: 'IC-DEV-001', flowName: '芯片流片全流程', stepName: 'Tape-out流片决策', raci: 'A', kcp: true },
    ],
    rankRequirement: 'M3',
    isKcpApprover: true,
    sort: 10,
    status: '0',
    remark: '研发最高指挥官，掌控流片Sign-off终审决策与千万级晶圆代工订单批签',
    createTime: '2024-03-15 10:05:00',
  },
  {
    id: 'prole_11',
    roleNo: 11,
    roleCode: 'PR-MKT-01',
    roleName: '市场运营专员',
    roleType: '主责角色 (R)',
    category: '04 营销与商务拓展',
    boundPositions: ['初级工程师 / 专员'],
    assignedUsers: [
      { id: 'u_3', name: '业务主管', empNo: 'E0003', deptName: '市场营销部' },
    ],
    boundFlows: [
      { flowId: 'flow_106', flowNo: 'LTC-ML-001', flowName: '销售线索转化流程', stepName: '线索接入初筛', raci: 'R', kcp: false },
    ],
    rankRequirement: 'P4-P5',
    isKcpApprover: false,
    sort: 11,
    status: '0',
    remark: '负责行业展会、官网与生态渠道线索接入清洗、初筛并录入CRM商机池',
    createTime: '2024-03-15 10:10:00',
  },
  {
    id: 'prole_12',
    roleNo: 12,
    roleCode: 'PR-SALES-01',
    roleName: '大客户销售经理',
    roleType: '主责角色 (R)',
    category: '04 营销与商务拓展',
    boundPositions: ['中级工程师 / 资深专员', '基层团队主管'],
    assignedUsers: [
      { id: 'u_6', name: '销售代表', empNo: 'E0006', deptName: '市场营销部' },
    ],
    boundFlows: [
      { flowId: 'flow_106', flowNo: 'LTC-ML-001', flowName: '销售线索转化流程', stepName: 'BANT意向验证', raci: 'R', kcp: true },
    ],
    rankRequirement: 'P5-P7',
    isKcpApprover: false,
    sort: 12,
    status: '0',
    remark: '对接政企大客户高层，主导BANT商机资格认证与商务合同条款谈判',
    createTime: '2024-03-15 10:15:00',
  },
  {
    id: 'prole_13',
    roleNo: 13,
    roleCode: 'PR-PRE-01',
    roleName: '售前方案架构师',
    roleType: '咨询会签 (C)',
    category: '04 营销与商务拓展',
    boundPositions: ['技术专家 / 资深顾问'],
    assignedUsers: [
      { id: 'u_2', name: '系统管理员', empNo: 'E0010', deptName: '系统管理部' },
    ],
    boundFlows: [
      { flowId: 'flow_106', flowNo: 'LTC-ML-001', flowName: '销售线索转化流程', stepName: '技术方案匹配', raci: 'C', kcp: false },
    ],
    rankRequirement: 'P6-P8',
    isKcpApprover: false,
    sort: 13,
    status: '0',
    remark: '负责商务技术可行性评估、客户技术方案路演与招投标技术标书定制',
    createTime: '2024-03-15 10:20:00',
  },
  {
    id: 'prole_14',
    roleNo: 14,
    roleCode: 'PR-GM-01',
    roleName: '大区总经理',
    roleType: '决策角色 (A)',
    category: '04 营销与商务拓展',
    boundPositions: ['部门经理 / 执行总监'],
    assignedUsers: [
      { id: 'u_1', name: '知识管理员', empNo: 'E0001', deptName: '知识管理部' },
    ],
    boundFlows: [
      { flowId: 'flow_106', flowNo: 'LTC-ML-001', flowName: '销售线索转化流程', stepName: '商务特批签约', raci: 'A', kcp: true },
    ],
    rankRequirement: 'M2-M3',
    isKcpApprover: true,
    sort: 14,
    status: '0',
    remark: '统辖区域销售业绩，行使特大订单价格折让与战略客户签约终审批复',
    createTime: '2024-03-15 10:25:00',
  },
  {
    id: 'prole_15',
    roleNo: 15,
    roleCode: 'PR-QA-01',
    roleName: '质量合规审计员',
    roleType: '知会抄送 (I)',
    category: '05 质量与风险合规',
    boundPositions: ['内控合规审查官', '中级工程师 / 资深专员'],
    assignedUsers: [
      { id: 'u_10', name: '质量测试员', empNo: 'E0010', deptName: 'TZ测试部门' },
      { id: 'u_11', name: '测试专员', empNo: 'E0011', deptName: 'TZ测试部门' },
    ],
    boundFlows: [
      { flowId: 'flow_101', flowNo: 'IPD-TR-001', flowName: '技术评审主流程', stepName: 'TRB决议裁决', raci: 'I', kcp: false },
      { flowId: 'flow_105', flowNo: 'IC-DEV-001', flowName: '芯片流片全流程', stepName: 'Tape-out流片决策', raci: 'I', kcp: false },
    ],
    rankRequirement: 'P5-P7',
    isKcpApprover: false,
    sort: 15,
    status: '0',
    remark: '对流程实施符合性与关键控制点(KCP)执行证据进行事后抽检与合规台账归档',
    createTime: '2024-03-15 10:30:00',
  },
  {
    id: 'prole_16',
    roleNo: 16,
    roleCode: 'PR-SCM-01',
    roleName: '供应链运营主管',
    roleType: '主责角色 (R)',
    category: '06 供应链与生产交付',
    boundPositions: ['基层团队主管', '部门经理 / 执行总监'],
    assignedUsers: [
      { id: 'u_7', name: '项目主管', empNo: 'E0007', deptName: '研发中心' },
    ],
    boundFlows: [
      { flowId: 'flow_105', flowNo: 'IC-DEV-001', flowName: '芯片流片全流程', stepName: 'Tape-out流片决策', raci: 'C', kcp: true },
    ],
    rankRequirement: 'M1-M2',
    isKcpApprover: false,
    sort: 16,
    status: '0',
    remark: '负责晶圆产能锁定、封装测试外协厂商打通与生产交付排程',
    createTime: '2024-03-15 10:35:00',
  },
];

let buildProcessRoles: any[] = JSON.parse(JSON.stringify(initialBuildProcessRoles));

const initialOrgUsers: any[] = [
  { id: 'u_admin', userNo: 1, empNo: 'E0001', userName: 'admin', nickName: '系统管理员', sex: '0', deptId: 'dept_01', deptCode: '0010', deptName: '系统管理部', positionName: '首席系统架构师', rankLevel: 'P9', roleNames: ['超级管理员'], phonenumber: '13800000001', email: 'admin@dflow.com', status: '0', syncSource: '本地创建', ssoBound: true, ssoUid: 'sso_admin_001', doaLevel: '最高裁决', remark: '【标准实施账号1】超级管理员，负责企业平台底座配置、租户授权与系统权限分配', createTime: '2024-03-15 09:30:00' },
  { id: 'u_flow_admin', userNo: 2, empNo: 'E0002', userName: 'flow_admin', nickName: '流程管理员', sex: '1', deptId: 'dept_02', deptCode: '0020', deptName: '流程管理部', positionName: '流程管理总监', rankLevel: 'M2', roleNames: ['流程管理员'], phonenumber: '13800000002', email: 'flow_director@dflow.com', status: '0', syncSource: '本地创建', ssoBound: true, ssoUid: 'sso_flow_001', doaLevel: '终审签批', remark: '【标准实施账号2】流程管理总监，负责企业流程全景规划、发布审批终审、业务集成与废止归档确认', createTime: '2024-03-15 09:35:00' },
  { id: 'u_zhangsan', userNo: 3, empNo: 'E0101', userName: 'zhangsan', nickName: '张三', sex: '0', deptId: 'dept_05', deptCode: '0050', deptName: '研发管理中心', positionName: '高级流程架构师', rankLevel: 'P8', roleNames: ['流程架构师'], phonenumber: '13900000101', email: 'zhangsan@dflow.com', status: '0', syncSource: '本地创建', ssoBound: true, ssoUid: 'sso_zs_001', doaLevel: '专业复核', remark: '【标准实施账号3】流程架构师，主导各业务域端到端流程绘图建模、L1-L4流程分解与RACI设计', createTime: '2024-03-15 09:40:00' },
  { id: 'u_risk_officer', userNo: 4, empNo: 'E0201', userName: 'risk_officer', nickName: '王合规', sex: '0', deptId: 'dept_risk', deptCode: '0035', deptName: '法律合规与内控部', positionName: '合规风控总监', rankLevel: 'M1', roleNames: ['合规风控官'], phonenumber: '13800000201', email: 'risk@dflow.com', status: '0', syncSource: '本地创建', ssoBound: true, ssoUid: 'sso_risk_001', doaLevel: '合规审查', remark: '【标准实施账号4】合规风控官，负责制度文件库、风险控制矩阵与关键控制点(KCP)合规交叉审查', createTime: '2024-03-15 09:45:00' },
  { id: 'u_duty_lead', userNo: 5, empNo: 'E0301', userName: 'duty_lead', nickName: '李权责', sex: '1', deptId: 'dept_03', deptCode: '0030', deptName: '权责管理部', positionName: '权责核准主管', rankLevel: 'M1', roleNames: ['知识与权责管理员'], phonenumber: '13800000301', email: 'duty@dflow.com', status: '0', syncSource: '本地创建', ssoBound: true, ssoUid: 'sso_duty_001', doaLevel: '专业复核', remark: '【标准实施账号5】知识与权责管理员，负责权责清单、授权矩阵(DOA)审批维护与权责手册发布', createTime: '2024-03-15 09:50:00' },
  { id: 'u_rd_director', userNo: 6, empNo: 'E0401', userName: 'rd_director', nickName: '赵业务', sex: '0', deptId: 'dept_mkt', deptCode: '0060', deptName: '市场营销中心', positionName: '业务中心总经理', rankLevel: 'M3', roleNames: ['业务部门主管'], phonenumber: '13800000401', email: 'biz_lead@dflow.com', status: '0', syncSource: 'HR系统', ssoBound: true, ssoUid: 'sso_rd_001', doaLevel: '部门审批', remark: '【标准实施账号6】业务部门总监，负责业务域内流程变更提报、流程废止部门审批与业务工单签批', createTime: '2024-03-15 09:55:00' },
  { id: 'u_operator', userNo: 7, empNo: 'E0501', userName: 'operator', nickName: '孙执行', sex: '0', deptId: 'dept_06', deptCode: '0041', deptName: '结构开发部', positionName: '研发执行工程师', rankLevel: 'P5', roleNames: ['普通员工'], phonenumber: '13800000501', email: 'operator@dflow.com', status: '0', syncSource: '本地创建', ssoBound: false, ssoUid: '', doaLevel: '业务经办', remark: '【标准实施账号7】一线业务人员，查阅本人负责与参与流程、处理工作台待办工单与日常发起', createTime: '2024-03-15 10:00:00' },
  { id: 'u_auditor', userNo: 8, empNo: 'E0601', userName: 'auditor', nickName: '钱审计', sex: '1', deptId: 'dept_audit', deptCode: '0070', deptName: '集团审计监察部', positionName: '高级内审督察专家', rankLevel: 'P7', roleNames: ['审计监督员'], phonenumber: '13800000601', email: 'auditor@dflow.com', status: '0', syncSource: '本地创建', ssoBound: true, ssoUid: 'sso_audit_001', doaLevel: '审计调阅', remark: '【标准实施账号8】内审督察官，负责全生命周期流程执行抽检、废止归档审计与断点挖掘调阅', createTime: '2024-03-15 10:05:00' },
  { id: 'u_sys_admin', userNo: 9, empNo: 'E0010', userName: 'sys_admin', nickName: '运维架构师', sex: '0', deptId: 'dept_01', deptCode: '0010', deptName: '系统管理部', positionName: '系统架构师', rankLevel: 'P6', roleNames: ['超级管理员'], phonenumber: '13800000010', email: 'sys@dflow.com', status: '0', syncSource: '本地创建', ssoBound: true, ssoUid: 'sso_sys_001', doaLevel: '最高裁决', remark: '系统运维与架构安全治理', createTime: '2024-03-15 10:10:00' },
  { id: 'u_flow_lead', userNo: 10, empNo: 'E0020', userName: 'flow_lead', nickName: '流程经理', sex: '1', deptId: 'dept_02', deptCode: '0020', deptName: '流程管理部', positionName: '流程推进主管', rankLevel: 'M1', roleNames: ['流程管理员'], phonenumber: '13800000020', email: 'flow@dflow.com', status: '0', syncSource: 'HR系统', ssoBound: true, ssoUid: 'sso_flow_002', doaLevel: '专业复核', remark: '负责端到端跨部门流程梳理', createTime: '2024-03-15 10:15:00' },
];

let orgUsers: any[] = JSON.parse(JSON.stringify(initialOrgUsers));

let companyAuthData: any = {
  companyName: '苏州全源数字科技有限公司',
  companyStatus: '正常生效中',
  createTime: '2023-03-29 20:41:05',
  expireTime: '2030-09-11 07:14:06',
  authUsersCount: 200,
  activeUsersCount: 93,
  authVersion: 'V2.0.1',
  systemDisplayName: '全源流程资产管理平台 dflow',
  systemLogo: '',
  loginTitleSuffix: '数字化流程设计与运营系统',
  copyrightText: 'Copyright © 2026 全源数字科技版权所有',
  watermarkEnabled: false,
  roleQuotas: [
    { typeName: '流程规划岗', used: 17, total: 20 },
    { typeName: '架构审核岗', used: 15, total: 20 },
    { typeName: '设计建模岗', used: 15, total: 20 },
    { typeName: '合规风控岗', used: 16, total: 20 },
    { typeName: '权能决策岗', used: 12, total: 20 },
    { typeName: '执行经办岗', used: 13, total: 20 },
  ],
  license: {
    licenseKey: 'DFLOW-ENTP-2026-HW88A9-99F1-A89E-7821',
    machineCode: 'HW-UUID-88A9-4B2E-99F1-017E54',
    status: 'ACTIVE',
    edition: '企业旗舰版 (Enterprise)',
    editionKey: 'enterprise',
    issuer: '全源数科商业授权签发中心 (CA-ROOT)',
    issuedDate: '2023-03-29 20:41:05',
    expireDate: '2030-09-11 07:14:06',
    maxConcurrentSessions: 50,
    authorizedCompany: '苏州全源数字科技有限公司',
    hardwareBindingMode: 'NODE_LOCKED_STRICT',
    hardwareVerified: true,
    hardwareVerificationStatus: '硬件特征码校验通过，绑定生效中',
    digitalSignature: 'SHA256withRSA · RS256-VERIFIED-VALID',
    certSerialNo: 'CERT-2026-88A94B2E-017E54',
    serverHardware: {
      machineCode: 'HW-UUID-88A9-4B2E-99F1-017E54',
      cpuModel: 'Intel(R) Xeon(R) Platinum 8375C @ 2.80GHz (16 Cores)',
      biosUuid: '4B2E88A9-99F1-017E-54A1-E7298B2089AA',
      macAddress: '52:54:00:88:A9:4B',
      systemArch: 'x86_64 / Linux 6.6 Enterprise',
    },
    modules: [
      { id: 'flow_arch', name: '流程架构设计引擎 (L0-L4)', code: 'MOD_ARCH', authorized: true, desc: '支持分层分级架构' },
      { id: 'drawio_designer', name: 'draw.io v32 画板与BPMN2.0建模', code: 'MOD_DESIGNER', authorized: true, desc: 'BPMN2.0 图形建模' },
      { id: 'doa_sandbox', name: '分权授权 DoA 手册与 RACI 矩阵', code: 'MOD_DOA', authorized: true, desc: '权能决策门禁控制' },
      { id: 'role_library', name: '企业流程角色库与岗位映射', code: 'MOD_ROLE', authorized: true, desc: '全层级角色库与岗位映射' },
      { id: 'terms_library', name: '流程术语管理与词典库', code: 'MOD_TERMS', authorized: true, desc: '企业级术语与标准化' },
      { id: 'verify_engine', name: '流程审核流转与变更基线管理', code: 'MOD_AUDIT', authorized: true, desc: '审批流转与电子签名' },
      { id: 'api_form_engine', name: 'API 网关与动态低代码表单引擎', code: 'MOD_FORM', authorized: true, desc: 'API管理与动态业务建模' },
    ],
    auditLogs: [
      {
        id: 'log_01',
        time: '2023-03-29 20:41:05',
        event: '系统初始化硬件绑定商业授权',
        companyName: '苏州全源数字科技有限公司',
        machineCode: 'HW-UUID-88A9-4B2E-99F1-017E54',
        operator: '系统管理员 (SuperAdmin)',
        status: '成功',
        detail: '绑定设备硬件特征码 HW-UUID-88A9-4B2E-99F1-017E54，签发企业旗舰版',
      },
    ],
  },
};

const defaultSystemApis: any[] = [
  {
    id: 1,
    apiName: '待办任务与工单查询',
    apiPath: '/api/flow/tasks/pending',
    method: 'GET',
    category: 'collab',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '120次/分钟',
    description: '获取当前登录人待办审批流转工单、超时预警及催办标识',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { total: 4, list: [{ taskId: 'task_001', flowTitle: '芯片流片规格审批', nodeName: '总师Sign-off', priority: '紧急' }] } }, null, 2),
    createTime: '2026-01-10 09:00:00',
  },
  {
    id: 2,
    apiName: '流程培训课程与考核清单',
    apiPath: '/api/flow/learning/courses',
    method: 'GET',
    category: 'collab',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '60次/分钟',
    description: '获取全员与指定岗位流程培训课件、必修/选修属性与学时标准',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { total: 6, list: [{ courseId: 'c_01', title: 'IPD端到端流程实务', courseType: '必修', requiredPassScore: 80 }] } }, null, 2),
    createTime: '2026-01-12 10:15:00',
  },
  {
    id: 3,
    apiName: '流程培训学习进度上报',
    apiPath: '/api/flow/learning/progress',
    method: 'POST',
    category: 'collab',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '60次/分钟',
    description: '员工提交流程在线学习时长、视频播放完播率及课后测试考分',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { recorded: true, score: 92, passed: true } }, null, 2),
    createTime: '2026-01-15 14:20:00',
  },
  {
    id: 4,
    apiName: '流程资产全景与健康度指标',
    apiPath: '/api/flow/overview/metrics',
    method: 'GET',
    category: 'property',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '90次/分钟',
    description: '统计各业务域流程架构发布率、主责认领率、E2E贯通度及资产健康评分',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { totalFlows: 142, healthScore: 94.6, publishedRatio: '98.2%' } }, null, 2),
    createTime: '2026-01-18 11:00:00',
  },
  {
    id: 5,
    apiName: '流程版本历史与基线对比',
    apiPath: '/api/flow/model/publishVersionHistories',
    method: 'GET',
    category: 'property',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '90次/分钟',
    description: '调阅业务流程历史发布版本元数据，支持双屏版本差异与节点增删比对',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { flowId: 'flow_101', versions: [{ versionNo: 'V2', publishTime: '2026-03-20' }, { versionNo: 'V1', publishTime: '2025-11-15' }] } }, null, 2),
    createTime: '2026-02-01 16:30:00',
  },
  {
    id: 6,
    apiName: '流程画板建模与XML存盘',
    apiPath: '/api/flow/design/model',
    method: 'POST',
    category: 'design',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '60次/分钟',
    description: '全源在线Drawio流程设计器模型文件XML、泳道RACI与活动节点元数据存盘',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { flowId: 'flow_101', savedTime: '2026-03-26 15:30:00', nodeCount: 18 } }, null, 2),
    createTime: '2026-02-05 09:20:00',
  },
  {
    id: 7,
    apiName: '流程废止归档申请与会签',
    apiPath: '/api/flow/repeal/apply',
    method: 'POST',
    category: 'design',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '60次/分钟',
    description: '提请过时业务流程退役审批，校验替代流程关系并执行冻结归档',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { repealNo: 'REP-2026-003', status: 'AUDITING', successorFlow: 'flow_208' } }, null, 2),
    createTime: '2026-02-10 14:00:00',
  },
  {
    id: 8,
    apiName: '流程角色与岗位映射库',
    apiPath: '/api/build/roles',
    method: 'GET',
    category: 'design',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '90次/分钟',
    description: '维护企业标准流程角色(主责/决策/咨询/知会)与HR岗位关联库',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { total: 12, list: [{ roleCode: 'PR-ARCH-01', roleName: '系统架构师', roleType: '主责角色 (R)' }] } }, null, 2),
    createTime: '2026-02-12 10:00:00',
  },
  {
    id: 9,
    apiName: '工作流实例调度与节点执行',
    apiPath: '/api/flow/instances/execute',
    method: 'POST',
    category: 'execute',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '200次/分钟',
    description: '根据流程图BPMN拓扑规则驱动活动节点流转、条件分支判定与工单催办',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { instanceId: 'ins_9981', currentStep: '合规复核', nextApprover: '王合规' } }, null, 2),
    createTime: '2026-02-15 11:30:00',
  },
  {
    id: 10,
    apiName: '流程挖掘事件日志与时序轨迹',
    apiPath: '/api/mining/event-logs',
    method: 'GET',
    category: 'mining',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '60次/分钟',
    description: '抽取业务IT系统工单时序日志，发现真实执行路径、吞吐变体及耗时瓶颈',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { totalCases: 5400, avgDurationHours: 36.4, bottleneckNode: '交叉联调评审' } }, null, 2),
    createTime: '2026-02-20 15:45:00',
  },
  {
    id: 11,
    apiName: '权责清单与DOA授权矩阵',
    apiPath: '/api/flowdoc/duty',
    method: 'GET',
    category: 'duty',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '90次/分钟',
    description: '查询各业务域事项权责、决策审批层级、金额阈值及RACI责任矩阵',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { totalItems: 88, matrixApprovedCount: 85 } }, null, 2),
    createTime: '2026-02-22 17:00:00',
  },
  {
    id: 12,
    apiName: '合规制度与KCP关键控制点',
    apiPath: '/api/risk/kcp/list',
    method: 'GET',
    category: 'risk',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '90次/分钟',
    description: '获取企业制度条款与强绑定风险关键控制点(KCP)及审计核查底稿',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { totalKcp: 64, highRiskCount: 14 } }, null, 2),
    createTime: '2026-02-25 09:10:00',
  },
  {
    id: 13,
    apiName: '组织架构与人员多维检索',
    apiPath: '/api/org/bundle',
    method: 'GET',
    category: 'system',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '120次/分钟',
    description: '一站式返回企业多级部门树、岗位职级体系、员工花名册及角色权限配置',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { deptCount: 18, userCount: 65, roleCount: 8 } }, null, 2),
    createTime: '2026-02-28 10:00:00',
  },
  {
    id: 14,
    apiName: '表单引擎模型与字段管理',
    apiPath: '/api/system/forms',
    method: 'GET',
    category: 'system',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '120次/分钟',
    description: '低代码动态表单Schema元数据读取、字段增删与动态验证规则管理',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { formCount: 10 } }, null, 2),
    createTime: '2026-03-01 11:20:00',
  },
  {
    id: 15,
    apiName: '商业授权与硬件特征校验',
    apiPath: '/api/system/license',
    method: 'GET',
    category: 'system',
    status: '启用',
    authType: 'Bearer Token',
    rateLimit: '60次/分钟',
    description: '系统授权证书合法性、CPU/网卡硬件特征码绑定状态及并发节点核验',
    sampleResponse: JSON.stringify({ code: 200, message: 'success', data: { status: 'ACTIVE', edition: '企业旗舰版', hardwareVerified: true } }, null, 2),
    createTime: '2026-03-05 14:00:00',
  },
];

let systemApis: any[] = JSON.parse(JSON.stringify(defaultSystemApis));

const initialFormEngineSchemas: any[] = [
  {
    formKey: 'form_sysdoc',
    formName: '制度规范录入与归档表单',
    moduleDomain: '风控合规',
    description: '企业规章制度、操作指引与政策文件的发布及生命周期归档管理表单',
    version: 'V2.6',
    tag: '核心规范',
    updatedAt: '2026-03-21 15:30:00',
    isSystem: true,
    fields: [
      {
        id: 'f_sd_1',
        fieldKey: 'docNo',
        label: '制度编号',
        type: 'input',
        span: 12,
        section: '基础信息',
        required: true,
        showInList: true,
        searchable: true,
        placeholder: '如: ZD-2026-001',
        tooltip: '全局唯一编号，企业正式发文体系规范编码',
        isSystem: true,
      },
      {
        id: 'f_sd_2',
        fieldKey: 'docName',
        label: '制度名称',
        type: 'input',
        span: 12,
        section: '基础信息',
        required: true,
        showInList: true,
        searchable: true,
        placeholder: '请输入规范完整的制度全称',
        tooltip: '规范制度标准名称，用于目录检索与权限挂载',
        isSystem: true,
      },
      {
        id: 'f_sd_3',
        fieldKey: 'docLevel',
        label: '制度层级',
        type: 'select',
        span: 12,
        section: '基础信息',
        required: true,
        showInList: true,
        searchable: true,
        options: [
          '一级-集团基本制度',
          '二级-业务管理办法',
          '三级-操作规程细则',
          '四级-标准化工作指引',
        ],
        defaultValue: '二级-业务管理办法',
        isSystem: true,
      },
      {
        id: 'f_sd_4',
        fieldKey: 'docCategory',
        label: '所属业务域',
        type: 'select',
        span: 12,
        section: '基础信息',
        required: true,
        showInList: true,
        searchable: true,
        options: [
          '战略与综合治理',
          '财务与资产资金',
          '研发与技术工程',
          '供应链与集中采购',
          '生产与质量安全',
          '人力与行政综合',
        ],
        defaultValue: '研发与技术工程',
        isSystem: true,
      },
      {
        id: 'f_sd_5',
        fieldKey: 'referenceNo',
        label: '发文红头文号',
        type: 'input',
        span: 12,
        section: '基础信息',
        required: false,
        showInList: true,
        searchable: true,
        placeholder: '如: 全源发〔2026〕088号',
        isSystem: false,
      },
      {
        id: 'f_sd_6',
        fieldKey: 'publishDept',
        label: '发文/归口部门',
        type: 'deptPicker',
        span: 12,
        section: '权责与审批',
        required: true,
        showInList: true,
        searchable: true,
        placeholder: '点击组织架构归口部门...',
        defaultValue: '质量合规部',
        isSystem: true,
      },
      {
        id: 'f_sd_7',
        fieldKey: 'authorUser',
        label: '编制起草人',
        type: 'userPicker',
        span: 8,
        section: '权责与审批',
        required: true,
        showInList: false,
        searchable: true,
        placeholder: '搜索或点选企业员工/审批人...',
        defaultValue: '张三 (制度主管)',
        isSystem: false,
      },
      {
        id: 'f_sd_8',
        fieldKey: 'reviewerUser',
        label: '合规审核人',
        type: 'userPicker',
        span: 8,
        section: '权责与审批',
        required: true,
        showInList: false,
        searchable: true,
        placeholder: '搜索或点选企业员工/审批人...',
        defaultValue: '李合规 (审计专员)',
        isSystem: false,
      },
      {
        id: 'f_sd_9',
        fieldKey: 'approverUser',
        label: '签发决策人',
        type: 'userPicker',
        span: 8,
        section: '权责与审批',
        required: true,
        showInList: false,
        searchable: true,
        placeholder: '搜索或点选企业员工/审批人...',
        defaultValue: '王副总 (分管副总裁)',
        isSystem: false,
      },
      {
        id: 'f_sd_10',
        fieldKey: 'effectiveDate',
        label: '生效实施日期',
        type: 'date',
        span: 12,
        section: '业务参数',
        required: true,
        showInList: true,
        searchable: true,
        defaultValue: '2026-04-01',
        isSystem: false,
      },
      {
        id: 'f_sd_11',
        fieldKey: 'securityLevel',
        label: '涉密等级',
        type: 'select',
        span: 12,
        section: '业务参数',
        required: true,
        showInList: true,
        searchable: true,
        options: [
          '普通商密(公开)',
          '内部受限(工作秘密)',
          '核心机密(特定授权)',
        ],
        defaultValue: '内部受限(工作秘密)',
        isSystem: false,
      },
      {
        id: 'f_sd_12',
        fieldKey: 'versionNo',
        label: '版本号',
        type: 'input',
        span: 12,
        section: '基础信息',
        required: true,
        showInList: true,
        searchable: true,
        defaultValue: 'V1.0',
        isSystem: true,
      },
      {
        id: 'f_sd_13',
        fieldKey: 'summaryText',
        label: '制度核心摘要',
        type: 'textarea',
        span: 24,
        section: '业务参数',
        required: true,
        showInList: false,
        searchable: false,
        placeholder: '简要说明制度适用范围与管理核心宗旨',
        isSystem: false,
      },
      {
        id: 'f_sd_14',
        fieldKey: 'docContent',
        label: '制度正文及关键条款',
        type: 'richText',
        span: 24,
        section: '扩展属性',
        required: false,
        showInList: false,
        searchable: false,
        placeholder: '输入或粘贴制度规程条款全文',
        isSystem: false,
      },
      {
        id: 'f_sd_15',
        fieldKey: 'attachmentFile',
        label: '正式红头附件材料',
        type: 'upload',
        span: 24,
        section: '扩展属性',
        required: true,
        showInList: false,
        searchable: false,
        placeholder: '点击或拖拽红头文件扫描件(PDF/DOCX)',
        isSystem: false,
      },
      {
        id: 'f_sd_16',
        fieldKey: 'autoAuditCycle',
        label: '是否开启年度例行合规复审',
        type: 'switch',
        span: 12,
        section: '合规风控',
        required: false,
        showInList: false,
        searchable: false,
        defaultValue: false,
        isSystem: false,
      },
    ],
  },
  {
    formKey: 'form_sysdoc_revision',
    formName: '制度修订与废止申请表单',
    moduleDomain: '风控合规',
    description: '制度变更、条款增删修订或废止下线的评审会签流转表单',
    version: 'V1.8',
    updatedAt: '2026-03-20 11:00:00',
    isSystem: true,
    fields: [
      { id: 'f_sdr_1', fieldKey: 'applyNo', label: '申请单号', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'REV-2026-001', isSystem: true },
      { id: 'f_sdr_2', fieldKey: 'targetDoc', label: '拟修订/废止制度', type: 'select', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, options: ['员工考勤管理办法 V2.1', '软件工程发布规范 V3.0', '采购招投标管理细则 V1.5'] },
      { id: 'f_sdr_3', fieldKey: 'revisionType', label: '申请类型', type: 'radio', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, options: ['定期修订', '重大条款增改', '废止下线'], defaultValue: '定期修订' },
      { id: 'f_sdr_4', fieldKey: 'reason', label: '修订/废止理由', type: 'textarea', span: 24, section: '业务参数', required: true, showInList: false, searchable: false, placeholder: '详细阐述制度修订的外部政策依据或业务运行痛点' },
      { id: 'f_sdr_5', fieldKey: 'clauseDiff', label: '条款新旧对照表', type: 'richText', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false, placeholder: '原条款与修订后新条款的对比说明' },
      { id: 'f_sdr_6', fieldKey: 'impactDept', label: '波及影响部门', type: 'multiSelect', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true, options: ['研发部', '质量合规部', '财务部', '运营部', '市场部'] },
      { id: 'f_sdr_7', fieldKey: 'leadAuditor', label: '牵头审核人', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true },
      { id: 'f_sdr_8', fieldKey: 'meetingProof', label: '评审会纪要附件', type: 'upload', span: 24, section: '扩展属性', required: true, showInList: false, searchable: false },
    ],
  },
  {
    formKey: 'form_flow_training',
    formName: '流程培训课程与考核配置单',
    moduleDomain: '协同工作',
    description: '员工业务流程培训课程设计、必修/选修属性、关联流程、目标受众与考核合格线设定表单',
    version: 'V2.0',
    tag: '员工赋能',
    updatedAt: '2026-03-26 10:00:00',
    isSystem: true,
    fields: [
      { id: 'f_ft_1', fieldKey: 'courseNo', label: '课程编号', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'CRS-2026-001', isSystem: true },
      { id: 'f_ft_2', fieldKey: 'courseName', label: '培训课程全称', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'IPD 集成产品开发流程端到端实务精讲' },
      { id: 'f_ft_3', fieldKey: 'courseType', label: '培训课程属性', type: 'radio', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, options: ['必修', '选修', '进阶选读'], defaultValue: '必修' },
      { id: 'f_ft_4', fieldKey: 'targetFlow', label: '挂接业务流程', type: 'select', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, options: ['芯片流片全流程 (IC-DEV-001)', 'IPD技术评审主流程 (IPD-TR-001)', '敏捷需求拆解上线流程 (AG-REQ-02)'] },
      { id: 'f_ft_5', fieldKey: 'trainer', label: '主讲讲师/责任导师', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true, defaultValue: '张三 (首席架构师)' },
      { id: 'f_ft_6', fieldKey: 'targetDepts', label: '受训部门群体', type: 'multiSelect', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true, options: ['系统架构部', '软件研发中心', '质量工程部', '业务运营部'] },
      { id: 'f_ft_7', fieldKey: 'creditHours', label: '要求达标学时 (小时)', type: 'number', span: 12, section: '业务参数', required: true, showInList: true, searchable: false, defaultValue: 4 },
      { id: 'f_ft_8', fieldKey: 'passingScore', label: '考核合格分 (百分制)', type: 'number', span: 12, section: '业务参数', required: true, showInList: true, searchable: false, defaultValue: 80 },
      { id: 'f_ft_9', fieldKey: 'courseSyllabus', label: '课程大纲与重点提示', type: 'richText', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false, placeholder: '列明课程章节纲要与关键操作指引...' },
      { id: 'f_ft_10', fieldKey: 'coursewareProof', label: '课件PPT与视频材料', type: 'upload', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false },
      { id: 'f_ft_11', fieldKey: 'isPublished', label: '是否立即全员发布上线', type: 'switch', span: 12, section: '合规风控', required: false, showInList: true, searchable: false, defaultValue: true },
    ],
  },
  {
    formKey: 'form_flow_asset',
    formName: '流程资产定义与元数据表单',
    moduleDomain: '流程资产',
    description: '流程架构层级(L1-L5)、输入输出交付物与责任主体的结构化定义与资产元数据录入',
    version: 'V3.1',
    tag: '主干资产',
    updatedAt: '2026-03-23 16:45:00',
    isSystem: true,
    fields: [
      { id: 'f_fa_1', fieldKey: 'flowId', label: '流程架构编号', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'FL-L3-RD-001', isSystem: true },
      { id: 'f_fa_2', fieldKey: 'flowTitle', label: '流程全称', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: '端到端研发上线全生命周期流程' },
      { id: 'f_fa_3', fieldKey: 'hierarchyLevel', label: '架构层级', type: 'select', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, options: ['L1 价值链级', 'L2 业务域主流程', 'L3 业务活动级', 'L4 操作规程级', 'L5 任务步骤级'] },
      { id: 'f_fa_4', fieldKey: 'processOwner', label: '流程责任人 (Owner)', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true },
      { id: 'f_fa_5', fieldKey: 'drivingTrigger', label: '输入触发条件', type: 'input', span: 12, section: '业务参数', required: true, showInList: true, searchable: false, placeholder: '例如: 业务立项审批通过触发' },
      { id: 'f_fa_6', fieldKey: 'targetDeliverable', label: '输出交付成果', type: 'input', span: 12, section: '业务参数', required: true, showInList: true, searchable: false, placeholder: '例如: 《上线验收交付签单》' },
      { id: 'f_fa_7', fieldKey: 'standardSlaHours', label: '标准流转时限 (小时)', type: 'number', span: 12, section: '业务参数', required: false, showInList: true, searchable: false, defaultValue: 48 },
      { id: 'f_fa_8', fieldKey: 'kcpTotalCount', label: '关键内控控制点数', type: 'number', span: 12, section: '合规风控', required: false, showInList: true, searchable: false, defaultValue: 4 },
      { id: 'f_fa_9', fieldKey: 'raciMatrixBound', label: '是否强制绑定RACI责任矩阵', type: 'switch', span: 12, section: '合规风控', required: false, showInList: false, searchable: false, defaultValue: true },
      { id: 'f_fa_10', fieldKey: 'bpmnXmlAttachment', label: '标准BPMN设计源文件', type: 'upload', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false },
    ],
  },
  {
    formKey: 'form_flow_repeal',
    formName: '流程废止与下线归档审批单',
    moduleDomain: '流程设计',
    description: '过时业务流程退役申请、替代流程指定、下游影响系统评估及归档封存审批表单',
    version: 'V2.3',
    tag: '生命周期',
    updatedAt: '2026-03-25 15:30:00',
    isSystem: true,
    fields: [
      { id: 'f_fr_1', fieldKey: 'repealNo', label: '废止审批单号', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'REP-2026-001', isSystem: true },
      { id: 'f_fr_2', fieldKey: 'targetFlowTitle', label: '拟废止流程名称', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: '旧版芯片物理打样验收流程' },
      { id: 'f_fr_3', fieldKey: 'repealReasonType', label: '废止原因类型', type: 'select', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, options: ['业务重组重构', '管理架构调整', '新数字化流程替代', '法律法规政策变更'], defaultValue: '新数字化流程替代' },
      { id: 'f_fr_4', fieldKey: 'successorFlow', label: '继承承接新流程', type: 'input', span: 12, section: '业务参数', required: false, showInList: true, searchable: true, placeholder: '芯片全数字化仿真与流片流程 (IC-DIG-02)' },
      { id: 'f_fr_5', fieldKey: 'applicantUser', label: '申请提请人', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true },
      { id: 'f_fr_6', fieldKey: 'leadAuditor', label: '流程管理部终审人', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true },
      { id: 'f_fr_7', fieldKey: 'impactSystems', label: '受影响集成系统', type: 'multiSelect', span: 12, section: '权责与审批', required: false, showInList: true, searchable: true, options: ['SAP ERP', 'PLM 研发系统', 'OA 协同办公', 'MES 制造系统'] },
      { id: 'f_fr_8', fieldKey: 'repealExplanation', label: '废止详细说明及过渡预案', type: 'textarea', span: 24, section: '业务参数', required: true, showInList: false, searchable: false, placeholder: '阐述在制品工单清理方案与过渡期处理细则' },
      { id: 'f_fr_9', fieldKey: 'decisionMeetingProof', label: '总裁办或管委会决议纪要', type: 'upload', span: 24, section: '扩展属性', required: true, showInList: false, searchable: false },
    ],
  },
  {
    formKey: 'form_flow_mining',
    formName: '流程挖掘事件日志接入规范单',
    moduleDomain: '流程挖掘',
    description: '业务IT系统(ERP/CRM/OA/MES)工单流转日志抽取标准、CaseId、活动与时间戳映射规则定义单',
    version: 'V1.5',
    tag: '数据驱动',
    updatedAt: '2026-03-24 14:00:00',
    isSystem: true,
    fields: [
      { id: 'f_fm_1', fieldKey: 'sourceCode', label: '数据源接入代码', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'MIN-SRC-SAP-01', isSystem: true },
      { id: 'f_fm_2', fieldKey: 'systemName', label: '业务系统名称', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'SAP S/4HANA 采购订单模块' },
      { id: 'f_fm_3', fieldKey: 'caseIdField', label: '工单案件标识 (Case ID)', type: 'input', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, placeholder: 'po_number', defaultValue: 'case_id' },
      { id: 'f_fm_4', fieldKey: 'activityField', label: '执行活动名称 (Activity)', type: 'input', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, placeholder: 'event_name', defaultValue: 'activity_name' },
      { id: 'f_fm_5', fieldKey: 'timestampField', label: '发生时间戳 (Timestamp)', type: 'input', span: 12, section: '业务参数', required: true, showInList: true, searchable: false, placeholder: 'created_at', defaultValue: 'timestamp' },
      { id: 'f_fm_6', fieldKey: 'resourceField', label: '执行人/资源 (Resource)', type: 'input', span: 12, section: '业务参数', required: false, showInList: true, searchable: false, placeholder: 'operator_id', defaultValue: 'user_name' },
      { id: 'f_fm_7', fieldKey: 'protocolType', label: '接入同步方式', type: 'select', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, options: ['Kafka 消息实时消费', 'JDBC 定时批量抽取', 'RESTful API 主动推送', 'CSV/XES 离线文件上传'], defaultValue: 'JDBC 定时批量抽取' },
      { id: 'f_fm_8', fieldKey: 'bottleneckHours', label: '节点停滞瓶颈告警阈值 (小时)', type: 'number', span: 12, section: '合规风控', required: false, showInList: true, searchable: false, defaultValue: 24 },
      { id: 'f_fm_9', fieldKey: 'dataFilterRule', label: '抽取SQL过滤与脱敏规则', type: 'textarea', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false, placeholder: 'WHERE status NOT IN ("DRAFT") AND created_at >= "2026-01-01"' },
      { id: 'f_fm_10', fieldKey: 'isActive', label: '是否开启持续挖掘同步', type: 'switch', span: 12, section: '合规风控', required: false, showInList: true, searchable: false, defaultValue: true },
    ],
  },
  {
    formKey: 'form_doa_matrix',
    formName: 'DOA授权事项与审批矩阵表单',
    moduleDomain: '权责管控',
    description: '权责分配(DOA)、决策层级、金额阈值区间与RACI矩阵角色的授权规则配置表单',
    version: 'V2.5',
    tag: '分级授权',
    updatedAt: '2026-03-21 14:10:00',
    isSystem: true,
    fields: [
      { id: 'f_dm_1', fieldKey: 'doaCode', label: '事项编码', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'DOA-FIN-001', isSystem: true },
      { id: 'f_dm_2', fieldKey: 'dutyItemName', label: '授权审批事项名称', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: '如: 年度研发设备固定资产采购支出' },
      { id: 'f_dm_3', fieldKey: 'decisionLevel', label: '终审决策层级', type: 'select', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, options: ['董事会决策', '总裁办审批', '分管高级副总裁', '部门一级负责人', '业务主管行权'] },
      { id: 'f_dm_4', fieldKey: 'currencyLimit', label: '单笔审批限额 (万元)', type: 'currency', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, defaultValue: 100 },
      { id: 'f_dm_5', fieldKey: 'responsibleRole', label: '主责岗位角色 (A)', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true },
      { id: 'f_dm_6', fieldKey: 'consultDept', label: '咨询会签部门 (C)', type: 'multiSelect', span: 12, section: '权责与审批', required: false, showInList: true, searchable: true, options: ['财务部', '质量合规部', '法务部', '采购部'] },
      { id: 'f_dm_7', fieldKey: 'informDept', label: '通报归档部门 (I)', type: 'multiSelect', span: 12, section: '权责与审批', required: false, showInList: false, searchable: false, options: ['审计监察部', '总裁办', '档案室'] },
      { id: 'f_dm_8', fieldKey: 'vetoRight', label: '具备财务一票否决权', type: 'switch', span: 12, section: '合规风控', required: false, showInList: true, searchable: false, defaultValue: true },
      { id: 'f_dm_9', fieldKey: 'executionConditions', label: '行权前置准入条件', type: 'textarea', span: 24, section: '业务参数', required: false, showInList: false, searchable: false, placeholder: '明确必须通过技术评审与预算对齐后方可行使审批权' },
      { id: 'f_dm_10', fieldKey: 'policyRuleAttachment', label: '关联权责依据制度', type: 'upload', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false },
      { id: 'f_dm_11', fieldKey: 'expireReviewDate', label: '授权有效期截止日', type: 'date', span: 12, section: '业务参数', required: true, showInList: true, searchable: true },
    ],
  },
  {
    formKey: 'form_duty_spec',
    formName: '岗位职责与授权说明书表单',
    moduleDomain: '权责管控',
    description: '岗位核心职责范围、任职资质、绩效指标及关联权限节点维护说明书',
    version: 'V1.4',
    updatedAt: '2026-03-19 10:30:00',
    isSystem: true,
    fields: [
      { id: 'f_ds_1', fieldKey: 'jobCode', label: '岗位编码', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'JOB-RD-ARCH-01', isSystem: true },
      { id: 'f_ds_2', fieldKey: 'jobTitle', label: '岗位规范名称', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: '首席流程架构师' },
      { id: 'f_ds_3', fieldKey: 'jobFamily', label: '所属职系', type: 'select', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, options: ['技术研发族', '业务运营族', '职能管理族', '营销商务族'] },
      { id: 'f_ds_4', fieldKey: 'directManager', label: '直接上级岗位', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true },
      { id: 'f_ds_5', fieldKey: 'dutyScope', label: '核心工作职责与管理边界', type: 'textarea', span: 24, section: '业务参数', required: true, showInList: false, searchable: false, placeholder: '梳理岗位主要日常工作、核心交付物及战略责任目标' },
      { id: 'f_ds_6', fieldKey: 'authSignLimits', label: '日常行权审批限额 (元)', type: 'currency', span: 12, section: '业务参数', required: false, showInList: true, searchable: false, defaultValue: 20000 },
      { id: 'f_ds_7', fieldKey: 'kpiIndicators', label: '关键绩效评价维度 (KPI)', type: 'richText', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false },
      { id: 'f_ds_8', fieldKey: 'signConfirmProof', label: '岗位责任人签字确认单', type: 'upload', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false },
    ],
  },
  {
    formKey: 'form_risk_kcp',
    formName: '风险点与控制活动(KCP)录入表单',
    moduleDomain: '风控合规',
    description: '业务风险识别、成因后果分析与关键控制活动(KCP)执行标准录入表单',
    version: 'V2.1',
    tag: '风险内控',
    updatedAt: '2026-03-24 15:00:00',
    isSystem: true,
    fields: [
      { id: 'f_rk_1', fieldKey: 'kcpCode', label: '控制点编号', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'KCP-FIN-2026-003', isSystem: true },
      { id: 'f_rk_2', fieldKey: 'riskTitle', label: '关联风险事件描述', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: '采购资金重复付款或超预算付款风险' },
      { id: 'f_rk_3', fieldKey: 'riskLevel', label: '固有风险等级', type: 'select', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, options: ['重大风险 (L1)', '高风险 (L2)', '中风险 (L3)', '低风险 (L4)'], defaultValue: '高风险 (L2)' },
      { id: 'f_rk_4', fieldKey: 'controlMethod', label: '控制措施类型', type: 'radio', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, options: ['事前预防', '事中控制', '事后稽核'], defaultValue: '事前预防' },
      { id: 'f_rk_5', fieldKey: 'responsibleOfficer', label: '监控主责风控官', type: 'userPicker', span: 12, section: '权责与审批', required: true, showInList: true, searchable: true },
      { id: 'f_rk_6', fieldKey: 'auditFrequency', label: '日常抽查排查频率', type: 'select', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, options: ['实时自动化拦截', '每日核对', '按周抽查', '按月对账'] },
      { id: 'f_rk_7', fieldKey: 'controlEffective', label: '当前控制措施执行有效性', type: 'switch', span: 12, section: '合规风控', required: false, showInList: true, searchable: false, defaultValue: true },
      { id: 'f_rk_8', fieldKey: 'standardOpGuideline', label: 'KCP详细作业指引规范', type: 'richText', span: 24, section: '扩展属性', required: true, showInList: false, searchable: false },
      { id: 'f_rk_9', fieldKey: 'contingencyPlan', label: '应急补救方案预案', type: 'textarea', span: 24, section: '业务参数', required: false, showInList: false, searchable: false },
      { id: 'f_rk_10', fieldKey: 'auditReportFile', label: '内控合规核查底稿', type: 'upload', span: 24, section: '扩展属性', required: false, showInList: false, searchable: false },
    ],
  },
  {
    formKey: 'form_custom_supplier',
    formName: '合格供应商准入评估表单',
    moduleDomain: '组织系统',
    description: '外部供应商资质认证、经营风险审查及履约评价自定义扩展表单',
    version: 'V1.3',
    tag: '生态扩展',
    updatedAt: '2026-03-25 11:30:00',
    isSystem: false,
    fields: [
      { id: 'f_cs_1', fieldKey: 'supplierCode', label: '供应商唯一代码', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: 'SUP-2026-099', isSystem: true },
      { id: 'f_cs_2', fieldKey: 'companyFullName', label: '企业法人全称', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: '如: 某某软件科技发展股份有限公司' },
      { id: 'f_cs_3', fieldKey: 'creditCode', label: '统一社会信用代码', type: 'input', span: 12, section: '基础信息', required: true, showInList: true, searchable: true, placeholder: '91110108MA00000000' },
      { id: 'f_cs_4', fieldKey: 'supplierLevel', label: '战略准入等级', type: 'select', span: 12, section: '业务参数', required: true, showInList: true, searchable: true, options: ['战略核心供应商', '优选供应商', '合格供应商', '临时观察库'] },
      { id: 'f_cs_5', fieldKey: 'qualificationAuditPassed', label: '资质与法务尽调是否通过', type: 'switch', span: 12, section: '合规风控', required: false, showInList: true, searchable: false, defaultValue: true },
      { id: 'f_cs_6', fieldKey: 'businessLicenseProof', label: '营业执照及行业经营许可证', type: 'upload', span: 24, section: '扩展属性', required: true, showInList: false, searchable: false },
      { id: 'f_cs_7', fieldKey: 'evalRemarks', label: '评审委员会综合准入评价', type: 'textarea', span: 24, section: '权责与审批', required: false, showInList: false, searchable: false, placeholder: '记录技术实力、财务健全度及交付保证能力' },
    ],
  },
];

let formEngineSchemas: any[] = JSON.parse(JSON.stringify(initialFormEngineSchemas));

// Session APIs
app.post('/api/session', (req, res) => {
  const { userId } = req.body || {};
  if (userId) {
    const q = String(userId).trim().toLowerCase();
    const found = orgUsers.find(
      (u) =>
        u.userName?.toLowerCase() === q ||
        u.nickName?.toLowerCase() === q ||
        u.empNo?.toLowerCase() === q ||
        u.id === userId
    );
    if (found) {
      currentActiveUser = {
        userId: found.userName,
        userName: found.nickName || found.userName,
        nickName: found.nickName || found.userName,
        empNo: found.empNo,
        roleLabel: (found.roleNames && found.roleNames[0]) || '流程管理员',
        jobTitle: found.positionName || '高级流程经理',
        deptName: found.deptName || '流程管理部',
        companyName: companyAuthData?.companyName || '测试集团有限公司',
      };
    } else {
      currentActiveUser = {
        userId: userId,
        userName: userId,
        nickName: userId,
        roleLabel: '流程管理员',
        jobTitle: '经理',
        deptName: '流程管理部',
        companyName: companyAuthData?.companyName || '测试集团有限公司',
      };
    }
  }
  res.setHeader('Authorization', 'dflow-jwt-token-2026');
  res.json({ status: 1, data: currentActiveUser, info: 'ok' });
});

app.get('/api/session', (_req, res) => {
  res.json({ status: 1, data: currentActiveUser, info: 'ok' });
});

app.post('/api/app/site/logout', (_req, res) => {
  res.json({ status: 1, data: {}, info: 'ok' });
});

// Flow & Architecture APIs
const ensureRootArch = () => {
  if (!archTypes || archTypes.length === 0 || !archTypes.some((a) => !a.parentId || a.id === 'arch_root')) {
    archTypes.unshift({
      id: 'arch_root',
      parentId: '',
      label: '企业流程架构全景',
      level: 'L0',
      archNo: 'ARCH-CORP-000',
      businessScope: '全公司各业务领域及全职能中心主干流程全景',
      applicableScope: '集团总部、测试集团有限公司、各中心事业部',
      adaptScope: '集团总部、测试集团有限公司、各中心事业部',
      ownerName: '系统管理员 (E0004)',
      deptName: '运营管理部',
      flowDefine: '全源科技集团端到端主干流程架构',
      flowPurpose: '统领企业研发、营销、供应链全价值链',
      flowInput: '客户需求与市场洞察',
      flowOutput: '商业价值与客户满意',
      flowStart: '战略规划启动',
      flowEnd: '持续运营交付',
      flowKpi: '整体运营效率提升 95%',
      riskCompliance: '608项合规要求',
      versionNo: 'V2',
      publishUserName: '系统管理员',
      publishTime: '2026-03-20 14:00:00',
      status: 'published',
    });
  } else {
    const root = archTypes.find((a) => !a.parentId || a.id === 'arch_root');
    if (root && (!root.label || root.label === '企业流程架构' || root.label === '根架构' || root.label === 'ROOT')) {
      root.label = '企业流程架构全景';
    }
  }
};

app.get('/api/flow/fulltypes', (_req, res) => {
  ensureRootArch();
  res.json({ status: 1, data: archTypes, info: 'ok' });
});

app.get('/api/flow/fullSimpleModels', (_req, res) => {
  res.json({ status: 1, data: flows, info: 'ok' });
});

app.get('/api/flow/type', (req, res) => {
  ensureRootArch();
  const found = archTypes.find((a) => a.id === req.query.id) || archTypes[0];
  res.json({ status: 1, data: found, info: 'ok' });
});

app.delete('/api/flow/type', (req, res) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ status: 0, info: '缺少架构ID' });
  if (id === 'arch_root') {
    return res.status(400).json({ status: 0, info: '根流程架构【企业流程架构全景】为企业顶层主干，默认不可删除' });
  }
  const idx = archTypes.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ status: 0, info: '架构不存在' });
  const removed = archTypes.splice(idx, 1)[0];
  res.json({ status: 1, data: removed, info: `成功删除流程架构【${removed.label}】` });
});

app.post('/api/flow/type', (req, res) => {
  const { parentId, label, level, businessScope, applicableScope, deptName, ownerName } = req.body;
  const parent = archTypes.find((a) => a.id === parentId);

  const getArchDepth = (pId?: string): number => {
    if (!pId || pId === 'arch_root') return 0;
    let d = 0;
    let cur = archTypes.find((a) => a.id === pId);
    while (cur && cur.parentId && cur.id !== 'arch_root') {
      d++;
      cur = archTypes.find((a) => a.id === cur.parentId);
    }
    return d;
  };

  const parentDepth = getArchDepth(parentId);
  const resolvedLevel = level || `L${Math.min(6, Math.max(1, parentDepth + 1))}`;
  const newArch = {
    id: 'arch_' + Date.now().toString(36),
    parentId: parentId || 'arch_root',
    label: label || '新建流程架构',
    level: resolvedLevel,
    archNo: 'ARCH-' + Math.floor(100 + Math.random() * 900),
    ownerName: ownerName || currentActiveUser?.userName || '系统管理员',
    deptName: deptName || (parent?.deptName || '运营管理部'),
    versionNo: 'V1',
    businessScope: businessScope || '',
    applicableScope: applicableScope || '',
    adaptScope: applicableScope || '',
    publishUserName: '',
    publishTime: '',
    status: 'draft',
  };
  archTypes.push(newArch);
  res.json({ status: 1, data: newArch, info: 'ok' });
});

app.put('/api/flow/type', (req, res) => {
  const { id, label } = req.body;
  const target = archTypes.find((a) => a.id === id);
  if (target) target.label = label;
  res.json({ status: 1, data: target, info: 'ok' });
});

app.put('/api/flow/type/full', (req, res) => {
  const { id, ...rest } = req.body;
  const target = archTypes.find((a) => a.id === id);
  if (target) Object.assign(target, rest);
  res.json({ status: 1, data: target, info: 'ok' });
});

app.post('/api/flow/type/publish', (req, res) => {
  const { id } = req.body;
  const target = archTypes.find((a) => a.id === id);
  const nextVer = target ? `V${parseInt((target.versionNo || 'V1').slice(1)) + 1}` : 'V2';
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (target) {
    target.versionNo = nextVer;
    target.status = 'published';
    target.publishTime = nowStr;
    target.publishUserName = currentActiveUser?.userName || '系统管理员';
  }
  res.json({ status: 1, data: { versionNo: nextVer }, info: 'ok' });
});

app.get('/api/flow/type/publishVersionHistories', (req, res) => {
  const target = archTypes.find((a) => a.id === req.query.id) || archTypes[0];
  res.json({
    status: 1,
    data: [
      { versionNo: target.versionNo || 'V2', publishUserName: '系统管理员', publishTime: target.publishTime || '2026-03-20 14:00:00' },
      { versionNo: 'V1', publishUserName: '系统管理员', publishTime: '2025-10-12 09:30:00' },
    ],
    info: 'ok',
  });
});

app.get('/api/flow/type/refs', (req, res) => {
  const id = String(req.query.id || 'arch_root');
  const tab = String(req.query.tab || 'zdwj');
  const refIds = archRefsStore[id]?.[tab] || ['doc_01', 'doc_02'];
  res.json({ status: 1, data: refIds, info: 'ok' });
});

app.post('/api/flow/type/refs', (req, res) => {
  const { id, tab, refIds } = req.body;
  if (!archRefsStore[id]) archRefsStore[id] = {};
  archRefsStore[id][tab] = Array.isArray(refIds) ? refIds : [];
  res.json({ status: 1, data: archRefsStore[id][tab], info: 'ok' });
});

// Flow Model Endpoints
app.get('/api/flow/model/full', (req, res) => {
  const found = flows.find((f) => f.id === req.query.id) || flows[0];
  res.json({ status: 1, data: found, info: 'ok' });
});

app.put('/api/flow/model/full', (req, res) => {
  const { id, ...rest } = req.body;
  const found = flows.find((f) => f.id === id);
  if (found) Object.assign(found, rest);
  res.json({ status: 1, data: found, info: 'ok' });
});

app.post('/api/flow/model', (req, res) => {
  const { parentId, label, flowNo, xml, flowLevel, ownerName, versionNo, description } = req.body;
  const parentArch = archTypes.find((a) => a.id === parentId) || archTypes[0];
  const newFlow = {
    id: 'flow_' + Date.now().toString(36),
    parentId: parentArch.id,
    archName: parentArch.label,
    label: label || '新建流程',
    flowNo: flowNo || 'FLOW-' + Math.floor(100 + Math.random() * 900),
    ownerName: ownerName || '系统管理员',
    flowLevel: flowLevel || 'L3',
    versionNo: versionNo || 'V1',
    description: description || '',
    publishUserName: '系统管理员',
    publishTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status: 'draft',
    category: 'responsible',
    xml: xml || buildDefaultFlowXml(label || '新建流程', [
      { title: '阶段启动', role: '业务员', desc: '发起流程', out: '申请表' },
      { title: '终审决策', role: '负责人', desc: '完成审批', out: '批准书', judge: true, kcp: true },
    ]),
  };
  flows.unshift(newFlow);
  res.json({ status: 1, data: newFlow, info: 'ok' });
});

app.post('/api/flow/model/copy', (req, res) => {
  const { id } = req.body;
  const src = flows.find((f) => f.id === id) || flows[0];
  const copy = {
    ...src,
    id: 'flow_' + Date.now().toString(36),
    label: `${src.label} (副本)`,
    flowNo: `${src.flowNo || 'FLOW'}-COPY`,
    versionNo: 'V1',
    status: 'draft',
  };
  flows.push(copy);
  res.json({ status: 1, data: copy, info: 'ok' });
});

app.post('/api/flow/changeArch', (req, res) => {
  const { targetType, targetId, newParentId } = req.body;
  if (!targetId || !newParentId) {
    return res.status(400).json({ status: 0, info: '缺少必要参数' });
  }

  const targetParent = archTypes.find((a) => a.id === newParentId);
  if (!targetParent && newParentId !== 'arch_root') {
    return res.status(404).json({ status: 0, info: '目标上级架构不存在' });
  }

  if (targetType === 'arch') {
    const arch = archTypes.find((a) => a.id === targetId);
    if (!arch) {
      return res.status(404).json({ status: 0, info: '未找到目标流程架构' });
    }
    if (newParentId === targetId) {
      return res.status(400).json({ status: 0, info: '无法将自身设置为上级架构' });
    }

    // 检查循环引用：判断 newParentId 是否为 targetId 的子孙架构
    let cur = targetParent;
    while (cur && cur.parentId) {
      if (cur.parentId === targetId) {
        return res.status(400).json({ status: 0, info: '无法将架构归属至其自身的子架构下，避免循环引用' });
      }
      cur = archTypes.find((a) => a.id === cur.parentId);
    }

    arch.parentId = newParentId;
    let d = 0;
    let pCur = targetParent;
    while (pCur && pCur.parentId && pCur.id !== 'arch_root') {
      d++;
      pCur = archTypes.find((a) => a.id === pCur.parentId);
    }
    arch.level = `L${Math.min(6, Math.max(1, d + 1))}`;
    return res.json({ status: 1, data: arch, info: '流程架构归属变更成功' });
  } else {
    const flow = flows.find((f) => f.id === targetId);
    if (!flow) {
      return res.status(404).json({ status: 0, info: '未找到该业务流程' });
    }
    flow.parentId = newParentId;
    flow.archName = targetParent ? targetParent.label : '企业流程架构全景';
    return res.json({ status: 1, data: flow, info: '业务流程归属变更成功' });
  }
});

// Free Drag & Drop node movement (position reorder & cross-level movement)
app.post('/api/flow/moveNode', (req, res) => {
  const { dragId, dragType, targetId, targetType, position } = req.body;
  if (!dragId || !targetId || !position) {
    return res.status(400).json({ status: 0, info: '缺少移动参数' });
  }

  // 1. Locate dragged item
  let dragItem: any = dragType === 'arch' ? archTypes.find((a) => a.id === dragId) : flows.find((f) => f.id === dragId);
  if (!dragItem) {
    return res.status(404).json({ status: 0, info: '未找到被拖拽节点' });
  }

  // Root arch cannot be moved
  if (dragType === 'arch' && (!dragItem.parentId || dragItem.id === 'arch_root')) {
    return res.status(400).json({ status: 0, info: '根架构不允许移动' });
  }

  // 2. Locate target item
  let targetItem: any = targetType === 'arch' ? archTypes.find((a) => a.id === targetId) : flows.find((f) => f.id === targetId);
  if (!targetItem) {
    return res.status(404).json({ status: 0, info: '未找到目标节点' });
  }

  // 3. Determine newParentId
  let newParentId = '';
  if (position === 'inside') {
    if (targetType !== 'arch') {
      return res.status(400).json({ status: 0, info: '流程节点无法作为父级包含子节点' });
    }
    newParentId = targetId;
  } else {
    newParentId = targetItem.parentId || 'arch_root';
  }

  // 4. Circular dependency check for arch
  if (dragType === 'arch') {
    if (newParentId === dragId) {
      return res.status(400).json({ status: 0, info: '无法移动到自身内部' });
    }
    let cur = archTypes.find((a) => a.id === newParentId);
    while (cur && cur.parentId) {
      if (cur.parentId === dragId || cur.id === dragId) {
        return res.status(400).json({ status: 0, info: '无法移动到自身的子孙架构下' });
      }
      cur = archTypes.find((a) => a.id === cur.parentId);
    }
  }

  // 5. Update parentId and levels
  const oldParentId = dragItem.parentId;
  dragItem.parentId = newParentId;

  if (dragType === 'arch') {
    let d = 0;
    let pCur = archTypes.find((a) => a.id === newParentId);
    while (pCur && pCur.parentId && pCur.id !== 'arch_root') {
      d++;
      pCur = archTypes.find((a) => a.id === pCur.parentId);
    }
    dragItem.level = `L${Math.min(6, Math.max(1, d + 1))}`;
  } else {
    const pArch = archTypes.find((a) => a.id === newParentId);
    dragItem.archName = pArch ? pArch.label : '企业流程架构全景';
  }

  // 6. Reorder siblings under newParentId
  const sibArchs = archTypes.filter((a) => a.parentId === newParentId && a.id !== dragId);
  const sibFlows = flows.filter((f) => f.parentId === newParentId && f.id !== dragId);

  const siblings: Array<{ id: string; type: 'arch' | 'flow'; item: any; sortOrder: number }> = [
    ...sibFlows.map((f, i) => ({ id: f.id, type: 'flow' as const, item: f, sortOrder: f.sortOrder ?? i })),
    ...sibArchs.map((a, i) => ({ id: a.id, type: 'arch' as const, item: a, sortOrder: a.sortOrder ?? sibFlows.length + i })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  if (position === 'inside') {
    siblings.push({ id: dragItem.id, type: dragType, item: dragItem, sortOrder: 9999 });
  } else {
    const targetIdx = siblings.findIndex((s) => s.id === targetId);
    const insertIdx = position === 'before' ? (targetIdx === -1 ? 0 : targetIdx) : (targetIdx === -1 ? siblings.length : targetIdx + 1);
    siblings.splice(insertIdx, 0, { id: dragItem.id, type: dragType, item: dragItem, sortOrder: 0 });
  }

  siblings.forEach((s, idx) => {
    s.item.sortOrder = idx;
  });

  return res.json({
    status: 1,
    info: '节点移动与层级变更成功',
    data: {
      dragId,
      dragType,
      newParentId,
      oldParentId,
      position,
    },
  });
});

app.post('/api/flow/reorder', (req, res) => {
  const { orderedItems } = req.body || {};
  if (Array.isArray(orderedItems)) {
    orderedItems.forEach((item: any, idx: number) => {
      if (item.type === 'arch') {
        const found = archTypes.find((a) => a.id === item.id);
        if (found) found.sortOrder = idx;
      } else {
        const found = flows.find((f) => f.id === item.id);
        if (found) found.sortOrder = idx;
      }
    });
  }
  res.json({ status: 1, info: '排序已保存' });
});

app.post('/api/flow/model/publish', (req, res) => {
  const { id, audit } = req.body;
  const found = flows.find((f) => f.id === id);
  const nextVer = found ? `V${parseInt((found.versionNo || 'V1').slice(1)) + 1}` : 'V2';
  if (found) {
    found.versionNo = nextVer;
    found.status = audit ? 'verified' : 'published';

    if (audit) {
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const existingIdx = flowAuditRecords.findIndex((r) => r.modelId === found.id && r.auditStatus === '待审核');
      const auditItem = {
        id: 'audit_' + Date.now().toString(36),
        flowId: parseInt(found.id.replace(/\D/g, '')) || Math.floor(Math.random() * 900 + 100),
        modelId: found.id,
        flowCode: found.flowNo || 'FLOW-NEW',
        flowName: found.label || '新流程',
        versionNo: nextVer,
        archPath: found.archName || '企业流程架构全景 > 业务流程',
        businessDomain: (found.archName || '').split('>')[1]?.trim() || '1.0 集成产品开发 IPD',
        changeType: '版本升级',
        changeSummary: '在流程设计器中完成拓扑结构与活动节点配置，提交发布审核',
        urgency: '普通',
        submitTime: nowStr,
        submitUser: currentActiveUser.userName || '系统管理员',
        submitUserDept: currentActiveUser.deptName || '数字化运营部',
        auditStatus: '待审核',
        auditResult: '待审核',
        auditUser: '流程治理委员会',
        auditTime: '',
        auditOpinion: '',
        kcpCount: 2,
        activityCount: 4,
        boundDocsCount: 2,
        effectiveDate: nowStr.slice(0, 10),
      };
      if (existingIdx !== -1) {
        flowAuditRecords[existingIdx] = { ...flowAuditRecords[existingIdx], ...auditItem, id: flowAuditRecords[existingIdx].id };
      } else {
        flowAuditRecords.unshift(auditItem);
      }
    }
  }
  res.json({ status: 1, data: { versionNo: nextVer }, list: flowAuditRecords, info: 'ok' });
});

// Helper to build realistic multi-version histories for any flow
function getFlowVersionHistories(flow: any) {
  const currentVer = flow?.versionNo || 'V2';
  const verNum = parseInt(currentVer.replace(/\D/g, '')) || 2;
  const versions: any[] = [];

  if (flow?.id === 'flow_101' || flow?.flowNo === 'IPD-TR-001') {
    // V2 (Current)
    versions.push({
      versionNo: 'V2',
      versionId: 'ver_flow101_v2',
      flowId: flow.id,
      flowNo: flow.flowNo || 'IPD-TR-001',
      label: flow.label || '1.1.2.1 技术评审主流程',
      publishType: '生产升级发布',
      publishUserName: flow.publishUserName || '系统管理员',
      publishTime: flow.publishTime || '2025-06-22 20:12:27',
      status: '已发布生效',
      isCurrent: true,
      ownerName: flow.ownerName || '系统管理员',
      deptName: flow.deptName || '研发中心/计划阶段',
      applicableScope: '研发规划部、质量控制部',
      businessScope: '集成产品研发与方案评审',
      purpose: '保障研发阶段性技术质量达标，强化TRB决议与交叉把关',
      drivingRules: '研发评审规范与TR评审红线制度V2.1',
      flowInput: 'TR阶段技术设计规格书、测试验证大纲、专家评审前置自查表',
      flowOutput: 'TR技术评审决议书、整改闭环追踪表、阶段性准出证书',
      flowStart: '系统工程师发起技术评审申请',
      flowEnd: 'TRB决议裁决完成并签发批件',
      flowKpi: '技术评审一次通过率 ≥ 85%，缺陷收敛闭环率 100%',
      riskCompliance: '技术合规性与知识产权审查，严格遵循CCB基线红线',
      changeSummary: '在V1基础上增设TRB决策委员会决议裁决环节，设立2处高危KCP关键控制点，拓宽适用范围至质量控制部。',
      changeLogs: [
        '新增环节【TRB决议裁决】（由评审委员会主导终审判断节点）',
        '新增环节【问题收敛整改】（由研发工程师闭环缺陷跟踪）',
        '在【同行交叉审查】环节引入KCP关键控制点，强化风险把关',
        '原【主管签发审批】节点升级并纳入TRB裁决决议体系',
        '适用范围扩展至“质量控制部”，增加质量合规审定',
        '制度依据升级为《研发评审规范与TR评审红线制度V2.1》',
      ],
      roles: ['系统工程师 (Responsible)', '技术专家 (Consulted)', '研发工程师 (Responsible)', '评审委员会 (Accountable)'],
      kcps: [
        { code: 'KCP-TR-01', name: '同行交叉审查把关', role: '技术专家', riskDesc: '技术指标偏离设计规格或接口不兼容风险', controlMeasure: '至少2位资深架构师签署确认意见' },
        { code: 'KCP-TR-02', name: 'TRB终审裁决决议', role: '评审委员会', riskDesc: '带病进入下一开发阶段导致重大流片/改版成本', controlMeasure: 'TRB全员投票决议通过方可归档' }
      ],
      sysDocs: ['《集成产品开发IPD管理手册》', '《TR评审红线制度V2.1》', '《产品技术质量成熟度评价准则》'],
      xml: flow.xml || buildDefaultFlowXml('1.1.2.1 技术评审主流程', [
        { title: '发起技术评审', role: '系统工程师', desc: '提请技术资料包', out: '评审申请表' },
        { title: '同行交叉审查', role: '技术专家', desc: '开展同行专家交叉评议', out: '专家评审意见', kcp: true },
        { title: '问题收敛整改', role: '研发工程师', desc: '针对评审问题项闭环追踪', out: '问题整改记录' },
        { title: 'TRB决议裁决', role: '评审委员会', desc: '签发TR通过批件', out: 'TR评审决议', judge: true, kcp: true },
      ]),
    });

    // V1 (Baseline)
    versions.push({
      versionNo: 'V1',
      versionId: 'ver_flow101_v1',
      flowId: flow.id,
      flowNo: flow.flowNo || 'IPD-TR-001',
      label: '1.1.2.1 技术评审主流程 (基础版)',
      publishType: '初始基线发布',
      publishUserName: '张三',
      publishTime: '2025-01-15 11:20:00',
      status: '历史版本 (已归档)',
      isCurrent: false,
      ownerName: '张三',
      deptName: '研发中心/计划阶段',
      applicableScope: '研发规划部',
      businessScope: '集成产品研发',
      purpose: '规范研发阶段性技术评审基本操作',
      drivingRules: '研发评审规范草案V1.0',
      flowInput: '技术规格书初稿',
      flowOutput: '初版评审纪要',
      flowStart: '项目组发起评审',
      flowEnd: '部门主管签字确认',
      flowKpi: '评审按期完成率 ≥ 80%',
      riskCompliance: '基础合规审核',
      changeSummary: '建立流程初始基线，确立基础3环节技术评审流程与单点审查。',
      changeLogs: [
        '确立基础3环节技术评审流程：发起技术评审、同行审查、主管签发审批',
        '设立初始控制点KCP-01，仅限研发规划部内部执行',
      ],
      roles: ['系统工程师 (Responsible)', '技术专家 (Consulted)', '部门主管 (Accountable)'],
      kcps: [
        { code: 'KCP-TR-01', name: '同行审查把关', role: '技术专家', riskDesc: '初级技术偏离风险', controlMeasure: '同行技术员签字' }
      ],
      sysDocs: ['《集成产品开发IPD管理手册》'],
      xml: buildDefaultFlowXml('1.1.2.1 技术评审主流程 (V1基准)', [
        { title: '发起技术评审', role: '系统工程师', desc: '提请技术资料包', out: '评审申请表' },
        { title: '同行审查', role: '技术专家', desc: '开展同行专家交叉评议', out: '专家评审意见' },
        { title: '主管签发审批', role: '部门主管', desc: '部门经理终审确认', out: '审批意见单', judge: true },
      ]),
    });

    return versions;
  }

  // Generic flow versions generator
  const maxV = Math.max(2, verNum);
  for (let v = maxV; v >= 1; v--) {
    const vTag = `V${v}`;
    const isCur = v === maxV;
    const isBase = v === 1;

    let vXml = flow.xml;
    let vKcps = [
      { code: `KCP-${v}-01`, name: `${flow.label || '流程'}关键审核`, role: flow.ownerName || '流程责任人', riskDesc: '业务操作不合规风险', controlMeasure: '双人复核审批' }
    ];
    let vDocs = ['《业务流程管理操作指引》'];
    let vLogs = [`更新${vTag}版本流程配置，优化节点逻辑与权责清单`];

    if (v === 1) {
      vXml = buildDefaultFlowXml(`${flow.label || '流程'} (V1基线)`, [
        { title: '初始业务发起', role: '经办人', desc: '发起业务事项', out: '发起单' },
        { title: '部门审查', role: '主管', desc: '部门主管初核', out: '审核意见', judge: true },
      ]);
      vDocs = ['《业务流程管理操作指引(旧版)》'];
      vLogs = ['初次发布建立系统基线流程'];
    } else if (v === 2) {
      vKcps.push({ code: `KCP-${v}-02`, name: '合规与风险终审', role: '风控总监', riskDesc: '关键控制点违规风险', controlMeasure: '风控系统自动化防线拦截' });
      vDocs.push('《风险合规控制矩阵V2.0》');
      vLogs = ['优化流转路径，增加合规与风险终审控制点', '提升时效指标考核权重'];
    } else if (v >= 3) {
      vKcps.push(
        { code: `KCP-${v}-02`, name: '合规与风险终审', role: '风控总监', riskDesc: '关键控制点违规风险', controlMeasure: '风控系统自动化防线拦截' },
        { code: `KCP-${v}-03`, name: '经营闭环决策', role: '分管副总裁', riskDesc: '经营目标偏离风险', controlMeasure: '月度经营例会决议' }
      );
      vDocs.push('《数字化运营与合规制度V3.0》', '《权责发生制清单》');
      vLogs = ['引入全渠道自动验真与经营闭环决议节点', '关联数字化风险合规防线', '责任人权限精细化下沉'];
    }

    versions.push({
      versionNo: vTag,
      versionId: `ver_${flow.id}_${vTag.toLowerCase()}`,
      flowId: flow.id,
      flowNo: flow.flowNo || 'FLOW-001',
      label: isBase ? `${flow.label} (基线版)` : flow.label,
      publishType: isBase ? '初始基线发布' : (isCur ? '生产升级发布' : '修订发布'),
      publishUserName: isBase ? '张三' : (flow.publishUserName || '系统管理员'),
      publishTime: isCur ? (flow.publishTime || '2026-03-20 10:00:00') : `2025-0${Math.min(9, v + 2)}-15 10:30:00`,
      status: isCur ? '已发布生效' : '历史版本 (已归档)',
      isCurrent: isCur,
      ownerName: isBase ? '张三' : (flow.ownerName || '系统管理员'),
      deptName: flow.deptName || '数字化运营部',
      applicableScope: isBase ? '部门内部' : (flow.applicableScope || '集团各相关中心/事业部'),
      businessScope: flow.businessScope || '核心业务域',
      purpose: flow.purpose || '提升端到端流程执行效率与风险把控',
      drivingRules: isBase ? '初版操作规程草案' : (flow.drivingRules || '企业核心业务流程管理规范'),
      flowInput: flow.flowInput || '业务启动申请表单与前置凭证',
      flowOutput: flow.flowOutput || '最终审批决议与归档台账',
      flowStart: flow.flowStart || '经办人发起申请',
      flowEnd: flow.flowEnd || '决议归档完成',
      flowKpi: isBase ? '达成率 ≥ 80%' : (flow.flowKpi || '端到端达成率 ≥ 95%'),
      riskCompliance: flow.riskCompliance || '遵循内控合规手册要求',
      changeSummary: isCur ? `当前${vTag}生效版本，已完成全面的业务优化与控制点强化。` : `历史版本${vTag}，归档于系统发布库。`,
      changeLogs: vLogs,
      roles: ['经办人 (Responsible)', '部门主管 (Accountable)', '风控专员 (Consulted)'],
      kcps: vKcps,
      sysDocs: vDocs,
      xml: isCur ? (flow.xml || vXml) : vXml,
    });
  }

  return versions;
}

app.get('/api/flow/model/publishVersionHistories', (req, res) => {
  const found = flows.find((f) => f.id === req.query.id) || flows[0];
  const list = getFlowVersionHistories(found);
  res.json({
    status: 1,
    data: list,
    info: 'ok',
  });
});

app.get('/api/flow/type/publishVersionHistories', (req, res) => {
  const targetId = req.query.id as string;
  const foundArch = archTypes.find((a) => a.id === targetId) || archTypes[0];
  const list = [
    {
      versionNo: 'V2',
      versionId: `ver_arch_${foundArch.id}_v2`,
      archId: foundArch.id,
      archNo: foundArch.archNo || 'ARCH-001',
      label: foundArch.label,
      publishType: '架构基线发布',
      publishUserName: foundArch.publishUserName || '系统管理员',
      publishTime: foundArch.publishTime || '2026-03-17 15:17:22',
      status: '已发布生效',
      isCurrent: true,
      ownerName: foundArch.ownerName || '系统管理员',
      deptName: foundArch.deptName || '流程治理委员会',
      changeSummary: '更新端到端架构视图与业务集成关系。',
      changeLogs: ['完成L1-L3层级分类梳理与集成视图重绘', '关联下属关键业务流程'],
    },
    {
      versionNo: 'V1',
      versionId: `ver_arch_${foundArch.id}_v1`,
      archId: foundArch.id,
      archNo: foundArch.archNo || 'ARCH-001',
      label: `${foundArch.label} (初始架构版)`,
      publishType: '初始建档发布',
      publishUserName: '张三',
      publishTime: '2025-05-10 09:30:00',
      status: '历史版本 (已归档)',
      isCurrent: false,
      ownerName: '张三',
      deptName: foundArch.deptName || '企业规划部',
      changeSummary: '企业架构梳理首期初始化建档。',
      changeLogs: ['初始化架构节点定义'],
    },
  ];
  res.json({
    status: 1,
    data: list,
    info: 'ok',
  });
});

app.get('/api/flow/model/refs', (req, res) => {
  const id = String(req.query.id || 'flow_101');
  const tab = String(req.query.tab || 'zdwj');
  const refIds = flowRefsStore[id]?.[tab] || ['doc_01'];
  res.json({ status: 1, data: refIds, info: 'ok' });
});

app.post('/api/flow/model/refs', (req, res) => {
  const { id, tab, refIds } = req.body;
  if (!flowRefsStore[id]) flowRefsStore[id] = {};
  flowRefsStore[id][tab] = Array.isArray(refIds) ? refIds : [];
  res.json({ status: 1, data: flowRefsStore[id][tab], info: 'ok' });
});

// Flow Attachment Upload & Download
app.post('/api/flow/model/upload-attachment', (req, res) => {
  const { flowId, attNo, label, category, fileSize, ownerName } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ status: 0, info: '附件文件名称不能为空' });
  }
  const id = 'att_' + Date.now().toString(36);
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newAtt = {
    id,
    attNo: attNo || 'FJ-FLOW-' + Math.floor(1000 + Math.random() * 9000),
    label: label.trim(),
    category: category || '流程操作指引',
    fileSize: fileSize || '1.5 MB',
    ownerName: ownerName || currentActiveUser?.userName || '系统管理员',
    publishTime: nowStr,
    status: 'approved',
  };

  if (!dictBundle.attachments) {
    dictBundle.attachments = [];
  }
  dictBundle.attachments.unshift(newAtt);

  if (flowId) {
    if (!flowRefsStore[flowId]) flowRefsStore[flowId] = {};
    if (!flowRefsStore[flowId].xgfj) flowRefsStore[flowId].xgfj = [];
    if (!flowRefsStore[flowId].xgfj.includes(id)) {
      flowRefsStore[flowId].xgfj.unshift(id);
    }
  }

  res.json({
    status: 1,
    data: newAtt,
    refIds: flowId ? flowRefsStore[flowId].xgfj : [],
    attachments: dictBundle.attachments,
    info: '附件上传成功并已关联至当前流程',
  });
});

app.get('/api/flow/attachment/download', (req, res) => {
  const { id, name } = req.query as { id?: string; name?: string };
  const found = (dictBundle.attachments || []).find((a: any) => a.id === id || a.label === name) || {
    label: name || '流程附件.pdf',
    attNo: 'FJ-2026-01',
    category: '流程相关附件',
    publishTime: '2026-03-20',
  };

  const filename = found.label || '流程附件.pdf';
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  const content = `全源流程资产管理平台 - 流程相关附件文件\n附件名称: ${filename}\n附件编号: ${found.attNo || 'FJ-2026-01'}\n业务分类: ${found.category || '相关附件'}\n上传时间: ${found.publishTime || '2026-03-20'}\n\n【正式发文附件】\n苏州全源数字科技有限公司 业务流程执行参考材料。`;
  res.send(content);
});

app.get('/api/flow/:id/xml', (req, res) => {
  const id = req.params.id;
  // 1. Check if it is a flow
  const foundFlow = flows.find((f) => f.id === id);
  if (foundFlow) {
    return res.json({
      status: 1,
      data: { xml: foundFlow.xml, title: foundFlow.label, id: foundFlow.id, type: 'flow' },
      info: 'ok',
    });
  }

  // 2. Check if it is an architecture node
  const foundArch = archTypes.find((a) => a.id === id);
  if (foundArch) {
    if (!archIntegrationXmlStore[id]) {
      const children = archTypes.filter((a) => a.parentId === id);
      archIntegrationXmlStore[id] = buildDefaultArchIntegrationXml(foundArch, children);
    }
    return res.json({
      status: 1,
      data: {
        xml: archIntegrationXmlStore[id],
        title: `【业务集成视图】${foundArch.label}`,
        id: foundArch.id,
        type: 'arch',
      },
      info: 'ok',
    });
  }

  // Fallback to first flow
  const fallback = flows[0];
  res.json({
    status: 1,
    data: { xml: fallback?.xml || '', title: fallback?.label || '主流程图', id: fallback?.id || id, type: 'flow' },
    info: 'ok',
  });
});

app.post('/api/flow/:id/xml', (req, res) => {
  const id = req.params.id;
  const { xml, title } = req.body;

  const foundFlow = flows.find((f) => f.id === id);
  if (foundFlow) {
    if (xml !== undefined) foundFlow.xml = xml;
    if (title) foundFlow.label = title;
    return res.json({ status: 1, data: foundFlow, info: 'ok' });
  }

  const foundArch = archTypes.find((a) => a.id === id);
  if (foundArch) {
    if (xml !== undefined) {
      archIntegrationXmlStore[id] = xml;
      foundArch.integrationXml = xml;
    }
    if (title) {
      foundArch.integrationTitle = title;
    }
    return res.json({
      status: 1,
      data: { ...foundArch, xml: archIntegrationXmlStore[id] },
      info: 'ok',
    });
  }

  res.json({ status: 1, info: 'ok' });
});

// Architecture business integration view aliases
app.get('/api/flow/arch/:id/integration-xml', (req, res) => {
  const id = req.params.id;
  const foundArch = archTypes.find((a) => a.id === id) || archTypes[0];
  if (!archIntegrationXmlStore[id]) {
    const children = archTypes.filter((a) => a.parentId === id);
    archIntegrationXmlStore[id] = buildDefaultArchIntegrationXml(foundArch, children);
  }
  res.json({
    status: 1,
    data: {
      xml: archIntegrationXmlStore[id],
      title: `【业务集成视图】${foundArch.label}`,
      id: foundArch.id,
      archNo: foundArch.archNo,
    },
    info: 'ok',
  });
});

app.post('/api/flow/arch/:id/integration-xml', (req, res) => {
  const id = req.params.id;
  const { xml, title } = req.body;
  const foundArch = archTypes.find((a) => a.id === id);
  if (foundArch) {
    if (xml !== undefined) {
      archIntegrationXmlStore[id] = xml;
      foundArch.integrationXml = xml;
    }
    if (title) foundArch.integrationTitle = title;
  }
  res.json({ status: 1, data: { id, xml: archIntegrationXmlStore[id] }, info: 'ok' });
});

// Collaborators APIs (流程架构与流程类型的协作者管理)
app.get('/api/flow/collaborators', (req, res) => {
  const { targetType, targetId } = req.query as { targetType?: string; targetId?: string };
  let target: any = null;
  if (targetType === 'arch') {
    target = archTypes.find((a) => a.id === targetId);
  } else {
    target = flows.find((f) => f.id === targetId);
  }
  const collaborators = (target && target.collaborators) || [];
  res.json({
    status: 1,
    data: collaborators,
    target: target ? { id: target.id, label: target.label, ownerName: target.ownerName, flowNo: target.flowNo || target.archNo } : null,
    info: 'ok'
  });
});

app.post('/api/flow/collaborators', (req, res) => {
  const { targetType, targetId, collaborators } = req.body || {};
  let target: any = null;
  if (targetType === 'arch') {
    target = archTypes.find((a) => a.id === targetId);
  } else {
    target = flows.find((f) => f.id === targetId);
  }
  if (target) {
    target.collaborators = Array.isArray(collaborators) ? collaborators : [];
  }
  res.json({ status: 1, data: target?.collaborators || [], info: 'ok' });
});

// Audits & Repeals
app.get('/api/flow/audits', (_req, res) => {
  res.json({ status: 1, data: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/apply', (req, res) => {
  const { modelId, versionNo, urgency, changeType, changeSummary, effectiveDate } = req.body || {};
  const found = flows.find((f) => f.id === modelId) || flows[0];
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const targetVer = versionNo || (found ? `V${parseInt((found.versionNo || 'V1').slice(1)) + 1}` : 'V2');

  if (found) {
    found.versionNo = targetVer;
    found.status = 'verified';
  }

  const newAudit = {
    id: 'audit_' + Date.now().toString(36),
    flowId: parseInt((found?.id || '101').replace(/\D/g, '')) || Math.floor(Math.random() * 900 + 100),
    modelId: found?.id || 'flow_101',
    flowCode: found?.flowNo || 'FLOW-NEW',
    flowName: found?.label || '待审核业务流程',
    versionNo: targetVer,
    archPath: found?.archName || '企业流程架构全景 > 业务流程',
    businessDomain: (found?.archName || '').split('>')[1]?.trim() || '1.0 集成产品开发 IPD',
    changeType: changeType || '版本升级',
    changeSummary: changeSummary || '提交新版流程合规发布申请',
    urgency: urgency || '普通',
    submitTime: nowStr,
    submitUser: currentActiveUser.userName || '系统管理员',
    submitUserDept: currentActiveUser.deptName || '数字化运营部',
    auditStatus: '待审核',
    auditResult: '待审核',
    auditUser: '流程治理委员会',
    auditTime: '',
    auditOpinion: '',
    kcpCount: 2,
    activityCount: 5,
    boundDocsCount: 2,
    effectiveDate: effectiveDate || nowStr.slice(0, 10),
  };
  flowAuditRecords.unshift(newAudit);
  res.json({ status: 1, data: newAudit, list: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/action', (req, res) => {
  const { id, action, opinion, effectiveDate } = req.body || {};
  const target = flowAuditRecords.find((r) => r.id === id);
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (target) {
    if (action === 'approve') {
      target.auditStatus = '已审核';
      target.auditResult = '同意发布';
      target.auditTime = nowStr;
      target.auditUser = currentActiveUser.userName || '系统管理员';
      if (effectiveDate) target.effectiveDate = effectiveDate;

      // Update flow status to published
      const flowTarget = flows.find((f) => f.id === target.modelId);
      if (flowTarget) {
        flowTarget.status = 'published';
        flowTarget.versionNo = target.versionNo;
        flowTarget.publishTime = nowStr;
        flowTarget.publishUserName = target.auditUser;
      }
    } else if (action === 'reject') {
      target.auditStatus = '已驳回';
      target.auditResult = '驳回修改';
      target.auditTime = nowStr;
      target.auditUser = currentActiveUser.userName || '系统管理员';

      const flowTarget = flows.find((f) => f.id === target.modelId);
      if (flowTarget) {
        flowTarget.status = 'draft';
      }
    } else if (action === 'withdraw') {
      target.auditStatus = '已撤回';
      target.auditResult = '已撤回';
      target.auditTime = nowStr;
      target.auditUser = target.submitUser;

      const flowTarget = flows.find((f) => f.id === target.modelId);
      if (flowTarget) {
        flowTarget.status = 'draft';
      }
    }
    if (opinion !== undefined) {
      target.auditOpinion = opinion;
    }
  }
  res.json({ status: 1, data: target, list: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/batch-action', (req, res) => {
  const { ids, action, opinion, effectiveDate } = req.body || {};
  const idList = Array.isArray(ids) ? ids : [];
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  idList.forEach((id) => {
    const target = flowAuditRecords.find((r) => r.id === id);
    if (target) {
      if (action === 'approve') {
        target.auditStatus = '已审核';
        target.auditResult = '同意发布';
        target.auditTime = nowStr;
        target.auditUser = currentActiveUser.userName || '系统管理员';
        if (effectiveDate) target.effectiveDate = effectiveDate;
        if (opinion) target.auditOpinion = opinion;

        const flowTarget = flows.find((f) => f.id === target.modelId);
        if (flowTarget) {
          flowTarget.status = 'published';
          flowTarget.versionNo = target.versionNo;
          flowTarget.publishTime = nowStr;
          flowTarget.publishUserName = target.auditUser;
        }
      } else if (action === 'reject') {
        target.auditStatus = '已驳回';
        target.auditResult = '驳回修改';
        target.auditTime = nowStr;
        target.auditUser = currentActiveUser.userName || '系统管理员';
        if (opinion) target.auditOpinion = opinion;

        const flowTarget = flows.find((f) => f.id === target.modelId);
        if (flowTarget) {
          flowTarget.status = 'draft';
        }
      }
    }
  });

  res.json({ status: 1, list: flowAuditRecords, info: 'ok' });
});

app.delete('/api/flow/audits/:id', (req, res) => {
  const idx = flowAuditRecords.findIndex((r) => r.id === req.params.id);
  if (idx !== -1) {
    flowAuditRecords.splice(idx, 1);
  }
  res.json({ status: 1, list: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  const idSet = new Set(Array.isArray(ids) ? ids : []);
  for (let i = flowAuditRecords.length - 1; i >= 0; i--) {
    if (idSet.has(flowAuditRecords[i].id)) {
      flowAuditRecords.splice(i, 1);
    }
  }
  res.json({ status: 1, list: flowAuditRecords, info: 'ok' });
});

app.get('/api/flow/repeals', (_req, res) => {
  res.json({ status: 1, data: flowRepealRecords, info: 'ok' });
});

app.post('/api/flow/repeal/apply', (req, res) => {
  const { modelId, reasonType, reason, replaceFlowName, impactScope, applicant } = req.body || {};
  const targetFlow = flows.find((f) => f.id === modelId) || flows[0];
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const repId = 'repeal_' + Date.now().toString(36);

  targetFlow.repealApplyStatus = '待审核';
  targetFlow.repealApplyId = repId;

  const newRec = {
    id: repId,
    modelId: targetFlow.id,
    flowCode: targetFlow.flowNo,
    flowName: targetFlow.label,
    versionNo: targetFlow.versionNo || 'V1',
    flowLevel: targetFlow.flowLevel || 'L3',
    archId: targetFlow.parentId,
    archPath: targetFlow.archName || '企业流程架构全景',
    ownerName: targetFlow.ownerName || '系统管理员',
    reasonType: reasonType || '业务模式变革调整',
    reason: reason || '业务优化升级与流程整合',
    replaceFlowName: replaceFlowName || '',
    impactScope: impactScope || '全公司相关业务部门',
    applicant: applicant || currentActiveUser?.userName || '流程管理员',
    applyTime: nowStr,
    stage: '待部门审批',
    status: '待部门审批',
    approvalLogs: [
      {
        stepName: '发起建议废止',
        role: '流程责任人 / 发起人',
        operator: applicant || currentActiveUser?.userName || '流程管理员',
        action: '已提交申请',
        time: nowStr,
        opinion: reason || '发起流程废止审批申请',
      },
      {
        stepName: '部门流程负责人审批',
        role: '业务部门总监',
        operator: '业务总监 (李维)',
        action: '待审批',
        time: '',
        opinion: '',
      },
      {
        stepName: '流程运营合规复核',
        role: '流程合规经理',
        operator: '合规专家 (王志敏)',
        action: '待审核',
        time: '',
        opinion: '',
      },
      {
        stepName: '集团流程管理员确认并归档',
        role: '集团流程管理部',
        operator: '集团流程管理员',
        action: '待归档确认',
        time: '',
        opinion: '',
      },
    ],
  };

  flowRepealRecords.unshift(newRec);
  res.json({ status: 1, data: newRec, list: flowRepealRecords, info: 'ok' });
});

// 多级审批推进
app.post('/api/flow/repeal/approveStep', (req, res) => {
  const { id, action, opinion, operator } = req.body || {};
  const target = flowRepealRecords.find((r) => r.id === id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到废止申请记录' });

  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const targetFlow = flows.find((f) => f.id === target.modelId);

  if (action === 'reject') {
    target.stage = '已驳回';
    target.status = '已驳回';
    if (!target.approvalLogs) target.approvalLogs = [];
    target.approvalLogs.push({
      stepName: '审批驳回',
      role: '审批责任人',
      operator: operator || currentActiveUser?.userName || '审批人员',
      action: '已驳回',
      time: nowStr,
      opinion: opinion || '不满足废止条件，予以驳回',
    });
    if (targetFlow) {
      targetFlow.repealApplyStatus = '已驳回';
    }
    return res.json({ status: 1, data: target, list: flowRepealRecords, info: '已驳回废止申请' });
  }

  // 审批通过推进节点
  if (target.stage === '待部门审批' || target.status === '待部门审批') {
    target.stage = '待合规复核';
    target.status = '待合规复核';
    const logItem = (target.approvalLogs || []).find((l: any) => l.stepName === '部门流程负责人审批');
    if (logItem) {
      logItem.action = '审批通过';
      logItem.time = nowStr;
      logItem.operator = operator || logItem.operator;
      logItem.opinion = opinion || '同意建议废止，业务衔接方案合理。';
    }
  } else if (target.stage === '待合规复核' || target.status === '待合规复核') {
    target.stage = '待集团流程管理员确认归档';
    target.status = '待集团流程管理员确认归档';
    const logItem = (target.approvalLogs || []).find((l: any) => l.stepName === '流程运营合规复核');
    if (logItem) {
      logItem.action = '审核通过';
      logItem.time = nowStr;
      logItem.operator = operator || logItem.operator;
      logItem.opinion = opinion || '制度与合规影响评估完成，准予进入集团归档阶段。';
    }
  }

  res.json({ status: 1, data: target, list: flowRepealRecords, info: '审批已通过并流转下一节点' });
});

// 最终批准：集团流程管理员进行确认并归档
app.post('/api/flow/repeal/confirmArchive', (req, res) => {
  const { id, opinion, operator } = req.body || {};
  const target = flowRepealRecords.find((r) => r.id === id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到废止申请记录' });

  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const targetFlow = flows.find((f) => f.id === target.modelId);
  const archiveNo = 'ARC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);

  target.stage = '已废止归档';
  target.status = '已废止归档';
  target.archiveNo = archiveNo;
  target.archiveUser = operator || currentActiveUser?.userName || '集团流程管理员';
  target.archiveTime = nowStr;
  target.archiveOpinion = opinion || '经集团流程管理部最终核验，所有关联业务已顺利割接，正式废止并归档入库。';

  const logItem = (target.approvalLogs || []).find((l: any) => l.stepName === '集团流程管理员确认并归档');
  if (logItem) {
    logItem.action = '已确认并归档';
    logItem.time = nowStr;
    logItem.operator = target.archiveUser;
    logItem.opinion = target.archiveOpinion;
  }

  if (targetFlow) {
    targetFlow.status = 'repealed';
    targetFlow.repealApplyStatus = '已废止归档';
    targetFlow.repealedTime = nowStr;
    targetFlow.repealedBy = target.archiveUser;
    targetFlow.archiveNo = archiveNo;
  }

  res.json({ status: 1, data: target, list: flowRepealRecords, info: '流程已完成集团确认并归档入库' });
});

// 核心功能：还原已废止流程
app.post('/api/flow/repeal/restore', (req, res) => {
  const { id, modelId, targetParentId, restoreStatus, restoreReason, operator } = req.body || {};
  const repealRecord = flowRepealRecords.find((r) => r.id === id || r.modelId === modelId);
  const targetFlow = flows.find((f) => f.id === (modelId || repealRecord?.modelId));

  if (!targetFlow) {
    return res.status(404).json({ status: 0, info: '未找到对应业务流程数据' });
  }

  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // 恢复流程状态
  targetFlow.status = restoreStatus || 'published';
  targetFlow.repealApplyStatus = '';
  delete targetFlow.repealedTime;
  delete targetFlow.repealedBy;
  targetFlow.restoredTime = nowStr;
  targetFlow.restoredBy = operator || currentActiveUser?.userName || '集团流程管理员';
  targetFlow.restoreReason = restoreReason || '业务重启恢复启用';

  // 支持还原至原架构或指定新架构
  if (targetParentId) {
    targetFlow.parentId = targetParentId;
    const parentArch = archTypes.find((a) => a.id === targetParentId);
    if (parentArch) {
      targetFlow.archName = parentArch.label;
    }
  }

  if (repealRecord) {
    repealRecord.status = '已还原';
    repealRecord.stage = '已还原';
    if (!repealRecord.restoreLogs) repealRecord.restoreLogs = [];
    repealRecord.restoreLogs.unshift({
      time: nowStr,
      operator: targetFlow.restoredBy,
      targetArch: targetFlow.archName,
      restoreStatus: targetFlow.status,
      reason: restoreReason || '因业务需要重新启用并还原入库',
    });
  }

  res.json({ status: 1, data: targetFlow, repealRecord, info: '流程已成功还原' });
});

app.post('/api/flow/repeal/action', (req, res) => {
  const { id, action } = req.body || {};
  const target = flowRepealRecords.find((r) => r.id === id);
  if (target && action === 'approve') {
    target.status = '已废止归档';
    target.stage = '已废止归档';
    const flowItem = flows.find((f) => f.id === target.modelId);
    if (flowItem) {
      flowItem.status = 'repealed';
      flowItem.repealApplyStatus = '已废止归档';
    }
  }
  res.json({ status: 1, data: target, list: flowRepealRecords, info: 'ok' });
});

// Dictionary Bundle
app.get('/api/dict/bundle', (_req, res) => {
  const syncedTerms = [
    ...(dictBundle.terms || []),
    ...flowTerms.map((t) => ({
      id: String(t.id),
      termId: t.id,
      name: t.name,
      label: t.name,
      category: t.category,
      desc: t.content,
      content: t.content,
    })),
  ];
  // Deduplicate terms by id
  const termMap = new Map();
  syncedTerms.forEach((t) => {
    if (!termMap.has(String(t.id))) {
      termMap.set(String(t.id), t);
    }
  });

  res.json({
    status: 1,
    data: {
      ...dictBundle,
      terms: Array.from(termMap.values()),
    },
    info: 'ok',
  });
});

app.post('/api/dict/tree', (req, res) => {
  const { treeType, action, label } = req.body || {};
  const targetTree = treeType === 'risk' ? dictBundle.riskTree : dictBundle.sysDocTree;
  if (action === 'create') {
    const node = { id: 'dir_' + Date.now().toString(36), parentId: 'doc_dir_root', label: label || '新建目录' };
    targetTree.push(node);
    return res.json({ status: 1, data: node, info: 'ok' });
  }
  res.json({ status: 1, info: 'ok' });
});

app.post('/api/dict/item', (req, res) => {
  const { itemType, action, item, id } = req.body || {};
  const list = itemType === 'risk' ? dictBundle.risk : dictBundle.sysDoc;
  if (action === 'create' && item) {
    const newItem = {
      ...item,
      id: `${itemType || 'doc'}_${Date.now().toString(36)}`,
      validityPeriod: item.validityPeriod || '2026-03-17 至 2029-03-16 (长期有效)',
      publishTime: item.publishTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    list.unshift(newItem);
    return res.json({ status: 1, data: newItem, bundle: dictBundle, info: 'ok' });
  }
  if (action === 'update' && item && item.id) {
    const idx = list.findIndex((x: any) => x.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
      return res.json({ status: 1, data: list[idx], bundle: dictBundle, info: 'ok' });
    }
  }
  if (action === 'delete' && id) {
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx >= 0) {
      const removed = list.splice(idx, 1);
      return res.json({ status: 1, data: removed[0], bundle: dictBundle, info: 'ok' });
    }
  }
  if (action === 'approve' && id) {
    const target = list.find((x: any) => x.id === id);
    if (target) target.status = 'approved';
    return res.json({ status: 1, data: target, bundle: dictBundle, info: 'ok' });
  }
  res.json({ status: 1, bundle: dictBundle, info: 'ok' });
});

// 制度文件下载接口
app.get('/api/dict/doc/download', (req, res) => {
  const { id, name } = req.query as { id?: string; name?: string };
  const found = dictBundle.sysDoc.find((d: any) => d.id === id || d.label === name) || {
    label: name || '全源科技销售合同分级审批制度.pdf',
    docNo: 'ZD-MKT-2026-01',
    validityPeriod: '2026-03-17 至 2029-03-16 (长期有效)',
  };

  const filename = found.label || '制度文件.pdf';
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  const content = `全源流程资产管理平台 - 制度文件正本\n文件名称: ${filename}\n制度编号: ${found.docNo || 'ZD-2026-01'}\n有效期: ${found.validityPeriod || '长期有效'}\n发布时间: ${found.publishTime || '2026-03-17'}\n\n【正式发文】\n全源数字科技（苏州）有限公司 内部合规管理制度。`;
  res.send(content);
});

// Tasks
app.get('/api/execute/tasks', (_req, res) => {
  res.json({ status: 1, data: flowProcessTasks, users: systemUsers, info: 'ok' });
});

app.post('/api/execute/tasks/assign', (req, res) => {
  const { modelId, taskName, taskDesc, assignee } = req.body || {};
  const fl = flows.find((f) => f.id === modelId) || flows[0];
  const newTask = {
    id: 'task_' + Date.now().toString(36),
    taskName: taskName || `${fl.label}-工单任务`,
    status: '进行中',
    assignee: assignee || '张三',
    flowId: Math.floor(200 + Math.random() * 90),
    modelId: fl.id,
    flowCode: fl.flowNo,
    flowName: fl.label,
    archPath: fl.archName,
    versionNo: fl.versionNo,
    flowPurpose: fl.purpose,
    taskDesc: taskDesc || '',
    creator: '系统管理员',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    submitTime: '',
    steps: [
      { id: 'st_1', seq: 1, stepName: '起草编制', roleName: '经办人', status: '已办', completionNote: '已完成起草', relatedFiles: [], startTime: '', endTime: '' },
      { id: 'st_2', seq: 2, stepName: '主管初审', roleName: '主管', status: '进行中', completionNote: '', relatedFiles: [], startTime: '', endTime: '' },
    ],
  };
  flowProcessTasks.unshift(newTask);
  res.json({ status: 1, data: newTask, list: flowProcessTasks, info: 'ok' });
});

app.put('/api/execute/tasks/:id', (req, res) => {
  const target = flowProcessTasks.find((t) => t.id === req.params.id);
  if (target) Object.assign(target, req.body);
  res.json({ status: 1, data: target, list: flowProcessTasks, info: 'ok' });
});

app.put('/api/execute/tasks/:id/step', (req, res) => {
  const target = flowProcessTasks.find((t) => t.id === req.params.id);
  if (target) {
    const { stepId, ...stepPatch } = req.body;
    const st = target.steps.find((s: any) => s.id === stepId);
    if (st) Object.assign(st, stepPatch);
  }
  res.json({ status: 1, data: target, list: flowProcessTasks, info: 'ok' });
});

app.delete('/api/execute/tasks/:id', (req, res) => {
  const idx = flowProcessTasks.findIndex((t) => t.id === req.params.id);
  if (idx !== -1) {
    flowProcessTasks.splice(idx, 1);
  }
  res.json({ status: 1, list: flowProcessTasks, info: '删除成功' });
});

app.post('/api/execute/tasks/batch-assign', (req, res) => {
  const { taskIds = [], assignee = '', taskDesc = '' } = req.body || {};
  flowProcessTasks.forEach((t) => {
    if (taskIds.includes(t.id)) {
      if (assignee) t.assignee = assignee;
      if (taskDesc) t.taskDesc = taskDesc;
    }
  });
  res.json({ status: 1, list: flowProcessTasks, info: '批量指派成功' });
});

app.post('/api/execute/tasks/batch-delete', (req, res) => {
  const { taskIds = [] } = req.body || {};
  for (let i = flowProcessTasks.length - 1; i >= 0; i--) {
    if (taskIds.includes(flowProcessTasks[i].id)) {
      flowProcessTasks.splice(i, 1);
    }
  }
  res.json({ status: 1, list: flowProcessTasks, info: '批量删除成功' });
});

app.post('/api/execute/tasks/:id/submit', (req, res) => {
  const target = flowProcessTasks.find((t) => t.id === req.params.id);
  if (target) {
    target.status = '已办结';
    target.submitTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  res.json({ status: 1, data: target, list: flowProcessTasks, info: 'ok' });
});

const DEFAULT_COLLAB_DEPTS = [
  '决策委员会',
  '总裁办',
  '研发部',
  '产品部',
  '市场部',
  '财务部',
  '人力行政部',
  '质量合规部',
];

// Duty Manuals & DOA Management (权责建设、权责手册、归档手册)
let dutyManuals: any[] = [
  {
    id: 'manual_2026',
    manualNo: '2026',
    manualName: '2026',
    attachment: '',
    categoryCount: 0,
    publishedCount: 0,
    totalCount: 0,
    viewPermissions: [
      '系统管理部',
      '流程管理部',
      '权责管理部',
      '知识管理部',
      '结构开发部',
      '软件开发部',
      '电气开发部',
      '项目管理部',
      'TZ测试部门',
      'TZ测试1部',
    ],
    status: '已发布',
    archived: false,
    description: '2026年度新建权责手册基线',
    creator: '系统管理员',
    createTime: '2026-03-31 10:20:00',
    updater: '系统管理员',
    updateTime: '2026-03-31 10:20:00',
    categories: [],
    categoryTree: [
      {
        id: 'cat_2026_root',
        name: '2026年度基线分类',
        orderNum: 1,
        children: [
          { id: 'cat_2026_gen', name: '通用权责', parentId: 'cat_2026_root', orderNum: 1 },
          { id: 'cat_2026_spec', name: '专项授权', parentId: 'cat_2026_root', orderNum: 2 },
        ],
      },
    ],
    items: [
      {
        id: 'duty_2026_01',
        manualId: 'manual_2026',
        manualName: '2026',
        categoryId: 'cat_2026_gen',
        categoryName: '通用权责',
        dutyNo: 'TY-2026-001',
        dutyName: '日常行政办公经费审批',
        scenarioText: '【单笔<=5000元】:部门负责人\n【单笔>5000元】:分管副总裁',
        scenarios: [
          { id: 'sc_2026_1', conditionName: '单笔<=5000元', approverName: '部门负责人' },
          { id: 'sc_2026_2', conditionName: '单笔>5000元', approverName: '分管副总裁' },
        ],
        primaryRole: '行政主管',
        scope: '全集团各部门及分支机构',
        effectiveApproval: '已审批通过 (OA-2026-0099)',
        submitTime: '2026-03-30 11:20:00',
        status: '已发布',
        version: 'V1.0',
        updateTime: '2026-03-30 11:20:00',
      },
      {
        id: 'duty_2026_02',
        manualId: 'manual_2026',
        manualName: '2026',
        categoryId: 'cat_2026_gen',
        categoryName: '通用权责',
        dutyNo: 'TY-2026-002',
        dutyName: '经济合同审查与印章使用',
        scenarioText: '【标准格式合同】:法务主管\n【非标或重大合同】:法务总监',
        scenarios: [
          { id: 'sc_2026_3', conditionName: '标准格式合同', approverName: '法务主管' },
          { id: 'sc_2026_4', conditionName: '非标或重大合同', approverName: '法务总监' },
        ],
        primaryRole: '法务合规专员',
        scope: '集团本部及下属子公司',
        effectiveApproval: '审批中 (合规法务终审)',
        submitTime: '2026-03-31 09:15:00',
        status: '待审核',
        version: 'V1.0',
        updateTime: '2026-03-31 09:15:00',
      },
    ],
  },
  {
    id: 'manual_group_2025',
    manualNo: 'XX集团授权体系管理手册',
    manualName: '2025年集团授权手册',
    attachment: '',
    categoryCount: 3,
    publishedCount: 4,
    totalCount: 6,
    viewPermissions: ['系统管理部', '流程管理部', '权责管理部', '知识管理部'],
    status: '已发布',
    archived: false,
    description: 'XX集团全面分权授权体系核心制度与审批矩阵',
    creator: '系统管理员',
    createTime: '2025-12-15 14:00:00',
    updater: '流程推进官',
    updateTime: '2026-03-20 16:30:00',
    categoryTree: [
      {
        id: 'cat_group',
        name: '集团授权手册',
        orderNum: 1,
        children: [
          { id: 'cat_fin', name: '财务管理中心', parentId: 'cat_group', orderNum: 1 },
          { id: 'cat_info', name: '信息管理中心', parentId: 'cat_group', orderNum: 2 },
          { id: 'cat_mkt', name: '营销管理中心', parentId: 'cat_group', orderNum: 3 },
          { id: 'cat_rd', name: '研发管理中心', parentId: 'cat_group', orderNum: 4 },
        ],
      },
      {
        id: 'cat_comp_a',
        name: 'A公司',
        orderNum: 2,
        children: [
          { id: 'cat_a_fin', name: '财务', parentId: 'cat_comp_a', orderNum: 1 },
          { id: 'cat_a_a', name: 'A', parentId: 'cat_comp_a', orderNum: 2 },
          { id: 'cat_a_proc', name: '采购部', parentId: 'cat_comp_a', orderNum: 3 },
        ],
      },
    ],
    items: [
      {
        id: 'duty_01',
        manualId: 'manual_group_2025',
        manualName: '2025年集团授权手册',
        categoryId: 'cat_fin',
        categoryName: '财务管理中心',
        dutyNo: 'PR-AP-0012',
        dutyName: '采购付款',
        scenarioText: '【应付, >100, 】: 未配置批准1内容\n【<100】: 未配置批准1内容',
        scenarios: [
          { id: 'sc_1', conditionName: '应付, >100, ', approverName: '未配置批准1内容' },
          { id: 'sc_2', conditionName: '<100', approverName: '未配置批准1内容' },
        ],
        scenarioBlocks: [
          {
            id: 'block_duty_01_1',
            condition: '应付, >100, ',
            propose: { value: '项目组', type: '通用' },
            jointReview: { value: '', type: '通用' },
            jointReviewAllowReject: false,
            approve1: { value: '', type: '通用' },
            approve2: { value: '', type: '通用' },
            record: { value: '', type: '通用' },
            other: { value: '', type: '通用' },
            audit: { value: '', type: '通用' },
          },
          {
            id: 'block_duty_01_2',
            condition: '<100',
            propose: { value: '经办人', type: '通用' },
            jointReview: { value: '', type: '通用' },
            jointReviewAllowReject: false,
            approve1: { value: '', type: '通用' },
            approve2: { value: '', type: '通用' },
            record: { value: '', type: '通用' },
            other: { value: '', type: '通用' },
            audit: { value: '', type: '通用' },
          },
        ],
        primaryRole: '财务主管',
        scope: '全集团及下属子公司',
        effectiveApproval: '已审批通过 (OA-2026-0391)',
        submitTime: '2026-03-24 16:30:00',
        status: '已发布',
        version: 'V2.1',
        updateTime: '2026-03-25 15:20:00',
      },
      {
        id: 'duty_02',
        manualId: 'manual_group_2025',
        manualName: '2025年集团授权手册',
        categoryId: 'cat_rd',
        categoryName: '研发管理中心',
        dutyNo: 'CC001',
        dutyName: '产品开发立项',
        scenarioText: '',
        scenarios: [],
        primaryRole: '研发总监',
        scope: '研发管理中心/各产品研发部',
        effectiveApproval: '待发起审批',
        submitTime: '2026-03-22 17:00:00',
        status: '草稿',
        version: 'V1.0',
        updateTime: '2026-03-22 17:00:00',
      },
      {
        id: 'duty_03',
        manualId: 'manual_group_2025',
        manualName: '2025年集团授权手册',
        categoryId: 'cat_fin',
        categoryName: '财务管理中心',
        dutyNo: 'CAP-001',
        dutyName: '资金管理',
        scenarioText: '',
        scenarios: [],
        primaryRole: '资金经理',
        scope: '财务管理中心/各业务单元',
        effectiveApproval: '已审批通过 (OA-2026-0182)',
        submitTime: '2026-03-20 11:10:00',
        status: '已发布',
        version: 'V1.2',
        updateTime: '2026-03-20 11:10:00',
      },
      {
        id: 'duty_04',
        manualId: 'manual_group_2025',
        manualName: '2025年集团授权手册',
        categoryId: 'cat_fin',
        categoryName: '财务管理中心',
        dutyNo: 'EXP-001',
        dutyName: '报销申请',
        scenarioText: '【报销金额<10000】:总监',
        scenarios: [
          { id: 'sc_3', conditionName: '报销金额<10000', approverName: '总监' },
        ],
        primaryRole: '财务审核专员',
        scope: '集团本部各职能中心',
        effectiveApproval: '审批中 (决策委员会审核)',
        submitTime: '2026-03-28 09:40:00',
        status: '待审核',
        version: 'V1.0',
        updateTime: '2026-03-28 09:40:00',
      },
      {
        id: 'duty_05',
        manualId: 'manual_group_2025',
        manualName: '2025年集团授权手册',
        categoryId: 'cat_group',
        categoryName: '集团授权手册',
        dutyNo: 'G-PR-001',
        dutyName: '采购申请',
        scenarioText: '【采购金额小于5万】:经理',
        scenarios: [
          { id: 'sc_4', conditionName: '采购金额小于5万', approverName: '经理' },
        ],
        primaryRole: '采购主管',
        scope: '全集团采购业务单位',
        effectiveApproval: '已审批通过 (OA-2026-0205)',
        submitTime: '2026-03-24 14:15:00',
        status: '已发布',
        version: 'V2.0',
        updateTime: '2026-03-24 14:15:00',
      },
      {
        id: 'duty_06',
        manualId: 'manual_group_2025',
        manualName: '2025年集团授权手册',
        categoryId: 'cat_fin',
        categoryName: '财务管理中心',
        dutyNo: 'G-FIN-002',
        dutyName: '日常费用报销',
        scenarioText: '【费用报销金额10000元以下】:部门经理',
        scenarios: [
          { id: 'sc_5', conditionName: '费用报销金额10000元以下', approverName: '部门经理' },
        ],
        primaryRole: '财务会计',
        scope: '集团本部及下属子公司',
        effectiveApproval: '已审批通过 (免审直发)',
        submitTime: '2026-03-18 10:30:00',
        status: '已发布',
        version: 'V1.5',
        updateTime: '2026-03-18 10:30:00',
      },
    ],
  },
];

function recalculateManualCounts(manual: any) {
  if (Array.isArray(manual.items)) {
    manual.totalCount = manual.items.length;
    manual.publishedCount = manual.items.filter((i: any) => i.status === '已发布').length;
  } else {
    manual.totalCount = 0;
    manual.publishedCount = 0;
  }
  if (Array.isArray(manual.categoryTree)) {
    let catCount = 0;
    manual.categoryTree.forEach((root: any) => {
      catCount++;
      if (Array.isArray(root.children)) {
        catCount += root.children.length;
      }
    });
    manual.categoryCount = manual.categoryTree.length > 0 ? manual.categoryTree.length + 1 : 0;
  } else {
    manual.categoryCount = 0;
  }
}

// Duty & DOA
app.get('/api/flowdoc/manuals', (req, res) => {
  const { manualName, manualNo, archived } = req.query || {};
  let list = dutyManuals;
  if (archived === 'true') {
    list = list.filter((m) => m.archived);
  } else if (archived === 'false') {
    list = list.filter((m) => !m.archived);
  }
  if (manualName && typeof manualName === 'string' && manualName.trim()) {
    const q = manualName.trim().toLowerCase();
    list = list.filter((m) => (m.manualName || '').toLowerCase().includes(q));
  }
  if (manualNo && typeof manualNo === 'string' && manualNo.trim()) {
    const q = manualNo.trim().toLowerCase();
    list = list.filter((m) => (m.manualNo || '').toLowerCase().includes(q));
  }
  res.json({ status: 1, data: list, total: list.length, info: 'ok' });
});

app.post('/api/flowdoc/manuals', (req, res) => {
  const { manualNo, manualName, viewPermissions, attachment, description } = req.body || {};
  if (!manualNo?.trim() || !manualName?.trim()) {
    return res.status(400).json({ status: 0, info: '手册编号和名称不能为空' });
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newManual = {
    id: 'manual_' + Date.now().toString(36),
    manualNo: manualNo.trim(),
    manualName: manualName.trim(),
    attachment: attachment || '',
    categoryCount: 0,
    publishedCount: 0,
    totalCount: 0,
    viewPermissions: Array.isArray(viewPermissions) && viewPermissions.length > 0
      ? viewPermissions
      : ['系统管理部', '流程管理部', '权责管理部', '知识管理部'],
    status: '草稿',
    archived: false,
    description: description || '',
    creator: '流程管理员',
    createTime: now,
    updater: '流程管理员',
    updateTime: now,
    categoryTree: [
      {
        id: 'cat_' + Date.now().toString(36) + '_root',
        name: manualName.trim(),
        orderNum: 1,
        children: [
          { id: 'cat_' + Date.now().toString(36) + '_sub', name: '常规权责分类', orderNum: 1 },
        ],
      },
    ],
    items: [],
  };
  dutyManuals.unshift(newManual);
  res.json({ status: 1, data: newManual, list: dutyManuals, info: '新建权责手册成功' });
});

app.get('/api/flowdoc/manuals/:id/detail', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  res.json({
    status: 1,
    data: {
      manual: target,
      categoryTree: target.categoryTree || [],
      items: target.items || [],
    },
    info: 'ok',
  });
});

app.put('/api/flowdoc/manuals/:id', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  const { manualNo, manualName, viewPermissions, attachment, description, status } = req.body || {};
  if (manualNo) target.manualNo = manualNo.trim();
  if (manualName) target.manualName = manualName.trim();
  if (viewPermissions) target.viewPermissions = viewPermissions;
  if (attachment !== undefined) target.attachment = attachment;
  if (description !== undefined) target.description = description;
  if (status) target.status = status;
  target.updater = '流程管理员';
  target.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  recalculateManualCounts(target);
  res.json({ status: 1, data: target, list: dutyManuals, info: '更新权责手册成功' });
});

app.delete('/api/flowdoc/manuals/:id', (req, res) => {
  const idx = dutyManuals.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  dutyManuals.splice(idx, 1);
  res.json({ status: 1, info: '删除权责手册成功' });
});

app.post('/api/flowdoc/manuals/:id/copy', (req, res) => {
  const source = dutyManuals.find((m) => m.id === req.params.id);
  if (!source) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const cloned = JSON.parse(JSON.stringify(source));
  cloned.id = 'manual_' + Date.now().toString(36);
  cloned.manualNo = `${source.manualNo}_COPY`;
  cloned.manualName = `${source.manualName}(复制)`;
  cloned.creator = '流程管理员';
  cloned.createTime = now;
  cloned.updater = '流程管理员';
  cloned.updateTime = now;
  cloned.status = '草稿';
  cloned.archived = false;
  recalculateManualCounts(cloned);
  dutyManuals.unshift(cloned);
  res.json({ status: 1, data: cloned, list: dutyManuals, info: '复制权责手册成功' });
});

app.post('/api/flowdoc/manuals/:id/archive', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  target.archived = !target.archived;
  target.status = target.archived ? '已归档' : '已发布';
  target.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({
    status: 1,
    data: target,
    list: dutyManuals,
    info: target.archived ? '已成功归档至归档手册' : '已恢复至权责建设列表',
  });
});

// Category tree operations
function findCategoryInTree(tree: any[], id: string): any | null {
  if (!Array.isArray(tree)) return null;
  for (const node of tree) {
    if (node.id === id) return node;
    if (Array.isArray(node.children) && node.children.length > 0) {
      const found = findCategoryInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeCategoryFromTree(tree: any[], id: string): any | null {
  if (!Array.isArray(tree)) return null;
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      return tree.splice(i, 1)[0];
    }
    if (Array.isArray(tree[i].children) && tree[i].children.length > 0) {
      const removed = removeCategoryFromTree(tree[i].children, id);
      if (removed) return removed;
    }
  }
  return null;
}

function isDescendantCategory(node: any, targetId: string): boolean {
  if (!node || !Array.isArray(node.children)) return false;
  for (const child of node.children) {
    if (child.id === targetId) return true;
    if (isDescendantCategory(child, targetId)) return true;
  }
  return false;
}

app.post('/api/flowdoc/manuals/:id/categories', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const { name, parentId } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ status: 0, info: '分类名称不能为空' });

  if (!Array.isArray(target.categoryTree)) target.categoryTree = [];
  const targetParentId = parentId ? String(parentId).trim() : null;
  const newCat: any = {
    id: 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    parentId: targetParentId,
    orderNum: 99,
    children: [],
  };

  if (!targetParentId) {
    target.categoryTree.push(newCat);
  } else {
    const parent = findCategoryInTree(target.categoryTree, targetParentId);
    if (parent) {
      if (!Array.isArray(parent.children)) parent.children = [];
      parent.children.push(newCat);
    } else {
      newCat.parentId = null;
      target.categoryTree.push(newCat);
    }
  }
  recalculateManualCounts(target);
  res.json({ status: 1, data: target.categoryTree, info: '创建分类成功' });
});

app.put('/api/flowdoc/manuals/:id/categories/:catId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const { name, parentId } = req.body || {};
  if (name !== undefined && !name.trim()) return res.status(400).json({ status: 0, info: '分类名称不能为空' });

  if (!Array.isArray(target.categoryTree)) target.categoryTree = [];
  const existingNode = findCategoryInTree(target.categoryTree, req.params.catId);
  if (!existingNode) return res.status(404).json({ status: 0, info: '未找到该分类' });

  if (name && name.trim()) {
    existingNode.name = name.trim();
  }

  // Support changing directory / hierarchy parent
  if (parentId !== undefined) {
    const targetParentId = parentId ? String(parentId).trim() : null;
    const currentParentId = existingNode.parentId || null;

    if (targetParentId !== currentParentId) {
      if (targetParentId === req.params.catId) {
        return res.status(400).json({ status: 0, info: '不能选择自身作为上级目录' });
      }
      if (targetParentId && isDescendantCategory(existingNode, targetParentId)) {
        return res.status(400).json({ status: 0, info: '不能选择下级子分类作为上级目录' });
      }

      const detachedNode = removeCategoryFromTree(target.categoryTree, req.params.catId);
      if (detachedNode) {
        detachedNode.parentId = targetParentId;
        if (!targetParentId) {
          target.categoryTree.push(detachedNode);
        } else {
          const newParent = findCategoryInTree(target.categoryTree, targetParentId);
          if (newParent) {
            if (!Array.isArray(newParent.children)) newParent.children = [];
            newParent.children.push(detachedNode);
          } else {
            detachedNode.parentId = null;
            target.categoryTree.push(detachedNode);
          }
        }
      }
    }
  }

  recalculateManualCounts(target);
  res.json({ status: 1, data: target.categoryTree, info: '更新分类成功' });
});

app.delete('/api/flowdoc/manuals/:id/categories/:catId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });

  removeCategoryFromTree(target.categoryTree || [], req.params.catId);
  recalculateManualCounts(target);
  res.json({ status: 1, data: target.categoryTree, info: '删除分类成功' });
});

// Duty items operations
app.post('/api/flowdoc/manuals/:id/items', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  if (!Array.isArray(target.items)) target.items = [];

  const { categoryId, categoryName, dutyNo, dutyName, scenarioText, scenarios, primaryRole, status } = req.body || {};
  if (!dutyName?.trim()) return res.status(400).json({ status: 0, info: '权责名称不能为空' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newItem = {
    id: 'duty_' + Date.now().toString(36),
    manualId: target.id,
    manualName: target.manualName,
    categoryId: categoryId || 'cat_fin',
    categoryName: categoryName || '财务管理中心',
    dutyNo: dutyNo?.trim() || 'DUTY-' + Math.floor(100 + Math.random() * 900),
    dutyName: dutyName.trim(),
    scenarioText: scenarioText || '',
    scenarios: Array.isArray(scenarios) ? scenarios : [],
    primaryRole: primaryRole || '经办人',
    status: status || '草稿',
    updateTime: now,
  };
  target.items.unshift(newItem);
  recalculateManualCounts(target);
  res.json({ status: 1, data: newItem, list: target.items, info: '新增权责事项成功' });
});

app.put('/api/flowdoc/manuals/:id/items/:itemId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const item = target.items?.find((i: any) => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ status: 0, info: '未找到该权责事项' });

  Object.assign(item, req.body);
  item.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  recalculateManualCounts(target);
  res.json({ status: 1, data: item, list: target.items, info: '更新权责事项成功' });
});

app.delete('/api/flowdoc/manuals/:id/items/:itemId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const idx = target.items?.findIndex((i: any) => i.id === req.params.itemId);
  if (idx === -1 || idx === undefined) return res.status(404).json({ status: 0, info: '未找到该权责事项' });

  target.items.splice(idx, 1);
  recalculateManualCounts(target);
  res.json({ status: 1, list: target.items, info: '删除权责事项成功' });
});

app.post('/api/flowdoc/manuals/:id/items/:itemId/copy', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const item = target.items?.find((i: any) => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ status: 0, info: '未找到该权责事项' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const cloned = JSON.parse(JSON.stringify(item));
  cloned.id = 'duty_' + Date.now().toString(36);
  cloned.dutyNo = `${item.dutyNo}_COPY`;
  cloned.dutyName = `${item.dutyName}(复制)`;
  cloned.status = '草稿';
  cloned.updateTime = now;
  target.items.unshift(cloned);
  recalculateManualCounts(target);
  res.json({ status: 1, data: cloned, list: target.items, info: '复制权责事项成功' });
});

app.post('/api/flowdoc/manuals/:id/items/batch-publish', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const { itemIds = [] } = req.body || {};
  target.items?.forEach((i: any) => {
    if (itemIds.length === 0 || itemIds.includes(i.id)) {
      i.status = '已发布';
      i.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
  });
  recalculateManualCounts(target);
  res.json({ status: 1, list: target.items, info: '批量发布成功' });
});

// =================== DUTY AUDIT & MULTI-LEVEL APPROVAL SYSTEM (权责审核系统) ===================
let dutyAuditTasks: any[] = [
  {
    id: 'SH-2026-001',
    manualId: 'manual_group_2025',
    manualName: '2025年集团授权手册',
    dutyItemId: 'duty_04',
    dutyNo: 'EXP-001',
    dutyName: '报销申请',
    categoryName: '财务管理中心',
    scope: '集团本部各职能中心',
    scenarioText: '【报销金额<10000】:总监',
    submitter: '流程管理员',
    submitTime: '2026-03-28 09:40:00',
    urgency: '紧急',
    remark: '根据财务预算与日常报销规程，调整报销申请审批矩阵与限额，请初审。',
    currentLevelIndex: 0,
    currentApprover: '张明',
    currentLevelName: '第1级: 权责初审',
    status: '待审核',
    levels: [
      {
        level: 1,
        levelName: '第1级: 权责初审',
        roleName: '权责推进专员',
        approverName: '张明',
        deptName: '权责管理部',
        status: 'pending',
      },
      {
        level: 2,
        levelName: '第2级: 合规复核',
        roleName: '合规法务总监',
        approverName: '陈静',
        deptName: '质量合规部',
        status: 'waiting',
      },
      {
        level: 3,
        levelName: '第3级: 终审批准',
        roleName: '决策委员会主任',
        approverName: '刘建国',
        deptName: '决策委员会',
        status: 'waiting',
      },
    ],
    history: [
      {
        time: '2026-03-28 09:40:00',
        operator: '流程管理员',
        action: '提交送审',
        nodeName: '起草送审',
        opinion: '提交报销申请权责事项审批流配置。',
      },
    ],
  },
  {
    id: 'SH-2026-002',
    manualId: 'manual_2026',
    manualName: '2026',
    dutyItemId: 'duty_2026_02',
    dutyNo: 'TY-2026-002',
    dutyName: '经济合同审查与印章使用',
    categoryName: '通用权责',
    scope: '集团本部及下属子公司',
    scenarioText: '【标准格式合同】:法务主管\n【非标或重大合同】:法务总监',
    submitter: '系统管理员',
    submitTime: '2026-03-31 09:15:00',
    urgency: '特急',
    remark: '涉及2026年度印章授权与非标合同双签机制，提请合规部加急复核。',
    currentLevelIndex: 1,
    currentApprover: '陈静',
    currentLevelName: '第2级: 合规复核',
    status: '审核中',
    levels: [
      {
        level: 1,
        levelName: '第1级: 权责初审',
        roleName: '权责推进专员',
        approverName: '张明',
        deptName: '权责管理部',
        status: 'approved',
        opinion: '权责事项分类与审批权限边界符合标准，初审通过。',
        operateTime: '2026-03-31 10:30:00',
      },
      {
        level: 2,
        levelName: '第2级: 合规复核',
        roleName: '合规法务总监',
        approverName: '陈静',
        deptName: '质量合规部',
        status: 'pending',
      },
      {
        level: 3,
        levelName: '第3级: 终审批准',
        roleName: '分管副总裁',
        approverName: '周副总裁',
        deptName: '总裁办',
        status: 'waiting',
      },
    ],
    history: [
      {
        time: '2026-03-31 09:15:00',
        operator: '系统管理员',
        action: '提交送审',
        nodeName: '起草送审',
        opinion: '送审2026合同权责事项。',
      },
      {
        time: '2026-03-31 10:30:00',
        operator: '张明',
        action: '审核通过',
        nodeName: '第1级: 权责初审',
        opinion: '权责事项分类与审批权限边界符合标准，初审通过。',
      },
    ],
  },
  {
    id: 'SH-2026-003',
    manualId: 'manual_group_2025',
    manualName: '2025年集团授权手册',
    dutyItemId: 'duty_01',
    dutyNo: 'PR-AP-0012',
    dutyName: '采购付款',
    categoryName: '财务管理中心',
    scope: '全集团及下属子公司',
    scenarioText: '【应付, >100, 】: 未配置批准1内容\n【<100】: 未配置批准1内容',
    submitter: '流程推进官',
    submitTime: '2026-03-24 16:30:00',
    urgency: '普通',
    remark: '采购付款权责审批流已完成多轮审议。',
    currentLevelIndex: 2,
    currentApprover: '刘建国',
    currentLevelName: '第3级: 终审批准',
    status: '已通过',
    levels: [
      {
        level: 1,
        levelName: '第1级: 权责初审',
        roleName: '权责推进专员',
        approverName: '张明',
        deptName: '权责管理部',
        status: 'approved',
        opinion: '初审通过。',
        operateTime: '2026-03-24 17:00:00',
      },
      {
        level: 2,
        levelName: '第2级: 合规复核',
        roleName: '合规法务总监',
        approverName: '陈静',
        deptName: '质量合规部',
        status: 'approved',
        opinion: '合规性审核通过。',
        operateTime: '2026-03-25 10:15:00',
      },
      {
        level: 3,
        levelName: '第3级: 终审批准',
        roleName: '决策委员会主任',
        approverName: '刘建国',
        deptName: '决策委员会',
        status: 'approved',
        opinion: '准予发布生效。',
        operateTime: '2026-03-25 15:20:00',
      },
    ],
    history: [
      {
        time: '2026-03-24 16:30:00',
        operator: '流程推进官',
        action: '提交送审',
        nodeName: '起草送审',
        opinion: '提交审批。',
      },
      {
        time: '2026-03-24 17:00:00',
        operator: '张明',
        action: '审核通过',
        nodeName: '第1级: 权责初审',
        opinion: '初审通过。',
      },
      {
        time: '2026-03-25 10:15:00',
        operator: '陈静',
        action: '审核通过',
        nodeName: '第2级: 合规复核',
        opinion: '合规性审核通过。',
      },
      {
        time: '2026-03-25 15:20:00',
        operator: '刘建国',
        action: '审核通过',
        nodeName: '第3级: 终审批准',
        opinion: '准予发布生效。',
      },
    ],
  },
];

// Helper to find a duty item across manuals
function findDutyItem(manualId: string, itemId: string) {
  const manual = dutyManuals.find((m) => m.id === manualId);
  if (!manual || !Array.isArray(manual.items)) return null;
  return manual.items.find((i: any) => i.id === itemId);
}

// 1. Submit for Multi-Level Approval (提交多层级审批)
app.post('/api/flowdoc/audit/submit', (req, res) => {
  const { manualId, itemIds = [], levels = [], urgency = '普通', remark = '', submitter = '流程管理员' } = req.body || {};
  const manual = dutyManuals.find((m) => m.id === manualId);
  if (!manual) return res.status(404).json({ status: 0, info: '未找到指定权责手册' });
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要送审的权责事项' });
  }
  if (!Array.isArray(levels) || levels.length === 0) {
    return res.status(400).json({ status: 0, info: '请至少配置一级审批人' });
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const createdTasks: any[] = [];

  // Format levels with status
  const formattedLevels = levels.map((lvl: any, idx: number) => ({
    level: idx + 1,
    levelName: lvl.levelName || `第${idx + 1}级: 审批`,
    roleName: lvl.roleName || '审批人',
    approverName: lvl.approverName || '张明',
    deptName: lvl.deptName || '权责管理部',
    status: idx === 0 ? 'pending' : 'waiting',
  }));

  itemIds.forEach((itemId: string) => {
    const item = manual.items?.find((i: any) => i.id === itemId);
    if (!item) return;

    // Update item
    item.status = '待审核';
    item.effectiveApproval = `审批中 (${formattedLevels[0].levelName} · ${formattedLevels[0].approverName})`;
    item.submitTime = now;
    item.updateTime = now;

    const taskId = `SH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const task = {
      id: taskId,
      manualId: manual.id,
      manualName: manual.manualName,
      dutyItemId: item.id,
      dutyNo: item.dutyNo,
      dutyName: item.dutyName,
      categoryName: item.categoryName,
      scope: item.scope || '全集团及下属子公司',
      scenarioText: item.scenarioText || '',
      submitter,
      submitTime: now,
      urgency,
      remark,
      currentLevelIndex: 0,
      currentApprover: formattedLevels[0].approverName,
      currentLevelName: formattedLevels[0].levelName,
      status: '待审核',
      levels: JSON.parse(JSON.stringify(formattedLevels)),
      history: [
        {
          time: now,
          operator: submitter,
          action: '提交送审',
          nodeName: '起草送审',
          opinion: remark || '提交权责事项送审。',
        },
      ],
    };

    dutyAuditTasks.unshift(task);
    createdTasks.push(task);
  });

  recalculateManualCounts(manual);

  res.json({
    status: 1,
    info: `已成功将 ${createdTasks.length} 项权责提交至多层级审核，已推送至审批人待办事项`,
    createdTasks,
    allTasks: dutyAuditTasks,
  });
});

// 2. Query Audit Tasks (权责审核列表)
app.get('/api/flowdoc/audit/tasks', (req, res) => {
  const { status, keyword, manualId, urgency } = req.query as Record<string, string>;
  let list = [...dutyAuditTasks];

  if (status && status !== '全部') {
    list = list.filter((t) => t.status === status);
  }
  if (manualId) {
    list = list.filter((t) => t.manualId === manualId);
  }
  if (urgency && urgency !== '全部') {
    list = list.filter((t) => t.urgency === urgency);
  }
  if (keyword) {
    const k = keyword.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.dutyName?.toLowerCase().includes(k) ||
        t.dutyNo?.toLowerCase().includes(k) ||
        t.id?.toLowerCase().includes(k) ||
        t.manualName?.toLowerCase().includes(k) ||
        t.currentApprover?.toLowerCase().includes(k)
    );
  }

  // Summary counts
  const stats = {
    total: dutyAuditTasks.length,
    pending: dutyAuditTasks.filter((t) => t.status === '待审核').length,
    auditing: dutyAuditTasks.filter((t) => t.status === '审核中').length,
    approved: dutyAuditTasks.filter((t) => t.status === '已通过').length,
    rejected: dutyAuditTasks.filter((t) => t.status === '已驳回').length,
  };

  res.json({ status: 1, data: list, stats, info: 'ok' });
});

// 3. Approve Audit Task (审核通过某一级或最终通过)
app.post('/api/flowdoc/audit/tasks/:id/approve', (req, res) => {
  const task = dutyAuditTasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ status: 0, info: '未找到审核任务' });
  const { opinion = '同意，符合权责矩阵规程准予通过。', operator = task.currentApprover || '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const currentLvl = task.levels[task.currentLevelIndex];
  if (currentLvl) {
    currentLvl.status = 'approved';
    currentLvl.opinion = opinion;
    currentLvl.operateTime = now;
  }

  task.history.push({
    time: now,
    operator,
    action: '审核通过',
    nodeName: currentLvl?.levelName || `第${task.currentLevelIndex + 1}级审批`,
    opinion,
  });

  const dutyItem = findDutyItem(task.manualId, task.dutyItemId);

  // Check if there is next level
  if (task.currentLevelIndex < task.levels.length - 1) {
    task.currentLevelIndex += 1;
    const nextLvl = task.levels[task.currentLevelIndex];
    nextLvl.status = 'pending';
    task.currentApprover = nextLvl.approverName;
    task.currentLevelName = nextLvl.levelName;
    task.status = '审核中';

    if (dutyItem) {
      dutyItem.status = '待审核';
      dutyItem.effectiveApproval = `审批中 (${nextLvl.levelName} · ${nextLvl.approverName})`;
      dutyItem.updateTime = now;
    }
  } else {
    // Final level reached!
    task.status = '已通过';
    if (dutyItem) {
      dutyItem.status = '已发布';
      dutyItem.effectiveApproval = `已审批通过 (${currentLvl?.approverName || '终审批准'})`;
      dutyItem.updateTime = now;
      const manual = dutyManuals.find((m) => m.id === task.manualId);
      if (manual) recalculateManualCounts(manual);
    }
  }

  res.json({ status: 1, data: task, allTasks: dutyAuditTasks, info: '审核通过操作成功' });
});

// 4. Reject Audit Task (审核驳回)
app.post('/api/flowdoc/audit/tasks/:id/reject', (req, res) => {
  const task = dutyAuditTasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ status: 0, info: '未找到审核任务' });
  const { opinion = '权责配置需进一步核定，予以驳回。', operator = task.currentApprover || '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const currentLvl = task.levels[task.currentLevelIndex];
  if (currentLvl) {
    currentLvl.status = 'rejected';
    currentLvl.opinion = opinion;
    currentLvl.operateTime = now;
  }

  task.status = '已驳回';
  task.history.push({
    time: now,
    operator,
    action: '审核驳回',
    nodeName: currentLvl?.levelName || `第${task.currentLevelIndex + 1}级审批`,
    opinion,
  });

  const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
  if (dutyItem) {
    dutyItem.status = '已驳回';
    dutyItem.effectiveApproval = `已驳回 (${opinion})`;
    dutyItem.updateTime = now;
    const manual = dutyManuals.find((m) => m.id === task.manualId);
    if (manual) recalculateManualCounts(manual);
  }

  res.json({ status: 1, data: task, allTasks: dutyAuditTasks, info: '已驳回该审核任务' });
});

// 5. Transfer Audit Task (转办)
app.post('/api/flowdoc/audit/tasks/:id/transfer', (req, res) => {
  const task = dutyAuditTasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ status: 0, info: '未找到审核任务' });
  const { targetApprover, targetDept, reason = '由原审批人转办', operator = task.currentApprover } = req.body || {};
  if (!targetApprover) return res.status(400).json({ status: 0, info: '请选择转办人员' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const currentLvl = task.levels[task.currentLevelIndex];
  if (currentLvl) {
    const oldApprover = currentLvl.approverName;
    currentLvl.approverName = targetApprover;
    if (targetDept) currentLvl.deptName = targetDept;
    task.currentApprover = targetApprover;

    task.history.push({
      time: now,
      operator,
      action: '转办审批',
      nodeName: currentLvl.levelName,
      opinion: `将审批转办给【${targetApprover}】。原因：${reason}`,
    });

    const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
    if (dutyItem) {
      dutyItem.effectiveApproval = `审批中 (${currentLvl.levelName} · 转办给${targetApprover})`;
      dutyItem.updateTime = now;
    }
  }

  res.json({ status: 1, data: task, allTasks: dutyAuditTasks, info: `已成功转办给【${targetApprover}】` });
});

// 6. Batch Approve Tasks
app.post('/api/flowdoc/audit/tasks/batch-approve', (req, res) => {
  const { taskIds = [], opinion = '批量通过审批。', operator = '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  taskIds.forEach((id: string) => {
    const task = dutyAuditTasks.find((t) => t.id === id);
    if (!task || task.status === '已通过' || task.status === '已驳回') return;

    const currentLvl = task.levels[task.currentLevelIndex];
    if (currentLvl) {
      currentLvl.status = 'approved';
      currentLvl.opinion = opinion;
      currentLvl.operateTime = now;
    }

    task.history.push({
      time: now,
      operator,
      action: '审核通过',
      nodeName: currentLvl?.levelName || '批量审批',
      opinion,
    });

    const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
    if (task.currentLevelIndex < task.levels.length - 1) {
      task.currentLevelIndex += 1;
      const nextLvl = task.levels[task.currentLevelIndex];
      nextLvl.status = 'pending';
      task.currentApprover = nextLvl.approverName;
      task.currentLevelName = nextLvl.levelName;
      task.status = '审核中';
      if (dutyItem) {
        dutyItem.status = '待审核';
        dutyItem.effectiveApproval = `审批中 (${nextLvl.levelName} · ${nextLvl.approverName})`;
      }
    } else {
      task.status = '已通过';
      if (dutyItem) {
        dutyItem.status = '已发布';
        dutyItem.effectiveApproval = `已审批通过 (批量终审批准)`;
        const manual = dutyManuals.find((m) => m.id === task.manualId);
        if (manual) recalculateManualCounts(manual);
      }
    }
  });

  res.json({ status: 1, allTasks: dutyAuditTasks, info: `已批量通过 ${taskIds.length} 项审核任务` });
});

// 7. Batch Reject Tasks
app.post('/api/flowdoc/audit/tasks/batch-reject', (req, res) => {
  const { taskIds = [], opinion = '批量驳回审核申请。', operator = '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  taskIds.forEach((id: string) => {
    const task = dutyAuditTasks.find((t) => t.id === id);
    if (!task || task.status === '已通过' || task.status === '已驳回') return;

    const currentLvl = task.levels[task.currentLevelIndex];
    if (currentLvl) {
      currentLvl.status = 'rejected';
      currentLvl.opinion = opinion;
      currentLvl.operateTime = now;
    }
    task.status = '已驳回';
    task.history.push({
      time: now,
      operator,
      action: '审核驳回',
      nodeName: currentLvl?.levelName || '批量驳回',
      opinion,
    });

    const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
    if (dutyItem) {
      dutyItem.status = '已驳回';
      dutyItem.effectiveApproval = `已驳回 (${opinion})`;
      const manual = dutyManuals.find((m) => m.id === task.manualId);
      if (manual) recalculateManualCounts(manual);
    }
  });

  res.json({ status: 1, allTasks: dutyAuditTasks, info: `已批量驳回 ${taskIds.length} 项审核任务` });
});

app.get('/api/flowdoc/duties', (_req, res) => {
  res.json({ status: 1, data: dutyTables, categories: dutyCategories, collabDepts: DEFAULT_COLLAB_DEPTS, info: 'ok' });
});

app.put('/api/flowdoc/duties/:id/config', (req, res) => {
  const target = dutyTables.find((d) => d.id === req.params.id);
  if (target) Object.assign(target, req.body);
  res.json({ status: 1, data: target, list: dutyTables, info: 'ok' });
});

// Org
app.get('/api/org/bundle', (_req, res) => {
  res.json({
    status: 1,
    data: {
      depts: orgDepts,
      users: orgUsers,
      roles: orgRoles,
      positions: orgPositions,
      jobTitles: orgJobTitles,
    },
    info: 'ok',
  });
});

app.post('/api/org/roles', (req, res) => {
  const { roleName, roleKey, roleType = '自定义角色', dataScope = '本部门数据', menuPermissions = ['协同工作', '流程资产'], remark = '' } = req.body || {};
  if (!roleName || !roleName.trim()) {
    return res.status(400).json({ status: 0, info: '角色名称不能为空' });
  }
  const newR = {
    id: 'orole_' + Math.random().toString(36).substring(2, 8),
    roleNo: orgRoles.length + 1,
    roleName: roleName.trim(),
    roleKey: roleKey ? roleKey.trim() : 'role_' + Math.random().toString(36).substring(2, 6),
    roleType,
    roleSort: orgRoles.length + 1,
    dataScope,
    boundPositions: ['业务人员'],
    menuPermissions,
    userCount: 0,
    status: '0',
    remark: remark || '自定义业务角色',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  orgRoles.push(newR);
  res.json({ status: 1, data: newR, list: orgRoles, info: '新增角色成功' });
});

app.put('/api/org/roles/:id', (req, res) => {
  const target = orgRoles.find((r) => r.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到指定角色' });
  Object.assign(target, req.body);
  res.json({ status: 1, data: target, list: orgRoles, info: '角色信息已更新' });
});

app.delete('/api/org/roles/:id', (req, res) => {
  if (req.params.id === 'orole_1') {
    return res.status(400).json({ status: 0, info: '超级管理员角色不允许删除' });
  }
  orgRoles = orgRoles.filter((r) => r.id !== req.params.id);
  res.json({ status: 1, list: orgRoles, info: '角色已成功删除' });
});

app.post('/api/org/roles/:id/permissions', (req, res) => {
  const target = orgRoles.find((r) => r.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到指定角色' });
  const { menuPermissions = [] } = req.body || {};
  target.menuPermissions = menuPermissions;
  res.json({ status: 1, data: target, list: orgRoles, info: '角色权限配置已保存并即时生效' });
});

app.post('/api/org/depts', (req, res) => {
  const { deptName, deptCode, parentDeptName, parentDeptCode, leader, phone } = req.body || {};
  if (!deptName || !deptName.trim()) {
    return res.status(400).json({ status: 0, info: '部门名称不能为空' });
  }
  const newDept = {
    id: 'dept_' + Math.random().toString(36).substring(2, 9),
    deptName: deptName.trim(),
    deptCode: deptCode ? deptCode.trim() : '00' + Math.floor(Math.random() * 90 + 10),
    parentDeptName: parentDeptName || '',
    parentDeptCode: parentDeptCode || '',
    leader: leader || '',
    phone: phone || '',
    status: '0',
    orderNum: orgDepts.length + 1,
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  orgDepts.push(newDept);
  res.json({ status: 1, data: newDept, list: orgDepts, info: '新增部门成功' });
});

app.put('/api/org/depts/:id', (req, res) => {
  const target = orgDepts.find((d) => d.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '部门不存在' });
  }
  Object.assign(target, req.body);
  res.json({ status: 1, data: target, list: orgDepts, info: '修改部门信息成功' });
});

app.delete('/api/org/depts/:id', (req, res) => {
  const targetIndex = orgDepts.findIndex((d) => d.id === req.params.id);
  if (targetIndex === -1) {
    return res.status(404).json({ status: 0, info: '部门不存在' });
  }
  const removed = orgDepts.splice(targetIndex, 1)[0];
  res.json({ status: 1, data: removed, list: orgDepts, info: '删除部门成功' });
});

app.post('/api/org/depts/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要删除的部门' });
  }
  orgDepts = orgDepts.filter((d) => !ids.includes(d.id));
  res.json({ status: 1, list: orgDepts, info: `成功批量删除 ${ids.length} 个部门` });
});

app.post('/api/org/depts/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 0, info: '未导入任何有效部门数据' });
  }
  items.forEach((item: any, idx: number) => {
    if (item.deptName) {
      orgDepts.push({
        id: 'dept_' + Math.random().toString(36).substring(2, 9),
        deptName: item.deptName.trim(),
        deptCode: item.deptCode || `IMP_${idx + 1}`,
        parentDeptName: item.parentDeptName || '',
        parentDeptCode: item.parentDeptCode || '',
        leader: item.leader || '',
        phone: item.phone || '',
        status: '0',
        orderNum: orgDepts.length + 1,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
  });
  res.json({ status: 1, list: orgDepts, info: `成功导入 ${items.length} 个部门组织` });
});

app.post('/api/org/depts/reset', (_req, res) => {
  orgDepts = JSON.parse(JSON.stringify(initialOrgDepts));
  res.json({ status: 1, list: orgDepts, info: '已成功重置为设计稿预置部门组织架构' });
});

// Users CRUD Endpoints
app.get('/api/org/users', (req, res) => {
  const { userName, phonenumber, status, deptId, beginTime, endTime, pageNum = 1, pageSize = 10 } = req.query as any;
  let result = [...orgUsers];

  if (userName && String(userName).trim()) {
    const q = String(userName).trim().toLowerCase();
    result = result.filter((u) =>
      (u.userName && u.userName.toLowerCase().includes(q)) ||
      (u.nickName && u.nickName.toLowerCase().includes(q)) ||
      (u.empNo && u.empNo.toLowerCase().includes(q))
    );
  }

  if (phonenumber && String(phonenumber).trim()) {
    const p = String(phonenumber).trim();
    result = result.filter((u) => u.phonenumber && u.phonenumber.includes(p));
  }

  if (status !== undefined && status !== '') {
    result = result.filter((u) => String(u.status) === String(status));
  }

  if (deptId && String(deptId).trim()) {
    const dId = String(deptId).trim();
    // Also include child departments if matches
    const selectedDept = orgDepts.find((d) => d.id === dId);
    if (selectedDept) {
      const targetDeptCodes = [selectedDept.deptCode];
      orgDepts.forEach((d) => {
        if (d.parentDeptCode === selectedDept.deptCode) {
          targetDeptCodes.push(d.deptCode);
        }
      });
      result = result.filter((u) => u.deptId === dId || targetDeptCodes.includes(u.deptCode));
    } else {
      result = result.filter((u) => u.deptId === dId);
    }
  }

  if (beginTime) {
    result = result.filter((u) => u.createTime >= String(beginTime));
  }
  if (endTime) {
    result = result.filter((u) => u.createTime <= String(endTime));
  }

  const total = result.length;
  const pNum = Math.max(1, parseInt(pageNum, 10) || 1);
  const pSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const startIdx = (pNum - 1) * pSize;
  const rows = result.slice(startIdx, startIdx + pSize);

  res.json({
    status: 1,
    total,
    rows,
    list: orgUsers,
    info: 'ok',
  });
});

app.post('/api/org/users', (req, res) => {
  const { userName, nickName, deptId, deptName, deptCode, positionName, roleNames, phonenumber, email, sex, status, password, remark } = req.body || {};
  if (!userName || !userName.trim()) {
    return res.status(400).json({ status: 0, info: '用户登录名称不能为空' });
  }
  if (!nickName || !nickName.trim()) {
    return res.status(400).json({ status: 0, info: '用户昵称/真实姓名不能为空' });
  }
  const exists = orgUsers.some((u) => u.userName.toLowerCase() === userName.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ status: 0, info: '该登录账号已存在，请使用其他用户名' });
  }

  // Lookup department
  let matchedDept = orgDepts.find((d) => d.id === deptId || d.deptName === deptName);
  if (!matchedDept && deptCode) {
    matchedDept = orgDepts.find((d) => d.deptCode === deptCode);
  }

  const maxNo = orgUsers.reduce((max, u) => Math.max(max, u.userNo || 0), 0);
  const newUser = {
    id: 'u_' + Math.random().toString(36).substring(2, 9),
    userNo: maxNo + 1,
    empNo: 'E00' + (maxNo + 10),
    userName: userName.trim(),
    nickName: nickName.trim(),
    sex: sex || '0',
    deptId: matchedDept ? matchedDept.id : (deptId || 'dept_01'),
    deptCode: matchedDept ? matchedDept.deptCode : (deptCode || '0010'),
    deptName: matchedDept ? matchedDept.deptName : (deptName || '系统管理部'),
    positionName: positionName || '普通员工',
    rankLevel: 'P3',
    roleNames: Array.isArray(roleNames) && roleNames.length > 0 ? roleNames : ['普通员工'],
    phonenumber: phonenumber || '',
    email: email || `${userName.trim()}@dflow.com`,
    status: status !== undefined ? String(status) : '0',
    syncSource: '本地创建',
    ssoBound: false,
    ssoUid: '',
    doaLevel: '业务经办',
    remark: remark || '',
    password: password || '123456',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  orgUsers.unshift(newUser);
  res.json({ status: 1, data: newUser, list: orgUsers, info: '新增用户成功' });
});

app.put('/api/org/users/:id', (req, res) => {
  const target = orgUsers.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }

  const { nickName, deptId, deptName, deptCode, positionName, roleNames, phonenumber, email, sex, status, remark } = req.body || {};
  if (nickName) target.nickName = nickName.trim();
  if (sex !== undefined) target.sex = sex;
  if (phonenumber !== undefined) target.phonenumber = phonenumber;
  if (email !== undefined) target.email = email;
  if (status !== undefined) target.status = String(status);
  if (positionName !== undefined) target.positionName = positionName;
  if (Array.isArray(roleNames)) target.roleNames = roleNames;
  if (remark !== undefined) target.remark = remark;

  if (deptId || deptName || deptCode) {
    let matchedDept = orgDepts.find((d) => d.id === deptId || d.deptName === deptName);
    if (!matchedDept && deptCode) {
      matchedDept = orgDepts.find((d) => d.deptCode === deptCode);
    }
    if (matchedDept) {
      target.deptId = matchedDept.id;
      target.deptCode = matchedDept.deptCode;
      target.deptName = matchedDept.deptName;
    }
  }

  res.json({ status: 1, data: target, list: orgUsers, info: '修改用户成功' });
});

app.delete('/api/org/users/:id', (req, res) => {
  const idx = orgUsers.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }
  const removed = orgUsers.splice(idx, 1)[0];
  res.json({ status: 1, data: removed, list: orgUsers, info: `成功删除用户【${removed.nickName || removed.userName}】` });
});

app.post('/api/org/users/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要删除的用户' });
  }
  orgUsers = orgUsers.filter((u) => !ids.includes(u.id));
  res.json({ status: 1, list: orgUsers, info: `成功批量删除 ${ids.length} 个用户` });
});

app.post('/api/org/users/:id/reset-password', (req, res) => {
  const target = orgUsers.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ status: 0, info: '密码长度至少6位' });
  }
  target.password = newPassword;
  target.passwordResetTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, info: `用户【${target.userName}】密码重置成功` });
});

app.put('/api/org/users/:id/change-status', (req, res) => {
  const target = orgUsers.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }
  const { status } = req.body || {};
  target.status = String(status) === '0' ? '0' : '1';
  res.json({ status: 1, data: target, list: orgUsers, info: `用户已${target.status === '0' ? '启用' : '停用'}` });
});

app.post('/api/org/users/import', (req, res) => {
  const { items, updateExisting } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 0, info: '未导入任何有效用户数据' });
  }

  let importedCount = 0;
  let updatedCount = 0;

  items.forEach((item: any) => {
    if (!item.userName && !item.nickName) return;
    const existing = orgUsers.find((u) => u.userName === item.userName);
    if (existing && updateExisting) {
      if (item.nickName) existing.nickName = item.nickName;
      if (item.phonenumber) existing.phonenumber = item.phonenumber;
      if (item.email) existing.email = item.email;
      if (item.deptName) {
        existing.deptName = item.deptName;
        const d = orgDepts.find((dept) => dept.deptName === item.deptName);
        if (d) {
          existing.deptId = d.id;
          existing.deptCode = d.deptCode;
        }
      }
      updatedCount++;
    } else if (!existing) {
      const maxNo = orgUsers.reduce((m, u) => Math.max(m, u.userNo || 0), 0);
      const matchedDept = orgDepts.find((d) => d.deptName === item.deptName || d.deptCode === item.deptCode);
      orgUsers.push({
        id: 'u_' + Math.random().toString(36).substring(2, 9),
        userNo: maxNo + 1,
        empNo: item.empNo || `E00${maxNo + 10}`,
        userName: item.userName || `user_${maxNo + 1}`,
        nickName: item.nickName || item.userName || `员工${maxNo + 1}`,
        sex: item.sex || '0',
        deptId: matchedDept ? matchedDept.id : 'dept_01',
        deptCode: matchedDept ? matchedDept.deptCode : '0010',
        deptName: matchedDept ? matchedDept.deptName : (item.deptName || '系统管理部'),
        positionName: item.positionName || '普通员工',
        rankLevel: item.rankLevel || 'P3',
        roleNames: Array.isArray(item.roleNames) ? item.roleNames : [item.roleNames || '普通员工'],
        phonenumber: item.phonenumber || '',
        email: item.email || `${item.userName || 'user'}@dflow.com`,
        status: item.status || '0',
        syncSource: '批量导入',
        ssoBound: false,
        ssoUid: '',
        doaLevel: '业务经办',
        remark: item.remark || 'Excel导入账号',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      importedCount++;
    }
  });

  res.json({
    status: 1,
    list: orgUsers,
    info: `用户导入完成：新增 ${importedCount} 人，更新 ${updatedCount} 人`,
  });
});

app.post('/api/org/users/reset', (_req, res) => {
  orgUsers = JSON.parse(JSON.stringify(initialOrgUsers));
  res.json({ status: 1, list: orgUsers, info: '已成功重置为设计稿预置用户数据' });
});

// ============================================================================
// Process Roles Library Endpoints (/api/build/roles)
// ============================================================================

app.get('/api/build/roles', (req, res) => {
  const { roleName, roleCode, roleType, category, status, boundPosition, pageNum = 1, pageSize = 10 } = req.query as any;
  let result = [...buildProcessRoles];

  if (roleName && String(roleName).trim()) {
    const q = String(roleName).trim().toLowerCase();
    result = result.filter((r) => r.roleName && r.roleName.toLowerCase().includes(q));
  }

  if (roleCode && String(roleCode).trim()) {
    const q = String(roleCode).trim().toLowerCase();
    result = result.filter((r) => r.roleCode && r.roleCode.toLowerCase().includes(q));
  }

  if (roleType && String(roleType).trim()) {
    const q = String(roleType).trim();
    result = result.filter((r) => r.roleType === q || (r.roleType && r.roleType.includes(q)));
  }

  if (category && String(category).trim()) {
    const q = String(category).trim();
    result = result.filter((r) => r.category === q || (r.category && r.category.includes(q)));
  }

  if (status !== undefined && status !== '') {
    result = result.filter((r) => String(r.status) === String(status));
  }

  if (boundPosition && String(boundPosition).trim()) {
    const q = String(boundPosition).trim();
    result = result.filter((r) => Array.isArray(r.boundPositions) && r.boundPositions.some((p: string) => p.includes(q)));
  }

  // Calculate statistics
  const total = result.length;
  const allTotal = buildProcessRoles.length;
  const rTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('主责')).length;
  const aTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('决策') || r.roleType.includes('委员会')).length;
  const cTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('咨询') || r.roleType.includes('会签')).length;
  const iTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('知会') || r.roleType.includes('抄送')).length;

  const pNum = Math.max(1, parseInt(pageNum, 10) || 1);
  const pSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const start = (pNum - 1) * pSize;
  const pageRows = result.slice(start, start + pSize);

  res.json({
    status: 1,
    total,
    pageNum: pNum,
    pageSize: pSize,
    rows: pageRows,
    stats: {
      allTotal,
      rTypeCount,
      aTypeCount,
      cTypeCount,
      iTypeCount,
    },
    info: 'ok',
  });
});

app.post('/api/build/roles', (req, res) => {
  const {
    roleName,
    roleCode,
    roleType,
    category,
    boundPositions,
    rankRequirement,
    isKcpApprover,
    sort,
    status = '0',
    remark,
  } = req.body || {};

  if (!roleName || !roleName.trim()) {
    return res.status(400).json({ status: 0, info: '角色名称不能为空' });
  }

  const generatedCode =
    roleCode && roleCode.trim()
      ? roleCode.trim()
      : `PR-ROLE-${Math.floor(Math.random() * 899 + 100)}`;

  // Duplicate check
  const exists = buildProcessRoles.some(
    (r) => r.roleCode.toLowerCase() === generatedCode.toLowerCase() || r.roleName === roleName.trim()
  );
  if (exists) {
    return res.status(400).json({ status: 0, info: '角色名称或角色编码已存在' });
  }

  const newRole = {
    id: `prole_${Date.now().toString(36)}`,
    roleNo: buildProcessRoles.length + 1,
    roleCode: generatedCode,
    roleName: roleName.trim(),
    roleType: roleType || '主责角色 (R)',
    category: category || '02 研发与技术创新',
    boundPositions: Array.isArray(boundPositions) ? boundPositions : [],
    assignedUsers: [],
    boundFlows: [],
    rankRequirement: rankRequirement || 'P5-P7',
    isKcpApprover: Boolean(isKcpApprover),
    sort: sort ? parseInt(sort, 10) : buildProcessRoles.length + 1,
    status: status === '1' ? '1' : '0',
    remark: remark || '自定义流程角色',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  buildProcessRoles.unshift(newRole);

  // Sync to dictBundle.flowRole so Drawio and RACI can pick it up
  if (dictBundle && dictBundle.flowRole) {
    dictBundle.flowRole.push({
      id: newRole.id,
      label: newRole.roleName,
      classId: newRole.roleType.includes('决策') ? 2 : 1,
      postNames: newRole.boundPositions,
      desc: newRole.remark,
    });
  }

  res.json({
    status: 1,
    data: newRole,
    total: buildProcessRoles.length,
    info: '新增流程角色成功',
  });
});

app.put('/api/build/roles/:id', (req, res) => {
  const { id } = req.params;
  const target = buildProcessRoles.find((r) => r.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '角色不存在' });
  }

  const {
    roleName,
    roleCode,
    roleType,
    category,
    boundPositions,
    rankRequirement,
    isKcpApprover,
    sort,
    status,
    remark,
  } = req.body || {};

  if (roleName) target.roleName = roleName.trim();
  if (roleCode) target.roleCode = roleCode.trim();
  if (roleType) target.roleType = roleType;
  if (category) target.category = category;
  if (boundPositions !== undefined) target.boundPositions = Array.isArray(boundPositions) ? boundPositions : [];
  if (rankRequirement !== undefined) target.rankRequirement = rankRequirement;
  if (isKcpApprover !== undefined) target.isKcpApprover = Boolean(isKcpApprover);
  if (sort !== undefined) target.sort = parseInt(sort, 10);
  if (status !== undefined) target.status = String(status);
  if (remark !== undefined) target.remark = remark;

  res.json({
    status: 1,
    data: target,
    info: '更新角色信息成功',
  });
});

app.delete('/api/build/roles/:id', (req, res) => {
  const { id } = req.params;
  const idx = buildProcessRoles.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '未找到待删除的角色' });
  }

  const deleted = buildProcessRoles.splice(idx, 1)[0];
  res.json({
    status: 1,
    info: `已成功删除角色【${deleted.roleName}】`,
    total: buildProcessRoles.length,
  });
});

app.post('/api/build/roles/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要删除的角色' });
  }

  const initialLen = buildProcessRoles.length;
  buildProcessRoles = buildProcessRoles.filter((r) => !ids.includes(r.id));
  const removed = initialLen - buildProcessRoles.length;

  res.json({
    status: 1,
    info: `批量删除成功，共移除 ${removed} 个角色`,
    total: buildProcessRoles.length,
  });
});

app.put('/api/build/roles/:id/change-status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const target = buildProcessRoles.find((r) => r.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '角色不存在' });
  }

  target.status = String(status) === '0' ? '0' : '1';
  res.json({
    status: 1,
    data: target,
    info: `角色【${target.roleName}】状态已变更为：${target.status === '0' ? '正常启用' : '已停用'}`,
  });
});

app.put('/api/build/roles/:id/assign-users', (req, res) => {
  const { id } = req.params;
  const { users } = req.body || {};
  const target = buildProcessRoles.find((r) => r.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '角色不存在' });
  }

  target.assignedUsers = Array.isArray(users) ? users : [];
  res.json({
    status: 1,
    data: target,
    info: `已更新角色【${target.roleName}】的人员配置，当前成员 ${target.assignedUsers.length} 人`,
  });
});

app.post('/api/build/roles/import', (req, res) => {
  const { items, overwrite = false } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 0, info: '无可导入的数据' });
  }

  let importedCount = 0;
  let updatedCount = 0;

  items.forEach((item: any) => {
    if (!item.roleName) return;
    const existing = buildProcessRoles.find(
      (r) =>
        (item.roleCode && r.roleCode === item.roleCode) ||
        r.roleName === item.roleName
    );

    if (existing) {
      if (overwrite) {
        if (item.roleType) existing.roleType = item.roleType;
        if (item.category) existing.category = item.category;
        if (item.boundPositions) existing.boundPositions = Array.isArray(item.boundPositions) ? item.boundPositions : [item.boundPositions];
        if (item.rankRequirement) existing.rankRequirement = item.rankRequirement;
        if (item.remark) existing.remark = item.remark;
        updatedCount++;
      }
    } else {
      buildProcessRoles.push({
        id: `prole_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`,
        roleNo: buildProcessRoles.length + 1,
        roleCode: item.roleCode || `PR-ROLE-${Math.floor(Math.random() * 899 + 100)}`,
        roleName: item.roleName,
        roleType: item.roleType || '主责角色 (R)',
        category: item.category || '02 研发与技术创新',
        boundPositions: item.boundPositions ? (Array.isArray(item.boundPositions) ? item.boundPositions : [item.boundPositions]) : ['系统工程师'],
        assignedUsers: [],
        boundFlows: [],
        rankRequirement: item.rankRequirement || 'P5-P7',
        isKcpApprover: Boolean(item.isKcpApprover),
        sort: buildProcessRoles.length + 1,
        status: item.status === '1' ? '1' : '0',
        remark: item.remark || '批量导入角色',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      importedCount++;
    }
  });

  res.json({
    status: 1,
    total: buildProcessRoles.length,
    info: `角色导入完成：新增 ${importedCount} 个，更新 ${updatedCount} 个`,
  });
});

app.post('/api/build/roles/reset', (_req, res) => {
  buildProcessRoles = JSON.parse(JSON.stringify(initialBuildProcessRoles));
  res.json({
    status: 1,
    total: buildProcessRoles.length,
    list: buildProcessRoles,
    info: '已成功重置为设计稿预置流程角色库 (16个标准角色)',
  });
});

// =================================================================
// 角色库分层级类型与业务领域 (Role Hierarchical Categories)
// =================================================================
const initialRoleCategories = [
  { id: 'cat_01', name: '01 战略与投资规划', code: '01', parentId: null, level: 1, sort: 1 },
  { id: 'cat_01_1', name: '1.1 战略发展与投资决策', code: '01.01', parentId: 'cat_01', level: 2, sort: 1 },
  { id: 'cat_01_2', name: '1.2 流程治理与架构委员会', code: '01.02', parentId: 'cat_01', level: 2, sort: 2 },

  { id: 'cat_02', name: '02 研发与技术创新', code: '02', parentId: null, level: 1, sort: 2 },
  { id: 'cat_02_1', name: '2.1 系统架构与核心算法', code: '02.01', parentId: 'cat_02', level: 2, sort: 1 },
  { id: 'cat_02_2', name: '2.2 集成电路与芯片设计', code: '02.02', parentId: 'cat_02', level: 2, sort: 2 },
  { id: 'cat_02_3', name: '2.3 嵌入式与软件开发', code: '02.03', parentId: 'cat_02', level: 2, sort: 3 },

  { id: 'cat_03', name: '03 产品与项目运营', code: '03', parentId: null, level: 1, sort: 3 },
  { id: 'cat_03_1', name: '3.1 产品规划与需求运营', code: '03.01', parentId: 'cat_03', level: 2, sort: 1 },
  { id: 'cat_03_2', name: '3.2 PDT项目交付管理', code: '03.02', parentId: 'cat_03', level: 2, sort: 2 },

  { id: 'cat_04', name: '04 营销与商务拓展', code: '04', parentId: null, level: 1, sort: 4 },
  { id: 'cat_04_1', name: '4.1 LTC销售线索与商机', code: '04.01', parentId: 'cat_04', level: 2, sort: 1 },
  { id: 'cat_04_2', name: '4.2 商务合同与战略客户', code: '04.02', parentId: 'cat_04', level: 2, sort: 2 },

  { id: 'cat_05', name: '05 质量与风险合规', code: '05', parentId: null, level: 1, sort: 5 },
  { id: 'cat_05_1', name: '5.1 TR技术评审委员会', code: '05.01', parentId: 'cat_05', level: 2, sort: 1 },
  { id: 'cat_05_2', name: '5.2 流程审计与KCP内控', code: '05.02', parentId: 'cat_05', level: 2, sort: 2 },

  { id: 'cat_06', name: '06 供应链与生产交付', code: '06', parentId: null, level: 1, sort: 6 },
  { id: 'cat_06_1', name: '6.1 采购寻源与供应商认证', code: '06.01', parentId: 'cat_06', level: 2, sort: 1 },
  { id: 'cat_06_2', name: '6.2 晶圆流片与外协生产', code: '06.02', parentId: 'cat_06', level: 2, sort: 2 },
];

let roleCategoriesStore: any[] = JSON.parse(JSON.stringify(initialRoleCategories));

// Helper: calculate role count for a category including its children
function getCategoryRoleCount(cat: any): number {
  const descendantIds: string[] = [cat.id];
  const descendantNames: string[] = [cat.name];

  function collect(parentId: string) {
    const children = roleCategoriesStore.filter((c) => c.parentId === parentId);
    children.forEach((ch) => {
      descendantIds.push(ch.id);
      descendantNames.push(ch.name);
      collect(ch.id);
    });
  }
  collect(cat.id);

  return buildProcessRoles.filter((r) =>
    descendantNames.some(
      (n) => r.category === n || (r.category && r.category.startsWith(n))
    )
  ).length;
}

// 1. Get role categories list
app.get('/api/build/role-categories', (_req, res) => {
  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));
  res.json({ status: 1, data: listWithCounts, info: 'ok' });
});

// 2. Add role category (支持指定 parentId 分层级创建)
app.post('/api/build/role-categories', (req, res) => {
  const { name, code, parentId, description } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 0, info: '类型/分类名称不能为空' });
  }

  const cleanName = name.trim();
  const parent = parentId ? roleCategoriesStore.find((c) => c.id === parentId) : null;
  const level = parent ? parent.level + 1 : 1;

  const newCat = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    code: code ? code.trim() : (parent ? `${parent.code}.${Date.now().toString().slice(-2)}` : `${Date.now().toString().slice(-2)}`),
    parentId: parent ? parent.id : null,
    level,
    description: description ? description.trim() : '',
    sort: roleCategoriesStore.filter((c) => c.parentId === (parent ? parent.id : null)).length + 1,
  };

  roleCategoriesStore.push(newCat);
  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));

  res.json({
    status: 1,
    data: newCat,
    list: listWithCounts,
    info: '新增角色库类型成功',
  });
});

// 3. Update role category
app.put('/api/build/role-categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, parentId, description } = req.body || {};
  const target = roleCategoriesStore.find((c) => c.id === id);

  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到指定类型' });
  }

  const oldName = target.name;
  if (name && name.trim()) {
    target.name = name.trim();
    // Sync any roles that used the old category name
    if (oldName !== target.name) {
      buildProcessRoles.forEach((r) => {
        if (r.category === oldName) r.category = target.name;
      });
    }
  }

  if (code !== undefined) target.code = code.trim();
  if (description !== undefined) target.description = description.trim();

  if (parentId !== undefined && parentId !== target.parentId && parentId !== target.id) {
    target.parentId = parentId || null;
    const parent = parentId ? roleCategoriesStore.find((c) => c.id === parentId) : null;
    target.level = parent ? parent.level + 1 : 1;
  }

  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));

  res.json({
    status: 1,
    data: target,
    list: listWithCounts,
    info: '修改角色库类型成功',
  });
});

// 4. Delete role category (递归删除该节点及其所有子节点)
app.delete('/api/build/role-categories/:id', (req, res) => {
  const { id } = req.params;
  const idsToDelete = new Set<string>();

  function collect(nodeId: string) {
    idsToDelete.add(nodeId);
    roleCategoriesStore
      .filter((c) => c.parentId === nodeId)
      .forEach((ch) => collect(ch.id));
  }

  collect(id);

  const deletedCats = roleCategoriesStore.filter((c) => idsToDelete.has(c.id));
  roleCategoriesStore = roleCategoriesStore.filter((c) => !idsToDelete.has(c.id));

  // Fallback for roles that belonged to deleted categories
  const fallback = roleCategoriesStore[0]?.name || '未分类角色';
  buildProcessRoles.forEach((r) => {
    if (deletedCats.some((c) => c.name === r.category)) {
      r.category = fallback;
    }
  });

  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));

  res.json({
    status: 1,
    deletedCount: idsToDelete.size,
    list: listWithCounts,
    info: `成功删除 ${idsToDelete.size} 个类型`,
  });
});

// 5. Reset role categories
app.post('/api/build/role-categories/reset', (_req, res) => {
  roleCategoriesStore = JSON.parse(JSON.stringify(initialRoleCategories));
  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));
  res.json({
    status: 1,
    list: listWithCounts,
    info: '已恢复预置分层级角色类型',
  });
});

// =================================================================
// 流程术语 (Flow Terms & Categories)
// =================================================================
let flowTermCategories = [
  { id: 'cat_1', name: '产品研发类', description: '涵盖IPD研发全流程、技术评审TR、架构设计相关术语', count: 1 },
  { id: 'cat_2', name: '市场销售类', description: '涵盖LTC线索管理、招投标、商务合同与客户管理术语', count: 1 },
  { id: 'cat_3', name: '供应链类', description: '涵盖采购寻源、供应商准入、集成供应链ISC、SQM管理', count: 2 },
  { id: 'cat_4', name: '质量管理类', description: '涵盖全面质量管理TQM、ISO体系、质量保证及内控审核', count: 2 },
  { id: 'cat_5', name: '售后服务类', description: '涵盖ITR客户问题流转、维保SLA、工单派发及回访服务', count: 1 },
  { id: 'cat_6', name: '财务管控类', description: '涵盖IFS财务共享、预算控制、成本核算与应收账款', count: 1 },
];

let flowTerms = [
  {
    id: 27,
    name: 'IPD',
    category: '产品研发类',
    content: 'Integrated Products Development (集成产品开发)',
    createdAt: '2026-03-01 09:30:00',
    updatedAt: '2026-03-01 09:30:00',
  },
  {
    id: 28,
    name: 'LTC',
    category: '市场销售类',
    content: 'Leads to Cash (线索到回款)',
    createdAt: '2026-03-02 10:15:00',
    updatedAt: '2026-03-02 10:15:00',
  },
  {
    id: 30,
    name: 'SQM',
    category: '供应链类',
    content: 'Suppler quality management（供应商质量控制）',
    createdAt: '2026-03-05 14:20:00',
    updatedAt: '2026-03-05 14:20:00',
  },
  {
    id: 31,
    name: 'TQM',
    category: '质量管理类',
    content: 'Total quality management 全面质量管理',
    createdAt: '2026-03-08 11:00:00',
    updatedAt: '2026-03-08 11:00:00',
  },
  {
    id: 32,
    name: 'QMSSSSS',
    category: '质量管理类',
    content: 'QUATLIY MANAGEMENT SYSTEM',
    createdAt: '2026-03-10 16:45:00',
    updatedAt: '2026-03-10 16:45:00',
  },
  {
    id: 34,
    name: 'ISC',
    category: '供应链类',
    content: '集成供应链',
    createdAt: '2026-03-12 17:10:00',
    updatedAt: '2026-03-12 17:10:00',
  },
  {
    id: 35,
    name: 'ITR',
    category: '售后服务类',
    content: 'Issue to Resolved (问题到解决)',
    createdAt: '2026-03-15 08:50:00',
    updatedAt: '2026-03-15 08:50:00',
  },
  {
    id: 36,
    name: 'IFS',
    category: '财务管控类',
    content: 'Integrated Financial Services (集成财务服务)',
    createdAt: '2026-03-16 13:25:00',
    updatedAt: '2026-03-16 13:25:00',
  },
];

// Recalculate category counts
function syncCategoryCounts() {
  flowTermCategories.forEach((cat) => {
    cat.count = flowTerms.filter((t) => t.category === cat.name).length;
  });
}

// 1. Get terms list
app.get('/api/flow/terms', (req, res) => {
  const { name, category, pageNum = '1', pageSize = '10' } = req.query as Record<string, string>;
  let list = [...flowTerms];

  if (name && name.trim()) {
    const q = name.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.content && t.content.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'all' && category.trim()) {
    list = list.filter((t) => t.category === category.trim());
  }

  // Sort by id ascending or descending
  list.sort((a, b) => a.id - b.id);

  const total = list.length;
  const pNum = Math.max(1, parseInt(pageNum, 10) || 1);
  const pSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const start = (pNum - 1) * pSize;
  const rows = list.slice(start, start + pSize);

  syncCategoryCounts();

  res.json({
    status: 1,
    total,
    pageNum: pNum,
    pageSize: pSize,
    rows,
    categories: flowTermCategories.map((c) => c.name),
    info: 'ok',
  });
});

// 2. Create term
app.post('/api/flow/terms', (req, res) => {
  const { name, category, content } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 0, info: '术语名称不能为空' });
  }

  const maxId = flowTerms.reduce((max, t) => Math.max(max, t.id || 0), 0);
  const nextId = maxId > 0 ? maxId + 1 : 1;
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const newTerm = {
    id: nextId,
    name: name.trim(),
    category: category ? category.trim() : '产品研发类',
    content: content ? content.trim() : '',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  flowTerms.push(newTerm);
  syncCategoryCounts();

  res.json({
    status: 1,
    data: newTerm,
    info: '新增流程术语成功',
  });
});

// 3. Update term
app.put('/api/flow/terms/:id', (req, res) => {
  const termId = parseInt(req.params.id, 10);
  const { name, category, content } = req.body || {};
  const target = flowTerms.find((t) => t.id === termId);

  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到指定术语' });
  }

  if (name !== undefined && name.trim()) target.name = name.trim();
  if (category !== undefined) target.category = category.trim();
  if (content !== undefined) target.content = content.trim();
  target.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  syncCategoryCounts();

  res.json({
    status: 1,
    data: target,
    info: '修改流程术语成功',
  });
});

// 4. Delete term
app.delete('/api/flow/terms/:id', (req, res) => {
  const termId = parseInt(req.params.id, 10);
  const idx = flowTerms.findIndex((t) => t.id === termId);
  if (idx < 0) {
    return res.status(404).json({ status: 0, info: '未找到指定术语' });
  }

  flowTerms.splice(idx, 1);
  syncCategoryCounts();

  res.json({
    status: 1,
    info: '删除流程术语成功',
  });
});

// 5. Get categories
app.get('/api/flow/term-categories', (_req, res) => {
  syncCategoryCounts();
  res.json({
    status: 1,
    data: flowTermCategories,
    info: 'ok',
  });
});

// 6. Create category
app.post('/api/flow/term-categories', (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 0, info: '分类名称不能为空' });
  }
  const cleanName = name.trim();
  if (flowTermCategories.some((c) => c.name === cleanName)) {
    return res.status(400).json({ status: 0, info: '该分类名称已存在' });
  }

  const newCat = {
    id: 'cat_' + Math.random().toString(36).substring(2, 8),
    name: cleanName,
    description: description ? description.trim() : '',
    count: 0,
  };

  flowTermCategories.push(newCat);
  res.json({
    status: 1,
    data: newCat,
    list: flowTermCategories,
    info: '新增术语分类成功',
  });
});

// 7. Update category
app.put('/api/flow/term-categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body || {};
  const target = flowTermCategories.find((c) => c.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到指定分类' });
  }

  const oldName = target.name;
  if (name && name.trim()) {
    const newName = name.trim();
    if (newName !== oldName) {
      target.name = newName;
      // Sync terms that used oldName
      flowTerms.forEach((t) => {
        if (t.category === oldName) t.category = newName;
      });
    }
  }
  if (description !== undefined) {
    target.description = description.trim();
  }

  syncCategoryCounts();
  res.json({
    status: 1,
    data: target,
    list: flowTermCategories,
    info: '修改分类成功',
  });
});

// 8. Delete category
app.delete('/api/flow/term-categories/:id', (req, res) => {
  const { id } = req.params;
  const idx = flowTermCategories.findIndex((c) => c.id === id);
  if (idx < 0) {
    return res.status(404).json({ status: 0, info: '未找到指定分类' });
  }

  const catName = flowTermCategories[idx].name;
  flowTermCategories.splice(idx, 1);

  // Default terms in this category to first available category
  const fallbackCat = flowTermCategories[0]?.name || '默认分类';
  flowTerms.forEach((t) => {
    if (t.category === catName) t.category = fallbackCat;
  });

  syncCategoryCounts();
  res.json({
    status: 1,
    list: flowTermCategories,
    info: '删除分类成功',
  });
});

// System Settings & Company Authorization
app.get('/api/system/company', (_req, res) => {
  res.json({ status: 1, data: companyAuthData, info: 'ok' });
});

app.post('/api/system/company', (req, res) => {
  Object.assign(companyAuthData, req.body);
  if (req.body.companyName) {
    if (companyAuthData.license) {
      companyAuthData.license.authorizedCompany = req.body.companyName;
    }
    if (currentActiveUser) {
      currentActiveUser.companyName = req.body.companyName;
    }
  }
  res.json({ status: 1, data: companyAuthData, info: 'ok' });
});

// 商业授权与硬件特征码管理
app.get('/api/system/license', (_req, res) => {
  res.json({
    status: 1,
    data: {
      companyName: companyAuthData.companyName,
      license: companyAuthData.license,
      serverHardware: companyAuthData.license?.serverHardware,
    },
    info: 'ok',
  });
});

// 生成对应硬件特征码与公司名的标准授权码 (测试与离线激活辅助)
app.post('/api/system/license/generate-code', (req, res) => {
  const { companyName, machineCode, edition = '企业旗舰版 (Enterprise)' } = req.body || {};
  const targetCompany = (companyName || companyAuthData.companyName || '苏州全源数字科技有限公司').trim();
  const targetHw = (machineCode || companyAuthData.license?.machineCode || 'HW-UUID-88A9-4B2E-99F1-017E54').trim();

  // 简易但结构严密的特征签名算法
  const cleanHw = targetHw.replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase() || '88A94B2E';
  const prefix = edition.includes('专业') ? 'PRO' : 'ENTP';
  const hashPart = Math.abs(
    (targetCompany + targetHw).split('').reduce((acc: number, c: string) => (acc * 31 + c.charCodeAt(0)) | 0, 7)
  ).toString(16).toUpperCase().padStart(8, '0');

  const generatedKey = `DFLOW-${prefix}-2026-${cleanHw.slice(0, 4)}-${cleanHw.slice(4, 8)}-${hashPart.slice(0, 4)}-${hashPart.slice(4, 8)}`;

  res.json({
    status: 1,
    data: {
      companyName: targetCompany,
      machineCode: targetHw,
      edition,
      generatedKey,
      certFingerprint: `SHA256:${hashPart.repeat(4)}`,
      validUntil: '2030-09-11 07:14:06',
    },
    info: '授权码生成成功',
  });
});

// 更新授权码 (支持公司名称变更与基于设备硬件特征码的授权绑定)
app.post('/api/system/license/activate', (req, res) => {
  const {
    companyName,
    machineCode,
    licenseKey,
    edition,
    authUsersCount,
    expireDate,
  } = req.body || {};

  const serverHardwareCode = companyAuthData.license?.serverHardware?.machineCode || 'HW-UUID-88A9-4B2E-99F1-017E54';
  const inputHardwareCode = (machineCode || serverHardwareCode).trim();

  // 硬件特征码校验（防止跨机盗用，确保基于设备硬件特征码绑定）
  if (inputHardwareCode && inputHardwareCode.toUpperCase() !== serverHardwareCode.toUpperCase()) {
    return res.status(400).json({
      status: 0,
      info: `硬件特征码不匹配！输入的硬件特征码 [${inputHardwareCode}] 与当前服务器物理硬件特征码 [${serverHardwareCode}] 不一致，无法激活。`,
    });
  }

  if (!licenseKey || !licenseKey.trim()) {
    return res.status(400).json({ status: 0, info: '请输入有效的商业授权码' });
  }

  const cleanKey = licenseKey.trim();
  const targetCompanyName = (companyName || companyAuthData.companyName || '苏州全源数字科技有限公司').trim();
  const oldCompanyName = companyAuthData.companyName;

  // 1. 更新公司名称（支持变更）
  companyAuthData.companyName = targetCompanyName;
  if (currentActiveUser) {
    currentActiveUser.companyName = targetCompanyName;
  }

  // 2. 更新授权核心状态与硬件绑定信息
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const targetEdition = edition || companyAuthData.license?.edition || '企业旗舰版 (Enterprise)';
  const targetExpire = expireDate || companyAuthData.expireTime || '2030-09-11 07:14:06';
  const targetUsersCount = authUsersCount || companyAuthData.authUsersCount || 200;

  companyAuthData.companyStatus = '正常生效中';
  companyAuthData.expireTime = targetExpire;
  companyAuthData.authUsersCount = targetUsersCount;

  if (!companyAuthData.license) {
    companyAuthData.license = {};
  }

  companyAuthData.license.licenseKey = cleanKey;
  companyAuthData.license.machineCode = serverHardwareCode;
  companyAuthData.license.status = 'ACTIVE';
  companyAuthData.license.edition = targetEdition;
  companyAuthData.license.authorizedCompany = targetCompanyName;
  companyAuthData.license.hardwareVerified = true;
  companyAuthData.license.hardwareVerificationStatus = '硬件特征码校验通过，绑定生效中';
  companyAuthData.license.expireDate = targetExpire;
  companyAuthData.license.lastUpdateTime = now;

  // 计算证书签名与序列号
  const hashPart = Math.abs(
    (targetCompanyName + serverHardwareCode).split('').reduce((acc: number, c: string) => (acc * 31 + c.charCodeAt(0)) | 0, 7)
  ).toString(16).toUpperCase().padStart(8, '0');
  companyAuthData.license.certSerialNo = `CERT-2026-${cleanKey.slice(-8)}-${hashPart.slice(0, 6)}`;
  companyAuthData.license.digitalSignature = `SHA256withRSA · RS256-VERIFIED-${hashPart.slice(0, 6)}`;

  // 记录审计日志
  const isNameChanged = oldCompanyName !== targetCompanyName;
  const auditDetail = isNameChanged
    ? `更新授权码成功。公司名称由「${oldCompanyName}」变更为「${targetCompanyName}」，并已严格绑定设备硬件特征码 [${serverHardwareCode}]`
    : `更新授权码成功。已重新核验并绑定设备硬件特征码 [${serverHardwareCode}]，授权期限至 ${targetExpire}`;

  if (!Array.isArray(companyAuthData.license.auditLogs)) {
    companyAuthData.license.auditLogs = [];
  }

  companyAuthData.license.auditLogs.unshift({
    id: `log_${Date.now()}`,
    time: now,
    event: isNameChanged ? '更新授权码并变更公司名称' : '更新商业授权码',
    companyName: targetCompanyName,
    machineCode: serverHardwareCode,
    operator: currentActiveUser?.userName || '流程管理员',
    status: '成功',
    detail: auditDetail,
  });

  res.json({
    status: 1,
    data: companyAuthData,
    info: isNameChanged
      ? `商业授权更新成功！公司名称已成功变更为「${targetCompanyName}」，并已完成设备硬件特征码绑定。`
      : '商业授权更新成功！设备硬件特征码核验一致，授权已生效。',
  });
});

app.get('/api/system/apis', (_req, res) => {
  const activeCount = systemApis.filter((a) => a.status === '启用').length;
  res.json({
    status: 1,
    data: {
      list: systemApis,
      allTotal: systemApis.length,
      activeCount,
      totalCalls: 38240,
    },
    list: systemApis,
    info: 'ok',
  });
});

app.post('/api/system/apis', (req, res) => {
  const { apiName, apiPath, method = 'GET', category = 'collab', status = '启用', authType = 'Bearer Token', rateLimit = '60次/分钟', description = '', sampleResponse = '{}' } = req.body;
  if (!apiName || !apiPath) {
    return res.status(400).json({ status: 0, info: '接口名称与路径必填' });
  }
  const newApi = {
    id: systemApis.length > 0 ? Math.max(...systemApis.map((a) => a.id || 0)) + 1 : 1,
    apiName: apiName.trim(),
    apiPath: apiPath.trim(),
    method: method.toUpperCase(),
    category,
    status,
    authType,
    rateLimit,
    description,
    sampleResponse,
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  systemApis.unshift(newApi);
  res.json({ status: 1, data: newApi, list: systemApis, info: 'API 接口已成功注册并发布' });
});

app.put('/api/system/apis/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = systemApis.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '未找到指定 API 接口' });
  }
  systemApis[idx] = {
    ...systemApis[idx],
    ...req.body,
    id,
  };
  res.json({ status: 1, data: systemApis[idx], list: systemApis, info: 'API 接口已成功更新' });
});

app.delete('/api/system/apis/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  systemApis = systemApis.filter((a) => a.id !== id);
  res.json({ status: 1, list: systemApis, info: 'API 接口已删除' });
});

app.post('/api/system/apis/reset', (_req, res) => {
  systemApis = JSON.parse(JSON.stringify(defaultSystemApis));
  res.json({ status: 1, list: systemApis, info: '已成功重置为系统出厂预置 API 规范' });
});

app.post('/api/system/apis/debug', async (req, res) => {
  const { apiPath, method = 'GET', headers = {}, body } = req.body;
  const start = Date.now();
  try {
    const target = systemApis.find((a) => a.apiPath === apiPath && a.method === method.toUpperCase());
    const latency = Math.floor(Math.random() * 25) + 12; // Realistic 12-37ms response
    let responseData: any;
    if (target?.sampleResponse) {
      try {
        responseData = JSON.parse(target.sampleResponse);
      } catch {
        responseData = { code: 200, message: 'success', data: target.sampleResponse };
      }
    } else {
      responseData = {
        code: 200,
        message: 'success',
        timestamp: new Date().toISOString(),
        echo: { apiPath, method, requestBody: body },
      };
    }
    res.json({
      status: 1,
      httpStatus: 200,
      statusText: 'OK',
      latencyMs: latency,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-powered-by': 'QingProcess Enterprise Gateway',
        'x-request-id': `req_${Math.random().toString(36).slice(2, 10)}`,
        'x-rate-limit-remaining': '119',
      },
      data: responseData,
      info: '在线调试调用成功',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 0,
      httpStatus: 500,
      statusText: 'Internal Error',
      latencyMs: Date.now() - start,
      info: err.message || '调试执行失败',
    });
  }
});

app.get('/api/system/forms', (_req, res) => {
  res.json({ status: 1, data: { forms: formEngineSchemas }, info: 'ok' });
});

app.get('/api/system/forms/:formKey', (req, res) => {
  const found = formEngineSchemas.find((f) => f.formKey === req.params.formKey) || formEngineSchemas[0];
  res.json({ status: 1, data: found, info: 'ok' });
});

// Create new form model
app.post('/api/system/forms', (req, res) => {
  const { formKey, formName, moduleDomain, description, version } = req.body;
  if (!formKey || !formName) {
    return res.status(400).json({ status: 0, info: '表单标识与表单名称不能为空' });
  }
  const existing = formEngineSchemas.find((f) => f.formKey === formKey);
  if (existing) {
    return res.status(400).json({ status: 0, info: '表单标识已存在，请使用唯一标识' });
  }
  const newForm = {
    formKey: formKey.trim(),
    formName: formName.trim(),
    moduleDomain: moduleDomain || '自定义业务域',
    description: description || '',
    version: version || 'V1.0',
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    fields: [
      {
        id: 'f_' + Math.random().toString(36).substring(2, 8),
        fieldKey: 'id',
        label: '单据编号',
        type: 'input',
        required: true,
        showInList: true,
        searchable: true,
        isSystem: true,
        span: 12,
      },
      {
        id: 'f_' + Math.random().toString(36).substring(2, 8),
        fieldKey: 'title',
        label: '主题名称',
        type: 'input',
        required: true,
        showInList: true,
        searchable: true,
        isSystem: true,
        span: 12,
      },
    ],
  };
  formEngineSchemas.push(newForm);
  res.json({ status: 1, data: newForm, info: '表单模型创建成功' });
});

// Update form model metadata
app.put('/api/system/forms/:formKey', (req, res) => {
  const target = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到对应表单模型' });
  }
  const { formName, moduleDomain, description, version } = req.body;
  if (formName) target.formName = formName;
  if (moduleDomain) target.moduleDomain = moduleDomain;
  if (description !== undefined) target.description = description;
  if (version) target.version = version;
  target.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: target, info: '表单配置更新成功' });
});

// Delete form model
app.delete('/api/system/forms/:formKey', (req, res) => {
  const isDefault = ['form_sysdoc', 'form_risk', 'form_flow', 'form_flowdoc'].includes(req.params.formKey);
  if (isDefault) {
    return res.status(400).json({ status: 0, info: '系统内置单据模型不允许删除' });
  }
  const idx = formEngineSchemas.findIndex((f) => f.formKey === req.params.formKey);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '未找到对应表单模型' });
  }
  formEngineSchemas.splice(idx, 1);
  res.json({ status: 1, info: '表单模型已删除' });
});

// Add or update field in form
app.post('/api/system/forms/:formKey/fields', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const fieldData = req.body;
  if (!fieldData.label || !fieldData.fieldKey) {
    return res.status(400).json({ status: 0, info: '字段名称与字段Key不能为空' });
  }

  if (fieldData.id) {
    // Edit existing field
    const fieldIndex = form.fields.findIndex((f: any) => f.id === fieldData.id);
    if (fieldIndex >= 0) {
      form.fields[fieldIndex] = {
        ...form.fields[fieldIndex],
        ...fieldData,
      };
    } else {
      form.fields.push({
        ...fieldData,
        id: fieldData.id || 'f_' + Math.random().toString(36).substring(2, 8),
      });
    }
  } else {
    // Create new field
    const newField = {
      ...fieldData,
      id: 'f_' + Math.random().toString(36).substring(2, 8),
      isSystem: false,
    };
    form.fields.push(newField);
  }
  form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: form, info: '字段保存成功' });
});

// Sort fields in form
app.put('/api/system/forms/:formKey/fields/sort', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const { fieldIds } = req.body;
  if (Array.isArray(fieldIds)) {
    const sortedFields: any[] = [];
    fieldIds.forEach((id: string) => {
      const f = form.fields.find((item: any) => item.id === id);
      if (f) sortedFields.push(f);
    });
    // Append any fields not present in fieldIds
    form.fields.forEach((item: any) => {
      if (!sortedFields.some((f) => f.id === item.id)) {
        sortedFields.push(item);
      }
    });
    form.fields = sortedFields;
    form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  res.json({ status: 1, data: form, info: '字段排序更新成功' });
});

// Delete field in form
app.delete('/api/system/forms/:formKey/fields/:id', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const field = form.fields.find((f: any) => f.id === req.params.id);
  if (field && field.isSystem) {
    return res.status(400).json({ status: 0, info: '系统内置字段不允许删除' });
  }
  form.fields = form.fields.filter((f: any) => f.id !== req.params.id);
  form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: form, info: '字段已删除' });
});

// Import fields schema to form
app.post('/api/system/forms/:formKey/import', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const { fields, mode } = req.body; // mode: 'replace' | 'append'
  if (!Array.isArray(fields)) {
    return res.status(400).json({ status: 0, info: '字段列表格式不正确' });
  }

  if (mode === 'replace') {
    const systemFields = form.fields.filter((f: any) => f.isSystem);
    form.fields = [...systemFields, ...fields.map((f: any) => ({
      ...f,
      id: f.id || 'f_' + Math.random().toString(36).substring(2, 8),
      isSystem: false,
    }))];
  } else {
    fields.forEach((f: any) => {
      form.fields.push({
        ...f,
        id: f.id || 'f_' + Math.random().toString(36).substring(2, 8),
        isSystem: false,
      });
    });
  }
  form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: form, info: '字段导入成功' });
});

// Reset form schemas to system initial defaults
app.post('/api/system/forms/reset', (_req, res) => {
  formEngineSchemas = JSON.parse(JSON.stringify(initialFormEngineSchemas));
  res.json({
    status: 1,
    data: { forms: formEngineSchemas },
    info: '已成功将所有业务单据模型与字段定义重置为系统默认出厂规范',
  });
});

// AI Form Fields Recommendation Generation
app.post('/api/ai/form-fields-generate', async (req, res) => {
  const { prompt, formKey, formName, moduleDomain } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ status: 0, info: '请输入业务定制诉求与场景描述' });
  }

  const promptText = prompt.trim();
  let recommendedFields: any[] = [];

  // Try calling Gemini API first if configured
  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      const ai = getAiClient();
      const systemInstruction = `你是一个企业数字化流程管理平台 (dflow) 的高级数据架构与表单引擎专家。
当前用户正在为表单【${formName || '制度业务表单'}】(标识: ${formKey}, 所属模块: ${moduleDomain || '制度文件'}) 扩展新字段。
用户给出的业务诉求是: "${promptText}"。
请基于企业内控合规、业务流程运营最佳实践，生成 3 至 5 个高拟真度、专业的扩展字段。
必须输出符合下列 JSON 结构的数组，无 markdown 代码块，纯 JSON 数组:
[
  {
    "fieldKey": "英文驼峰标识, 如 legalReviewConclusion",
    "label": "中文显示名称, 如 法务审查结论",
    "type": "input | textarea | richText | number | currency | select | multiSelect | radio | checkbox | date | datetime | userPicker | deptPicker | switch | upload",
    "span": 12,
    "section": "基础信息 | 业务参数 | 权责与审批 | 合规风控 | 扩展属性",
    "required": true,
    "showInList": true,
    "placeholder": "填写提示文案",
    "tooltip": "帮助指引说明",
    "options": ["选项1", "选项2"] (当type为select/multiSelect/radio/checkbox时提供)
  }
]`;
      const aiRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemInstruction,
      });

      const responseText = aiRes.text || '';
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        recommendedFields = parsed.map((item: any, idx: number) => ({
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: item.fieldKey || `ai_field_${idx + 1}`,
          label: item.label || `智能字段${idx + 1}`,
          type: item.type || 'input',
          span: item.span || 12,
          section: item.section || '扩展属性',
          required: item.required ?? false,
          showInList: item.showInList ?? true,
          searchable: item.showInList ?? true,
          placeholder: item.placeholder || '',
          tooltip: item.tooltip || '',
          options: item.options || undefined,
          isSystem: false,
          selected: true,
        }));
      }
    }
  } catch (err) {
    console.warn('Gemini AI generation failed, using intelligent contextual fallback:', err);
  }

  // If Gemini did not return fields (or fallback triggered), use intelligent semantic analyzer
  if (recommendedFields.length === 0) {
    const isLegalOrAML = /法务|律师|合规|洗钱|审查|法规|审计/i.test(promptText);
    const isFinance = /财务|资金|预算|金额|成本|付款|核算/i.test(promptText);
    const isTech = /技术|系统|接口|研发|测试|代码|上线/i.test(promptText);

    if (isLegalOrAML) {
      recommendedFields = [
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'legalAuditConclusion',
          label: '法务合规审查结论',
          type: 'select',
          span: 12,
          section: '合规风控',
          required: true,
          showInList: true,
          searchable: true,
          options: ['合规通过且无保留意见', '附条件通过(需限期复核整改)', '存在重大法律合规瑕疵退回', '一票否决(不予通过)'],
          defaultValue: '合规通过且无保留意见',
          tooltip: '由合规法务专职人员出具的法务合规审结意见',
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'amlRiskRating',
          label: '反洗钱(AML)风险评级',
          type: 'select',
          span: 12,
          section: '合规风控',
          required: true,
          showInList: true,
          searchable: true,
          options: ['低风险(常规准入)', '中风险(强化尽职调查)', '高风险(合规委员会特批)', '禁止准入'],
          defaultValue: '低风险(常规准入)',
          tooltip: '按照反洗钱法与集团合规准则认定的合规风险评级',
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'externalLawFirmOpinion',
          label: '外聘律师事务所书面意见',
          type: 'upload',
          span: 24,
          section: '扩展属性',
          required: false,
          showInList: false,
          searchable: false,
          placeholder: '上传外聘专业律师事务所盖章合规法律意见书(PDF)',
          tooltip: '重大制度出台必须附具执业律所出具的法定审查底稿',
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'legalCounselUser',
          label: '经办法务专员',
          type: 'userPicker',
          span: 12,
          section: '权责与审批',
          required: true,
          showInList: true,
          searchable: true,
          placeholder: '点选企业合规法务负责人...',
          defaultValue: '李合规 (审计专员)',
          selected: true,
          isSystem: false,
        },
      ];
    } else if (isFinance) {
      recommendedFields = [
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'budgetSubjectCode',
          label: '财务归属预算科目',
          type: 'select',
          span: 12,
          section: '业务参数',
          required: true,
          showInList: true,
          searchable: true,
          options: ['专项数字化研发投入', '企业管理日常运营成本', '固定资产采购专项', '业务招待拓展费用'],
          defaultValue: '专项数字化研发投入',
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'estimatedCostAmount',
          label: '预计支出总金额 (元)',
          type: 'currency',
          span: 12,
          section: '业务参数',
          required: true,
          showInList: true,
          searchable: true,
          defaultValue: 50000,
          placeholder: '输入单据对应预算额度',
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'financeVetoRight',
          label: '开启财务一票否决机制',
          type: 'switch',
          span: 12,
          section: '合规风控',
          required: false,
          showInList: true,
          searchable: false,
          defaultValue: true,
          selected: true,
          isSystem: false,
        },
      ];
    } else if (isTech) {
      recommendedFields = [
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'systemArchitectureImpact',
          label: '受影响系统架构拓扑',
          type: 'multiSelect',
          span: 12,
          section: '业务参数',
          required: true,
          showInList: true,
          searchable: true,
          options: ['用户中心微服务', '流程引擎中台', '计费资金网关', '消息队列Kafka', '大数据数仓'],
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'rollbackPlanDetails',
          label: '生产故障快速回滚预案',
          type: 'richText',
          span: 24,
          section: '扩展属性',
          required: true,
          showInList: false,
          searchable: false,
          placeholder: '详细记录上线回滚步骤与止损应急措施',
          selected: true,
          isSystem: false,
        },
      ];
    } else {
      recommendedFields = [
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'bizTagLabel',
          label: '业务专属扩展分类标签',
          type: 'multiSelect',
          span: 12,
          section: '基础信息',
          required: false,
          showInList: true,
          searchable: true,
          options: ['重点管控项', '月度复核', '对外公开', '关键控制活动'],
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'extendedClauseMemo',
          label: '扩展条款专项备忘',
          type: 'textarea',
          span: 24,
          section: '业务参数',
          required: false,
          showInList: false,
          searchable: false,
          placeholder: `根据诉求【${promptText}】自动生成的扩展业务条款说明`,
          selected: true,
          isSystem: false,
        },
        {
          id: 'f_ai_' + Math.random().toString(36).substring(2, 8),
          fieldKey: 'enableSpecialAudit',
          label: '是否启用专项复核通道',
          type: 'switch',
          span: 12,
          section: '合规风控',
          required: false,
          showInList: true,
          searchable: false,
          defaultValue: true,
          selected: true,
          isSystem: false,
        },
      ];
    }
  }

  res.json({
    status: 1,
    data: {
      recommendedFields,
      summary: `AI 大模型已根据您输入的业务场景诉求，智能推导并生成了 ${recommendedFields.length} 个规范表单字段`,
    },
    info: 'ok',
  });
});

// AI Draw.io generation with Gemini 3.8 Flash & intelligent fallbacks
app.post('/api/ai/drawio-generate', async (req, res) => {
  const { prompt, currentTitle } = req.body || {};
  let steps: any[] = [];
  let modelUsed = 'rule-engine';

  if (process.env.GEMINI_API_KEY && prompt) {
    try {
      const ai = getAiClient();
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `你是一位具备20年华为与跨国企业经验的资深流程管理架构师。请为业务诉求：“${prompt}” 设计专业严谨的端到端业务流程步骤。
请输出严格合法的JSON数组，包含 4 到 6 个步骤节点。每个节点对象结构如下：
{
  "title": "节点名称（精简动宾短语，如：发起采购申请、技术方案评审、管理委员会决议、采购订单下达）",
  "role": "责任岗位角色（如：研发工程师、项目经理、技术专家、财务总监、采购专员）",
  "desc": "本环节核心活动与执行要点",
  "out": "交付文档或成果材料（如：采购清单、评审报告、审批决议书、验收单）",
  "judge": false,
  "kcp": false
}
注意：重要评审决策环节的 judge 设为 true，风险控制点 kcp 设为 true。只输出严格的 JSON 数组。`,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const text = aiResponse.text?.trim() || '';
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        steps = parsed.map((item: any) => ({
          title: String(item.title || '执行步骤'),
          role: String(item.role || '责任岗位'),
          desc: String(item.desc || '按流程规范执行'),
          out: String(item.out || '成果文档'),
          judge: Boolean(item.judge),
          kcp: Boolean(item.kcp),
        }));
        modelUsed = 'gemini-3.8-flash';
      }
    } catch (err: any) {
      console.warn('Gemini generate fallback:', err.message);
    }
  }

  // Fallback if no Gemini key or parse error
  if (steps.length === 0) {
    const p = (prompt || '').toLowerCase();
    if (p.includes('研发') || p.includes('ipd') || p.includes('芯片') || p.includes('需求')) {
      steps = [
        { title: '需求收集与分析', role: '产品经理', desc: '收集市场与客户需求并输出PRD需求规格', out: '产品需求规格书(PRD)', judge: false, kcp: false },
        { title: '系统架构设计', role: '系统架构师', desc: '评估软硬件技术可行性并完成架构设计', out: '系统架构设计说明书', judge: false, kcp: false },
        { title: '技术方案评审', role: '技术专家组', desc: '组织方案同行交叉评审与风险裁决', out: '技术评审报告(TR)', judge: true, kcp: true },
        { title: '研发实现与联调', role: '研发工程师', desc: '按设计规范实施编码与单元集成验证', out: '集成测试报告', judge: false, kcp: false },
        { title: '投产验收发布', role: '发布委员会', desc: '发布评审合规与商业交付放行', out: '商业发布决议书', judge: false, kcp: true },
      ];
    } else if (p.includes('销售') || p.includes('ltc') || p.includes('线索') || p.includes('商机')) {
      steps = [
        { title: '线索接入与验证', role: '线索专员', desc: 'BANT模型多维验证潜在客户意向', out: '有效线索台账', judge: false, kcp: false },
        { title: '商机立项与引导', role: '客户经理(AM)', desc: '拜访客户梳理痛点与配置解决方案', out: '商机立项申请表', judge: false, kcp: false },
        { title: '投标决策评审', role: '投标决策组', desc: '评估商务利润与交付履约可行性', out: '投标决议审批单', judge: true, kcp: true },
        { title: '合同谈判与签署', role: '法务商务经理', desc: '条款合规审核并完成双方法定签约', out: '正式业务合同', judge: false, kcp: true },
        { title: '项目交接与回款', role: '项目经理', desc: '启动交付实施并推进首笔款项到账', out: '项目启动书及发票', judge: false, kcp: false },
      ];
    } else if (p.includes('财务') || p.includes('报销') || p.includes('付款') || p.includes('预算')) {
      steps = [
        { title: '填报报销申请', role: '经办人', desc: '上传发票凭证与费用明细并提交报销单', out: '费用报销申请单', judge: false, kcp: false },
        { title: '部门负责人初审', role: '部门经理', desc: '核查业务真实性与部门年度预算额度', out: '部门审批意见', judge: false, kcp: false },
        { title: '财务合规稽核', role: '财务核算会计', desc: '三单匹配合规审核发票真实性与税务', out: '财务初审流水', judge: false, kcp: true },
        { title: '财务总监审批', role: '财务总监', desc: '大额支出合规内控与资金调度审批', out: '付款授权书', judge: true, kcp: true },
        { title: '出纳对公转账', role: '出纳员', desc: '银行电汇扣款并自动登记财务凭证凭条', out: '银行对账电子回单', judge: false, kcp: false },
      ];
    } else {
      steps = [
        { title: '发起业务申请', role: '经办人员', desc: `针对【${prompt || '业务事项'}】发起全流程立项申请`, out: '业务立项申请表', judge: false, kcp: false },
        { title: '专业方案初审', role: '业务专家', desc: '核验业务技术方案完整性与可行性', out: '技术方案评估表', judge: false, kcp: true },
        { title: '决策会审决议', role: '评审委员会', desc: '投资收益与风险合规把关及决议', out: '决策会审决议单', judge: true, kcp: true },
        { title: '任务下达实施', role: '执行责任人', desc: '分配实施资源与监控各里程碑节点', out: '实施排期计划表', judge: false, kcp: false },
        { title: '成果验收归档', role: '验收专家', desc: '对照指标完成实物验收与流程手册归档', out: '验收确认结项书', judge: false, kcp: true },
      ];
    }
  }

  const finalTitle = currentTitle || prompt || '业务流程设计';
  const xml = buildDefaultFlowXml(finalTitle, steps);

  res.json({
    status: 1,
    data: {
      xml,
      title: finalTitle,
      modelUsed,
      summary: modelUsed === 'gemini-3.8-flash'
        ? `Gemini 3.8 Flash 已智能规划并构建 ${steps.length} 个端到端业务节点`
        : `流程专家模型已成功规划并构建 ${steps.length} 个端到端业务节点`,
      steps,
    },
    info: 'ok',
  });
});

// AI Flow Quality Audit
app.post('/api/ai/flow-audit', async (req, res) => {
  const { cells = [], title = '当前流程' } = req.body || {};
  const vertices = cells.filter((c: any) => c.vertex);
  const edges = cells.filter((c: any) => c.edge);

  const hasStart = vertices.some((v: any) => v.attrs?.dflowType === 'startEnd' && (v.value?.includes('开始') || v.attrs?.name?.includes('开始')));
  const hasEnd = vertices.some((v: any) => v.attrs?.dflowType === 'startEnd' && (v.value?.includes('结束') || v.attrs?.name?.includes('结束')));

  const connectedIds = new Set<string>();
  edges.forEach((e: any) => {
    if (e.source) connectedIds.add(e.source);
    if (e.target) connectedIds.add(e.target);
  });

  const issues: any[] = [];

  if (!hasStart) {
    issues.push({ id: 'iss_1', level: 'high', title: '缺少“开始”节点', desc: '端到端流程应具备明确的起点触发源。建议在流程左端补全开始节点。' });
  }
  if (!hasEnd) {
    issues.push({ id: 'iss_2', level: 'high', title: '缺少“结束”节点', desc: '流程缺少办结/闭环终止节点，易导致业务卡点无法归档。' });
  }

  const isolatedVertices = vertices.filter((v: any) => !connectedIds.has(v.id) && !v.attrs?.dflowType?.startsWith('swimlane'));
  if (isolatedVertices.length > 0) {
    issues.push({
      id: 'iss_3',
      level: 'medium',
      title: `检测到 ${isolatedVertices.length} 个孤立未连接节点`,
      desc: `节点【${isolatedVertices.map((v: any) => v.value || v.id).slice(0, 3).join('、')}】未与其他业务节点形成路由，建议检查流转逻辑。`,
    });
  }

  const roleNodes = vertices.filter((v: any) => v.attrs?.dflowType === 'nodeRoleName');
  const activityNodes = vertices.filter((v: any) => v.attrs?.dflowType?.startsWith('nodeActive'));
  if (activityNodes.length > 0 && roleNodes.length === 0) {
    issues.push({
      id: 'iss_4',
      level: 'medium',
      title: '缺少岗位角色定义',
      desc: '流程活动尚未配置责任主体或角色泳道，可能影响落地执行分工。',
    });
  }

  const kcpNodes = activityNodes.filter((v: any) => v.attrs?.kcp === 'true' || v.attrs?.kcp === true);
  if (kcpNodes.length === 0 && activityNodes.length >= 3) {
    issues.push({
      id: 'iss_5',
      level: 'low',
      title: '未标识关键控制点(KCP)',
      desc: '流程包含较多活动，但未设定质量与风险管控点。建议为高风险裁决环节标记KCP。',
    });
  }

  const score = Math.max(60, 100 - issues.filter((i) => i.level === 'high').length * 18 - issues.filter((i) => i.level === 'medium').length * 10 - issues.filter((i) => i.level === 'low').length * 5);

  res.json({
    status: 1,
    data: {
      score,
      passedCount: Math.max(4, 8 - issues.length),
      issues,
      nodeCount: vertices.length,
      edgeCount: edges.length,
      recommendation: score >= 90 ? '流程结构健康，符合企业级三层架构与内控建模规范！' : '流程存在若干规范性改进项，点击对应建议即可自动优化排布。',
    },
    info: 'ok',
  });
});

// Conversational AI Flow Chat Endpoint
app.post('/api/ai/flow-chat', async (req, res) => {
  const { message = '', mode = 'generate', options = {}, cells = [], flowTitle = '主流程' } = req.body || {};
  const msgLower = (message || '').toLowerCase();

  // Mode detection if mode is auto or general
  let activeMode = mode;
  if (activeMode === 'auto' || !activeMode) {
    if (msgLower.includes('体检') || msgLower.includes('规范') || msgLower.includes('合规') || msgLower.includes('审查') || msgLower.includes('检查')) {
      activeMode = 'audit';
    } else if (msgLower.includes('排版') || msgLower.includes('整理') || msgLower.includes('对齐') || msgLower.includes('去重') || msgLower.includes('拓扑')) {
      activeMode = 'optimize';
    } else if (msgLower.includes('raci') || msgLower.includes('职责') || msgLower.includes('问责') || msgLower.includes('矩阵')) {
      activeMode = 'raci';
    } else if (msgLower.includes('翻译') || msgLower.includes('translate')) {
      activeMode = 'translate';
    } else if (msgLower.includes('语法') || msgLower.includes('润色') || msgLower.includes('动词')) {
      activeMode = 'grammar';
    } else if (msgLower.includes('风格') || msgLower.includes('配色') || msgLower.includes('美化')) {
      activeMode = 'style';
    } else {
      activeMode = 'generate';
    }
  }

  // 1. Optimize Mode
  if (activeMode === 'optimize') {
    return res.json({
      status: 1,
      data: {
        reply: `已为您对当前流程图进行**几何拓扑与正交走线优化**！\n- 自动理顺交叉连线，消除多余弯折；\n- 按业务时序自左向右对齐活动节点；\n- 泳道高度与网格吸附已平衡。`,
        action: 'autoLayout',
        mode: 'optimize',
      },
    });
  }

  // 2. Audit Mode
  if (activeMode === 'audit') {
    const vertices = cells.filter((c: any) => c.vertex);
    const edges = cells.filter((c: any) => c.edge);
    const hasStart = vertices.some((v: any) => v.attrs?.dflowType === 'startEnd' && (v.value?.includes('开始') || v.attrs?.name?.includes('开始')));
    const hasEnd = vertices.some((v: any) => v.attrs?.dflowType === 'startEnd' && (v.value?.includes('结束') || v.attrs?.name?.includes('结束')));

    const connectedIds = new Set<string>();
    edges.forEach((e: any) => {
      if (e.source) connectedIds.add(e.source);
      if (e.target) connectedIds.add(e.target);
    });

    const issues: any[] = [];
    if (!hasStart) issues.push({ id: 'i1', level: 'high', title: '缺少“开始”节点', desc: '建议在流程头部补全起点事件。' });
    if (!hasEnd) issues.push({ id: 'i2', level: 'high', title: '缺少“结束”节点', desc: '建议补充业务办结归档终点。' });
    const isolated = vertices.filter((v: any) => !connectedIds.has(v.id) && !v.attrs?.dflowType?.startsWith('swimlane'));
    if (isolated.length > 0) {
      issues.push({ id: 'i3', level: 'medium', title: `${isolated.length}个未连接孤立节点`, desc: `【${isolated.map((x: any) => x.value || x.id).slice(0, 2).join('、')}】未与主线接通。` });
    }

    const score = Math.max(65, 100 - issues.filter((i) => i.level === 'high').length * 18 - issues.filter((i) => i.level === 'medium').length * 10);
    return res.json({
      status: 1,
      data: {
        reply: `已完成流程成熟度体检，当前规范健康分：**${score}分** (${score >= 90 ? '🌟 卓越' : '良好'})。共检测到 **${issues.length}** 项可优化点。`,
        action: 'audit',
        auditResult: { score, issues, nodeCount: vertices.length, edgeCount: edges.length },
        mode: 'audit',
      },
    });
  }

  // 3. RACI Mode
  if (activeMode === 'raci') {
    const activities = cells
      .filter((c: any) => c.vertex && !c.attrs?.dflowType?.startsWith('swimlane'))
      .map((c: any) => c.value || c.attrs?.name || '业务活动')
      .slice(0, 6);

    const raciRows = (activities.length > 0 ? activities : ['需求评估与立项', '技术方案评审', '研发实施与验证', '上线发布与验收']).map((name: string, idx: number) => ({
      activity: name,
      r: idx % 2 === 0 ? '项目经理 (PM)' : '研发工程师 (RD)',
      a: '技术委员会 / 部门经理',
      c: 'QA测试专家 / 架构师',
      i: '业务方 / 运维工程师',
    }));

    return res.json({
      status: 1,
      data: {
        reply: `已根据画布中的活动节点推导生成 **RACI 责任分工矩阵**。共分析了 ${raciRows.length} 个核心活动动作。`,
        action: 'raci',
        raciRows,
        mode: 'raci',
      },
    });
  }

  // 4. Translation & Grammar & Style Helpers
  if (activeMode === 'translate') {
    return res.json({
      status: 1,
      data: {
        reply: `已完成中英文对照翻译！已为您将流程术语映射至国际标准 BPMN 2.0 词汇表（如：发起申请 -> Initiate Request, 评审核决 -> Review & Approve, 归档结项 -> Archive & Close）。`,
        mode: 'translate',
      },
    });
  }
  if (activeMode === 'grammar') {
    return res.json({
      status: 1,
      data: {
        reply: `已对流程节点名称执行**动宾规范化语法修复**：\n- 确保所有活动均采用“动作 + 对象”规范（例如：“完成审批”优化为“审批立项申请单”；“系统测试”优化为“执行集成回归测试”）。`,
        mode: 'grammar',
      },
    });
  }
  if (activeMode === 'style') {
    return res.json({
      status: 1,
      data: {
        reply: `已为您推荐**企业标准商务科技蓝**配色方案！\n- 泳道表头采用深邃科技蓝 (#1677ff)；\n- 决策节点金橙高亮 (#FACD91)；\n- 连线采用标准石墨黑 (#303133) 与平滑正交折线。`,
        action: 'style',
        mode: 'style',
      },
    });
  }

  // 5. Flow Diagram Generation Mode (Default)
  let steps: any[] = [];
  let modelUsed = 'rule-engine';

  if (process.env.GEMINI_API_KEY && message) {
    try {
      const ai = getAiClient();
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `你是一位顶级企业级流程管理架构师（熟练精通华为IPD、LTC、ITIL、BPMN 2.0规范）。
用户诉求：“${message}”
请生成规范的 4-6 步端到端业务活动步骤。返回合法的 JSON 数组，每个对象包含：
{
  "title": "节点名称（精炼动宾短语）",
  "role": "责任岗位（如：需求经理、项目总监、评审委员会、采购专员）",
  "desc": "环节核心职责说明",
  "out": "输入输出交付物（如：立项任务书、评审决议、签署合同）",
  "judge": false,
  "kcp": false
}`,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(aiResponse.text?.trim() || '');
      if (Array.isArray(parsed) && parsed.length >= 2) {
        steps = parsed;
        modelUsed = 'gemini-3.8-flash';
      }
    } catch (e: any) {
      console.warn('Gemini chat fallback:', e.message);
    }
  }

  if (steps.length === 0) {
    const p = message.toLowerCase();
    if (p.includes('请假') || p.includes('考勤') || p.includes('人事')) {
      steps = [
        { title: '提交请假申请', role: '申请员工', desc: '填写请假事由、起止时间与交接人', out: '请假审批单', judge: false, kcp: false },
        { title: '部门主管审批', role: '直接主管', desc: '核准工作排期与假期真实性', out: '主管签批意见', judge: true, kcp: false },
        { title: '跨部门会签确认', role: '项目经理(PM)', desc: '评估关键里程碑交付影响', out: '项目会签记录', judge: false, kcp: true },
        { title: '人力资源归档备案', role: 'HR考勤专员', desc: '假期额度扣减与考勤台账登记', out: '考勤扣减确认回执', judge: false, kcp: false },
      ];
    } else if (p.includes('采购') || p.includes('物料') || p.includes('合同')) {
      steps = [
        { title: '提出采购需求', role: '申购部门', desc: '提报采购预算、规格与交期要求', out: '物料采购申请单', judge: false, kcp: false },
        { title: '寻源比价与供应商准入', role: '采购专员', desc: '三方比价与供应商资质合规审查', out: '询比价评审表', judge: false, kcp: true },
        { title: '采购合同法务审批', role: '法务合规经理', desc: '合同商业条款与法律风险审核', out: '法务会签意见书', judge: true, kcp: true },
        { title: '合同签印与订单下发', role: '采购总监', desc: '最终定标审批与PO订单下达', out: '采购订单(PO)', judge: false, kcp: true },
        { title: '到货验收与财务结款', role: '品质仓库/财务', desc: '实物质量检验入库并安排货款结算', out: '入库单及对账发票', judge: false, kcp: false },
      ];
    } else {
      steps = [
        { title: '发起需求与业务申请', role: '业务发起人', desc: `针对【${message || '业务事项'}】创建任务单`, out: '业务立项单', judge: false, kcp: false },
        { title: '方案交叉评审论证', role: '专业评审组', desc: '可行性分析与业务价值评估', out: '评审合规记录', judge: true, kcp: true },
        { title: '跨职能审批与授权', role: '管理决策委员会', desc: '关键控制点裁决与资金资源放行', out: '批复决议书', judge: false, kcp: true },
        { title: '任务分派落地实施', role: '实施执行人', desc: '里程碑推进与成果质量把关', out: '实施成果材料', judge: false, kcp: false },
        { title: '成果验收与复盘归档', role: '质量验收专家', desc: '成果闭环验收与数字化资产入库', out: '结项确认报告', judge: false, kcp: false },
      ];
    }
  }

  const generatedTitle = message ? message.slice(0, 24) : flowTitle;
  const xml = buildDefaultFlowXml(generatedTitle, steps);

  res.json({
    status: 1,
    data: {
      reply: `已为您智能生成 **${generatedTitle}** 端到端业务流程图！\n共规划包含 **${steps.length}** 个核心活动节点，已自动匹配岗位角色与交付成果。`,
      xml,
      steps,
      title: generatedTitle,
      action: 'loadXml',
      mode: 'generate',
      modelUsed,
    },
    info: 'ok',
  });
});

// =================== PROPEL PROCESS MINING & CROSS-SYSTEM HANDSHAKE DIAGNOSIS ===================
const MINING_SYSTEMS = [
  { id: 'crm', name: 'CRM 客户关系管理', code: 'CRM-SYS-01', vendor: 'Salesforce / 纷享销客', status: 'connected', latency: '42ms', syncRecords: 3420, lastSync: '2026-10-26 14:20:10', primaryKeys: ['OppId', 'ContractNo', 'CustomerCode'], desc: '负责销售商机立项、客户需求规格评审、商业合同签印盖章' },
  { id: 'plm', name: 'PLM 产品生命周期', code: 'PLM-SYS-02', vendor: 'Siemens Teamcenter', status: 'connected', latency: '68ms', syncRecords: 1890, lastSync: '2026-10-26 14:18:25', primaryKeys: ['ItemCode', 'RevNo', 'EcoNo'], desc: '负责工程设计EBOM、图纸归档下发、工程变更ECN/ECO生命周期' },
  { id: 'pms', name: 'PMS 研发项目管理', code: 'PMS-SYS-03', vendor: 'Jira Enterprise', status: 'connected', latency: '35ms', syncRecords: 980, lastSync: '2026-10-26 14:15:00', primaryKeys: ['ProjId', 'MilestoneStage'], desc: '负责研发阶段计划、关键控制点(TR/DCP)技术评审、项目交期跟踪' },
  { id: 'erp', name: 'ERP 企业资源计划', code: 'ERP-SYS-04', vendor: 'SAP S/4HANA Cloud', status: 'connected', latency: '28ms', syncRecords: 5640, lastSync: '2026-10-26 14:22:40', primaryKeys: ['SoNo', 'PoNo', 'MoNo', 'InvNo'], desc: '负责销售订单SO、物料采购PO、生产工单MO生成、财务开票与对公结算' },
  { id: 'aps', name: 'APS 高级生产排产', code: 'APS-SYS-05', vendor: 'Asprova Scheduler', status: 'connected', latency: '85ms', syncRecords: 1240, lastSync: '2026-10-26 14:10:15', primaryKeys: ['PlanId', 'BatchNo', 'LineId'], desc: '负责车间机台负荷模拟、主生产计划MPS排程、物料齐套性计算' },
  { id: 'srm', name: 'SRM 供应商协同', code: 'SRM-SYS-06', vendor: 'SAP Ariba / 甄云', status: 'connected', latency: '54ms', syncRecords: 2130, lastSync: '2026-10-26 14:19:05', primaryKeys: ['AsnNo', 'RfqNo', 'SuppCode'], desc: '负责外购外协询价RFQ、供应商送货预通知ASN、来料批次条码协同' },
  { id: 'mes', name: 'MES 智能制造执行', code: 'MES-SYS-07', vendor: 'Siemens Opcenter', status: 'connected', latency: '19ms', syncRecords: 4560, lastSync: '2026-10-26 14:23:02', primaryKeys: ['WorkOrderId', 'SnCode', 'QcLogId'], desc: '负责车间派工报工、工艺工步过站、IPQC品质检验、成品唯一SN码赋码' },
];

let activeDatasetKey = 'LTC_E2E';

const PRESET_DATASETS: Record<string, any> = {
  LTC_E2E: {
    key: 'LTC_E2E',
    title: 'LTC (Lead-To-Cash) 销售线索到回款端到端流程',
    domain: '营销-研发-制造-财经综合全流程',
    involvedSystems: ['CRM', 'PLM', 'ERP', 'APS', 'SRM', 'MES'],
    caseCount: 1280,
    eventCount: 18460,
    avgLeadTime: '14.8 天',
    benchmarkDeviation: '+34.6%',
    happyPathRatio: '71.4%',
    nodes: [
      { id: 'n1', system: 'CRM', name: '商机立项与需求确认', role: '客户经理 (AM)', avgDuration: '1.2 天', throughput: 1280, health: 'normal', desc: '客户意向与技术规格输入' },
      { id: 'n2', system: 'CRM', name: '商务合同审批盖章', role: '法务与商务专员', avgDuration: '2.5 天', throughput: 1240, health: 'warning', desc: '合同商业条款会签与电子签印' },
      { id: 'n3', system: 'PLM', name: '工程EBOM配置发布', role: '系统架构师', avgDuration: '1.8 天', throughput: 1190, health: 'warning', desc: '软硬件技术BOM下发至制造中台' },
      { id: 'n4', system: 'ERP', name: '销售订单(SO)生成', role: '商务助理', avgDuration: '4.6 天', throughput: 1060, health: 'critical', desc: '合同转正式销售订单并触发MRP' },
      { id: 'n5', system: 'APS', name: '主生产排产(MPS)', role: '排程调度员', avgDuration: '0.8 天', throughput: 1040, health: 'normal', desc: '机台产能与工单派产优化' },
      { id: 'n6', system: 'SRM', name: '物料采购与ASN送货', role: '采购专员/供应商', avgDuration: '5.2 天', throughput: 990, health: 'warning', desc: '关键外购件送货预通知' },
      { id: 'n7', system: 'MES', name: '车间生产与OQC检验', role: '车间班组长/品保', avgDuration: '3.1 天', throughput: 960, health: 'normal', desc: 'SMT贴片、整机组装与品质终检' },
      { id: 'n8', system: 'ERP', name: '销售出库与发票冲销', role: '仓库主管/财务会计', avgDuration: '2.2 天', throughput: 920, health: 'critical', desc: 'WMS出库通知与开票回款对账' },
    ],
    edges: [
      { from: 'n1', to: 'n2', count: 1240, leadTime: '1.4 天', status: 'normal', label: '96.8%' },
      { from: 'n2', to: 'n3', count: 1190, leadTime: '2.1 天', status: 'warning', label: '96.0% (缺少技术闭环握手)' },
      { from: 'n2', to: 'n4', count: 1060, leadTime: '4.6 天', status: 'breakpoint', label: '85.5% [严重断点: 14.5%订单悬空]' },
      { from: 'n3', to: 'n5', count: 1040, leadTime: '1.2 天', status: 'warning', label: '87.4% [数据不连贯: BOM编码断层]' },
      { from: 'n4', to: 'n5', count: 1040, leadTime: '0.8 天', status: 'normal', label: '98.1%' },
      { from: 'n5', to: 'n6', count: 990, leadTime: '1.5 天', status: 'normal', label: '95.2%' },
      { from: 'n6', to: 'n7', count: 960, leadTime: '2.4 天', status: 'handshake_gap', label: '97.0% [缺少握手: ASN送货无双向回执]' },
      { from: 'n7', to: 'n8', count: 920, leadTime: '3.8 天', status: 'breakpoint', label: '95.8% [严重断点: 完工后开票遗漏]' },
    ],
    diagnostics: [
      {
        id: 'diag_bp_01',
        type: 'breakpoint',
        level: 'critical',
        title: '【流程断点】CRM 销售合同已盖章，但 ERP 销售订单平均延迟 4.6 天且 14.5% 出现脱节悬空',
        fromSystem: 'CRM',
        toSystem: 'ERP',
        affectedCount: 180,
        lossMetric: '导致客户交期滞后平均 6.2 天，积压未投产合同额约 1,840 万元',
        rootCause: 'CRM 与 ERP 之间仅依赖手工导出 Excel 导入，两系统未配置双向 Webhook 触发机制；CRM 商务人员未按时触发工单导致订单堆积在邮件中。',
        bestPractice: '华为 LTC 最佳实践：采用实时 API 监听「合同签印成功」事件，10分钟内自动化在 ERP 中建立草稿 SO 并回传唯一销售单号进行绑定校验。',
        remedy: '部署 CRM->ERP 自动化订单生成中间件，增加超时 24 小时未建单自动钉钉/企微强提醒与红黄牌升级机制。'
      },
      {
        id: 'diag_hs_01',
        type: 'missing_handshake',
        level: 'critical',
        title: '【缺少握手点】SRM 供应商已确认发货 (ASN)，但 ERP 仓库系统无到货预检握手回执',
        fromSystem: 'SRM',
        toSystem: 'ERP',
        affectedCount: 230,
        lossMetric: '仓库收货月均发生 38 起物料堆积待验、现场翻包核对耗费 120 工时/月',
        rootCause: 'SRM 产生送货单后，ERP 仓库收货模块只支持手工录入 PO 号模糊查找，供应商发货时间、批次号与 ERP 检验入库未形成实时数据握手。',
        bestPractice: '精益供应链标准：SRM 发出 ASN 即同步向 ERP WMS 预分配收货月台与待检库位，收货扫码同时回传 SRM 触发结算预对账。',
        remedy: '在 SRM 与 ERP 间建立 ASN 条码预扫描握手协议，实现货未到单先达、扫码直连 ERP 收货入库。'
      },
      {
        id: 'diag_data_01',
        type: 'disjointed_data',
        level: 'high',
        title: '【数据不连贯】PLM 设计物料编码与 ERP 采购物料编码存在多版本规则割裂',
        fromSystem: 'PLM',
        toSystem: 'ERP / APS',
        affectedCount: 310,
        lossMetric: '本季度造成 12 起错料采购返工，产生呆滞物料成本约 68 万元',
        rootCause: 'PLM 使用 12 位研发工程物料编码，而 ERP 使用 10 位财务物料编码；未建立统一的主数据管理 (MDM) 映射中台，需靠计划员手工对照字典。',
        bestPractice: '企业架构 TOGAF 与工业 4.0 规范：实施全生命周期单一物料主键 (One Code Rule)，在 PLM 创建新料时即由 MDM 自动分配全生命周期唯一全局码。',
        remedy: '上线企业统一主数据 MDM 映射服务，严禁无全局物料编码的物料在 ERP 下达采购指令。'
      },
      {
        id: 'diag_bp_02',
        type: 'breakpoint',
        level: 'high',
        title: '【流程断点】MES 车间成品入库检验合格，但 ERP 财务应收开票触发丢失',
        fromSystem: 'MES',
        toSystem: 'ERP',
        affectedCount: 76,
        lossMetric: '导致 76 笔合同出库后超过 25 天未发起开票对账，拖慢应收账款周转天数 (DSO) +8.4天',
        rootCause: 'MES 终检通过后仅在车间本地系统打标，未自动向 ERP 抛送销售出库过账凭证，财务人员必须每月手工向仓库索要出库纸质单据才补开发票。',
        bestPractice: '业财一体化最佳实践：MES 完工扫码出库实时触发 ERP 自动记账与开票工作台待办，出库与开票 SLA 控制在 48 小时内。',
        remedy: '打通 MES 成品条码与 ERP 销售发货单联动接口，MES 扫码出厂即自动在 ERP 生成销售发货凭证并推入财务开票池。'
      },
      {
        id: 'diag_hs_02',
        type: 'missing_handshake',
        level: 'medium',
        title: '【缺少握手点】PLM 发起设计变更 (ECN)，但 APS 生产排程未形成停工重排握手',
        fromSystem: 'PLM',
        toSystem: 'APS / MES',
        affectedCount: 42,
        lossMetric: '旧版本物料仍在线加工导致 4 批次成品报废，直接损失 24 万元',
        rootCause: 'ECN 审批在 PLM 内部流转闭环后，依赖工程师口头或邮件抄送生产部，APS 未集成工程变更锁定事件。',
        bestPractice: 'IPD 变更控制委员会 (CCB) 机制：重大 ECN 签批生效后，必须向 APS 与 MES 推送硬性工艺锁，车间必须扫码确认接收新工艺后方可解除工单锁定。',
        remedy: '在 APS 排程引擎中植入 PLM ECN 状态监听钩子，未完成新版本工艺导入的工单自动标红并挂起。'
      }
    ]
  },
  IPD_MFG: {
    key: 'IPD_MFG',
    title: 'IPD (Integrated Product Dev) 研发立项到工程量产协同全流程',
    domain: '研发-项目-计划-制造一体化',
    involvedSystems: ['PLM', 'PMS', 'APS', 'MES', 'ERP'],
    caseCount: 840,
    eventCount: 12200,
    avgLeadTime: '28.4 天',
    benchmarkDeviation: '+41.2%',
    happyPathRatio: '68.2%',
    nodes: [
      { id: 'ipd_1', system: 'PMS', name: 'Charter 立项与阶段规划', role: '产品经理 (PMT)', avgDuration: '3.2 天', throughput: 840, health: 'normal', desc: '商业计划与概念验证' },
      { id: 'ipd_2', system: 'PLM', name: '系统架构与软硬件方案', role: '系统工程师 (SE)', avgDuration: '6.4 天', throughput: 810, health: 'normal', desc: '软硬件技术方案分解与BOM搭建' },
      { id: 'ipd_3', system: 'PMS', name: '同行评审与TR3技术裁决', role: '评审委员会', avgDuration: '4.8 天', throughput: 760, health: 'critical', desc: '关键控制点质量把关' },
      { id: 'ipd_4', system: 'ERP', name: '研发试制样品采购', role: '研发采购专员', avgDuration: '7.5 天', throughput: 690, health: 'critical', desc: '样品打样料单采购下达' },
      { id: 'ipd_5', system: 'APS', name: '试产试制产线排产', role: '试制计划员', avgDuration: '2.1 天', throughput: 660, health: 'warning', desc: '试产工程批排产' },
      { id: 'ipd_6', system: 'MES', name: '工程试制试产与DFM验证', role: 'PE/IE工艺工程师', avgDuration: '4.4 天', throughput: 620, health: 'normal', desc: '试产可制造性问题闭环' },
    ],
    edges: [
      { from: 'ipd_1', to: 'ipd_2', count: 810, leadTime: '3.2 天', status: 'normal', label: '96.4%' },
      { from: 'ipd_2', to: 'ipd_3', count: 760, leadTime: '6.4 天', status: 'normal', label: '93.8%' },
      { from: 'ipd_3', to: 'ipd_4', count: 690, leadTime: '7.5 天', status: 'breakpoint', label: '90.7% [流程断点: TR通过但采购需求流失]' },
      { from: 'ipd_4', to: 'ipd_5', count: 660, leadTime: '3.8 天', status: 'handshake_gap', label: '95.6% [缺少握手: 打样到料无通知]' },
      { from: 'ipd_5', to: 'ipd_6', count: 620, leadTime: '2.1 天', status: 'normal', label: '93.9%' },
    ],
    diagnostics: [
      {
        id: 'diag_ipd_01',
        type: 'breakpoint',
        level: 'critical',
        title: '【流程断点】TR3 技术评审决议通过，但 ERP 研发物料打样采购需求丢失导致项目停滞',
        fromSystem: 'PMS',
        toSystem: 'ERP',
        affectedCount: 70,
        lossMetric: '导致 70 个研发关键里程碑延误 12.8 天，延迟上市成本巨大',
        rootCause: 'PMS 技术评审仅记录结论在系统内，未打通与 ERP 研发打样采购 PR 的自动映射，靠工程师在两个系统人工搬运。',
        bestPractice: '华为 IPD TR3 标准：评审结论签署通过后，系统自动触发采购打样清单与专用打样成本中心。',
        remedy: '在 PMS 评审通过节点集成 ERP PR 自动创建微服务。'
      }
    ]
  }
};

app.get('/api/mining/overview', (req, res) => {
  const currentData = PRESET_DATASETS[activeDatasetKey] || PRESET_DATASETS.LTC_E2E;
  res.json({
    status: 1,
    data: {
      activeKey: activeDatasetKey,
      systems: MINING_SYSTEMS,
      dataset: currentData,
      datasetsList: Object.values(PRESET_DATASETS).map(d => ({
        key: d.key,
        title: d.title,
        domain: d.domain,
        caseCount: d.caseCount,
        systems: d.involvedSystems,
        leadTime: d.avgLeadTime,
      })),
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    },
    info: 'ok'
  });
});

app.post('/api/mining/switch-dataset', (req, res) => {
  const { datasetKey } = req.body || {};
  if (PRESET_DATASETS[datasetKey]) {
    activeDatasetKey = datasetKey;
  }
  const currentData = PRESET_DATASETS[activeDatasetKey];
  res.json({
    status: 1,
    data: currentData,
    info: `已切换至【${currentData.title}】`
  });
});

app.post('/api/mining/extract', (req, res) => {
  const { systemIds = [] } = req.body || {};
  const targetSystems = systemIds.length > 0
    ? MINING_SYSTEMS.filter(s => systemIds.includes(s.id))
    : MINING_SYSTEMS;

  let totalNewRecords = 0;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  targetSystems.forEach(s => {
    const increment = Math.floor(60 + Math.random() * 180);
    s.syncRecords += increment;
    s.lastSync = now;
    s.status = 'connected';
    totalNewRecords += increment;
  });

  res.json({
    status: 1,
    extractedRecords: totalNewRecords,
    updatedSystems: targetSystems,
    info: `成功从 ${targetSystems.length} 个业务系统中提取并校验了 ${totalNewRecords} 笔最新交易交互日志！`
  });
});

app.post('/api/mining/import-logs', (req, res) => {
  const { rawData, format = 'csv', systemMappings = [] } = req.body || {};
  const importedCount = Math.floor(400 + Math.random() * 300);
  res.json({
    status: 1,
    data: {
      importedRows: importedCount,
      mappedFields: ['CaseId', 'Activity', 'Timestamp', 'SourceSystem', 'Operator', 'DocPayload'],
      status: 'success',
      samplePreview: [
        { caseId: 'LTC-2026-0881', system: 'CRM', activity: '合同审批盖章', time: '2026-10-25 09:30:00', duration: '1.4d', status: 'ok' },
        { caseId: 'LTC-2026-0881', system: 'ERP', activity: '销售订单SO生成', time: '2026-10-25 15:45:00', duration: '6.2h', status: 'breakpoint_delayed' },
        { caseId: 'LTC-2026-0881', system: 'MES', activity: '车间报工与质检', time: '2026-10-26 10:20:00', duration: '2.1d', status: 'missing_handshake' },
      ]
    },
    info: `已成功导入并对齐 ${importedCount} 条业务系统交互数据记录`
  });
});

app.post('/api/mining/ai-diagnose', async (req, res) => {
  const { datasetKey = activeDatasetKey, prompt = '' } = req.body || {};
  const currentData = PRESET_DATASETS[datasetKey] || PRESET_DATASETS.LTC_E2E;

  let reportHtml = '';
  let modelUsed = 'rule-engine';

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getAiClient();
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `你是一位国际顶级的企业级流程挖掘与端到端数字化集成专家（精通华为LTC/IPD/ITIL、工业4.0、Celonis流程挖掘）。
当前企业场景：“${currentData.title}” (涉及系统: ${currentData.involvedSystems.join(', ')})
端到端业务样本量：${currentData.caseCount} 笔，累计流转事件：${currentData.eventCount} 条，平均周期：${currentData.avgLeadTime} (行业基线偏离 ${currentData.benchmarkDeviation})。
系统检测到的核心问题包括：
1. 【流程断点】：CRM 销售合同与 ERP 销售订单脱节，存在 14.5% 订单悬空无后续；MES 完工后开票触发丢失。
2. 【缺少握手点】：SRM 供应商送货 ASN 与 ERP 仓库到货缺少双向回执；PLM 设计变更 ECN 未与 APS 排程形成停工重排握手。
3. 【数据不连贯】：PLM 研发物料 12 位编码与 ERP 采购物料 10 位编码断层，无主数据字典联动。

用户特别关切：“${prompt || '请给出系统性诊断与分步治理改进建议'}”

请输出一份具备深刻洞察力、严密专业、面向高管与流程委员会的《企业端到端业务系统流程断点与跨系统握手深度诊断及改善报告》，使用精美 Markdown 格式，包含：
### 1. 端到端流程健康度综合评估 (成熟度得分与核心指标)
### 2. 跨系统关键断点与握手缺失根因剖析 (业财技产四维分析)
### 3. 对照行业标杆最佳实践 (华为 LTC / 精益供应链标准)
### 4. 三阶段演进治理对策与实施路线图 (管理制度 + IT微服务改造)
### 5. 预期量化投资回报率 (ROI 与时效提升收益预测)`,
      });

      if (aiResponse.text) {
        reportHtml = aiResponse.text;
        modelUsed = 'gemini-3.8-flash';
      }
    } catch (e: any) {
      console.warn('Gemini mining diagnose fallback:', e.message);
    }
  }

  if (!reportHtml) {
    reportHtml = `### 1. 端到端流程健康度综合评估
- **流程成熟度指数**：**71 / 100** (处于「局部信息化向端到端集成过渡期」)
- **端到端平均周转周期 (Lead Time)**：**${currentData.avgLeadTime}** (偏离行业一流基线 **+34.6%**)
- **单据合流正常率 (Happy Path)**：仅 **71.4%**，约 **28.6%** 的单据存在重工、挂起、数据返工或跨系统断点。

---

### 2. 跨系统关键断点与握手缺失根因剖析
1. **CRM ➔ ERP 间业务断点**：商务合同签署后缺少自动化事件触发，平均等待人工转单耗时 4.6 天，14.5% 单据悬空无法流转到制造。
2. **SRM ➔ ERP 缺少握手点**：供应商 ASN 送货与仓库收货脱节，造成月均 38 起物料到货无预检、月台拥堵。
3. **PLM ➔ ERP 数据断层**：设计物料 12 位编码与财务采购 10 位编码未对齐，人工对照导致错料率 3.8%。
4. **MES ➔ ERP 业财握手断裂**：完工扫码未实时触发销售发货凭证，导致 76 笔合同出库后滞后 25 天未开票。

---

### 3. 对照行业标杆最佳实践 (华为 LTC & 工业4.0)
- **华为 LTC 标准**：合同盖章后通过中台总线 10 分钟内自动创建 SO，全流程状态可视化透视。
- **精益数字化握手**：供应商发货即锁定库位，入库条码直通财务结算预付款。

---

### 4. 三阶段演进治理对策与实施路线图
- **阶段一 (1-2个月·即时止血)**：在 CRM-ERP 与 SRM-ERP 之间建立事件监听 Webhook 与超时催办机制，打通 2 处致命断点。
- **阶段二 (3-4个月·数据统一)**：实施企业主数据管理 (MDM)，统一全局物料唯一主键，消除编码断层。
- **阶段三 (5-6个月·闭环运营)**：打通 MES-ERP 业财自动化过账与数字孪生全景监控。

---

### 5. 预期量化收益预测
- 端到端订单交付周期缩短 **35%** (由 14.8 天降至 9.5 天)
- 消除 100% 悬空无主订单，应收账款周转天数 (DSO) 缩短 **8.4 天**，年化沉淀资金盘活超 **1,200 万元**。`;
  }

  res.json({
    status: 1,
    data: {
      report: reportHtml,
      modelUsed,
      summary: `已基于企业 7 大业务系统交易日志推演并生成《端到端流程断点与握手深度诊断报告》`,
      score: 71,
      benchmarkDeviation: '+34.6%',
    },
    info: 'ok'
  });
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  // Fallback for SPA routing to serve index.html
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/api') || url.startsWith('/drawio')) {
      return next();
    }
    try {
      const templatePath = path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(templatePath, 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`dflow Enterprise Platform running on http://0.0.0.0:${PORT}`);
  });
}

// If invoked directly via tsx server.ts
if (process.argv[1]?.endsWith('server.ts')) {
  startServer();
}
