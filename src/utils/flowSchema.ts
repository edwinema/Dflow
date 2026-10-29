export interface ShapeItem {
  label: string;
  type: string;
  w: number;
  h: number;
  style: string;
  dotColor: string;
  group: 'flow' | 'basic' | 'evc' | 'swimlane';
}

export const FLOW_SHAPES: ShapeItem[] = [
  { label: '串行活动', type: 'nodeActiveSerialRect', w: 110, h: 64, style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '活动节点', type: 'nodeActiveFlow', w: 100, h: 50, style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '判断节点', type: 'nodeActiveJudge', w: 120, h: 56, style: 'rhombus;whiteSpace=wrap;html=1;fillColor=#eef6ff;strokeColor=#409eff;', dotColor: '#79bbff', group: 'flow' },
  { label: '角色名称', type: 'nodeRoleName', w: 100, h: 50, style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FACD91;strokeColor=#333333;', dotColor: '#FACD91', group: 'flow' },
  { label: '虚拟角色', type: 'nodeVirtualRoleName', w: 100, h: 50, style: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#FACD91;strokeColor=#333333;', dotColor: '#FACD91', group: 'flow' },
  { label: '文档资料', type: 'nodeFile', w: 100, h: 50, style: 'shape=document;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '开始/结束', type: 'startEnd', w: 96, h: 44, style: 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;', dotColor: '#67c23a', group: 'flow' },
  { label: '外部数据', type: 'nodeActiveOutData', w: 100, h: 50, style: 'shape=step;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '子流程', type: 'nodeActiveSubFlow', w: 100, h: 50, style: 'shape=process;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '预备节点', type: 'nodeActiveReady', w: 100, h: 50, style: 'shape=hexagon;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '人工输入', type: 'nodeActivePersonInput', w: 100, h: 50, style: 'shape=manualInput;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '批注说明', type: 'nodeActiveNotes', w: 100, h: 50, style: 'shape=note;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '人工操作', type: 'nodeActivePersonOpe', w: 100, h: 50, style: 'shape=trapezoid;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '数据库', type: 'nodeActiveDataBase', w: 100, h: 54, style: 'shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '引用节点', type: 'nodeActiveQuote', w: 100, h: 50, style: 'shape=note2;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '卡片节点', type: 'nodeActiveDisplay', w: 100, h: 50, style: 'shape=card;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '内部存储', type: 'nodeActiveInsideData', w: 100, h: 50, style: 'shape=internalStorage;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '流程数据', type: 'nodeActiveData', w: 110, h: 50, style: 'shape=parallelogram;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '卡片说明', type: 'nodeActiveCard', w: 100, h: 50, style: 'shape=card;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
  { label: '队列数据', type: 'nodeActiveQueueData', w: 100, h: 50, style: 'shape=module;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;', dotColor: '#409eff', group: 'flow' },
];

export const BASIC_SHAPES: ShapeItem[] = [
  { label: '文本', type: 'defaultText', w: 100, h: 40, style: 'text=1;html=1;align=center;verticalAlign=middle;', dotColor: '#909399', group: 'basic' },
  { label: '便签', type: 'defaultNote', w: 96, h: 72, style: 'shape=note;whiteSpace=wrap;html=1;fillColor=#fff9db;strokeColor=#e6a23c;', dotColor: '#e6a23c', group: 'basic' },
  { label: '圆角矩形', type: 'defaultCapsule', w: 100, h: 44, style: 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '圆形', type: 'defaultOval', w: 100, h: 60, style: 'ellipse;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '矩形', type: 'defaultRect', w: 100, h: 50, style: 'rounded=0;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '圆角正方', type: 'defaultCirSquare', w: 100, h: 50, style: 'rounded=1;arcSize=20;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '三角形', type: 'defaultTriangle', w: 90, h: 76, style: 'shape=triangle;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '菱形', type: 'defaultDiamond', w: 100, h: 60, style: 'shape=rhombus;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '五边形', type: 'defaultPentagon', w: 90, h: 84, style: 'shape=pentagon;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '六边形', type: 'defaultHexagon', w: 100, h: 60, style: 'shape=hexagon;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '八边形', type: 'defaultOctagon', w: 90, h: 90, style: 'shape=octagon;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '五角星', type: 'defaultFivePointedStar', w: 86, h: 86, style: 'shape=star;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '云形', type: 'defaultCloud', w: 106, h: 70, style: 'shape=cloud;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '十字形', type: 'defaultCross', w: 80, h: 80, style: 'shape=cross;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '对话框', type: 'defaultDialogue', w: 110, h: 60, style: 'shape=callout;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
  { label: '大括号', type: 'defaultBrace', w: 70, h: 44, style: 'text=1;fontSize=20;', dotColor: '#909399', group: 'basic' },
  { label: '中括号', type: 'defaultBrackets', w: 70, h: 44, style: 'text=1;fontSize=20;', dotColor: '#909399', group: 'basic' },
  { label: '双向箭头', type: 'defaultArrowDouble', w: 100, h: 40, style: 'shape=doubleArrow;', dotColor: '#909399', group: 'basic' },
  { label: '单向箭头', type: 'lineArrowRight', w: 100, h: 34, style: 'shape=singleArrow;', dotColor: '#909399', group: 'basic' },
  { label: '门形', type: 'defaultPortal', w: 84, h: 86, style: 'shape=door;whiteSpace=wrap;html=1;', dotColor: '#909399', group: 'basic' },
];

export const EVC_SHAPES: ShapeItem[] = [
  {
    label: '右向燕尾',
    type: 'evcChevronRight',
    w: 140,
    h: 54,
    style: 'shape=evcChevronRight;whiteSpace=wrap;html=1;fillColor=#ecf5ff;strokeColor=#409eff;fontColor=#1f2733;',
    dotColor: '#409eff',
    group: 'evc',
  },
  {
    label: '左向燕尾',
    type: 'evcChevronLeft',
    w: 140,
    h: 54,
    style: 'shape=evcChevronLeft;whiteSpace=wrap;html=1;fillColor=#ecf5ff;strokeColor=#409eff;fontColor=#1f2733;',
    dotColor: '#409eff',
    group: 'evc',
  },
  {
    label: '右向平尾',
    type: 'evcPentagonRight',
    w: 140,
    h: 54,
    style: 'shape=evcPentagonRight;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;fontColor=#1f2733;',
    dotColor: '#67c23a',
    group: 'evc',
  },
  {
    label: '左向平尾',
    type: 'evcPentagonLeft',
    w: 140,
    h: 54,
    style: 'shape=evcPentagonLeft;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;fontColor=#1f2733;',
    dotColor: '#67c23a',
    group: 'evc',
  },
  {
    label: '向上尖头',
    type: 'evcPentagonUp',
    w: 110,
    h: 64,
    style: 'shape=evcPentagonUp;whiteSpace=wrap;html=1;fillColor=#fdf6ec;strokeColor=#e6a23c;fontColor=#1f2733;',
    dotColor: '#e6a23c',
    group: 'evc',
  },
  {
    label: '向下尖头',
    type: 'evcPentagonDown',
    w: 110,
    h: 64,
    style: 'shape=evcPentagonDown;whiteSpace=wrap;html=1;fillColor=#fdf6ec;strokeColor=#e6a23c;fontColor=#1f2733;',
    dotColor: '#e6a23c',
    group: 'evc',
  },
];

export const SWIMLANE_SHAPES: ShapeItem[] = [
  {
    label: '垂直泳道池(2道)',
    type: 'swimlanePoolV',
    w: 560,
    h: 540,
    style: 'shape=swimlanePoolV;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1f2733;',
    dotColor: '#606266',
    group: 'swimlane',
  },
  {
    label: '垂直单泳道',
    type: 'swimlaneV',
    w: 280,
    h: 540,
    style: 'shape=swimlaneV;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1f2733;',
    dotColor: '#606266',
    group: 'swimlane',
  },
  {
    label: '水平分隔线',
    type: 'swimlaneSepH',
    w: 520,
    h: 24,
    style: 'shape=swimlaneSepH;whiteSpace=wrap;html=1;strokeColor=#1f2733;strokeWidth=1.8;',
    dotColor: '#909399',
    group: 'swimlane',
  },
  {
    label: '垂直分隔线',
    type: 'swimlaneSepV',
    w: 24,
    h: 480,
    style: 'shape=swimlaneSepV;whiteSpace=wrap;html=1;strokeColor=#1f2733;strokeWidth=1.8;',
    dotColor: '#909399',
    group: 'swimlane',
  },
  {
    label: '水平泳道池(2道)',
    type: 'swimlanePoolH',
    w: 720,
    h: 420,
    style: 'shape=swimlanePoolH;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1f2733;',
    dotColor: '#606266',
    group: 'swimlane',
  },
  {
    label: '水平单泳道',
    type: 'swimlaneH',
    w: 720,
    h: 220,
    style: 'shape=swimlaneH;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#1f2733;',
    dotColor: '#606266',
    group: 'swimlane',
  },
];

export interface ParsedFlowNodeRow {
  id: string;
  serialNo: string;
  name: string;
  roles: string;
  raciR?: string;
  raciA?: string;
  raciC?: string;
  raciI?: string;
  desc: string;
  in: string;
  out: string;
  attachments: string;
  execute: string;
  kcp: string;
  kpi: string;
  kpidesc: string;
  rights: string;
  duration: string;
  mark: string;
}

function safeParseArray(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'object' ? item.label || item.name || item.id : String(item)));
    }
  } catch {
    return [val];
  }
  return [];
}

export function parseFlowNodes(xmlString: string): ParsedFlowNodeRow[] {
  if (!xmlString || !xmlString.trim()) return [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const userObjects = Array.from(doc.querySelectorAll('UserObject'));
    const rows: ParsedFlowNodeRow[] = [];
    let index = 1;
    userObjects.forEach((uo) => {
      const dflowType = uo.getAttribute('dflowType') || '';
      if (!dflowType.startsWith('nodeActive') && !dflowType.startsWith('evc')) return;
      const rawLabel = uo.getAttribute('label') || '';
      const nameAttr = uo.getAttribute('name') || rawLabel.replace(/\n/g, ' ');
      const roles = safeParseArray(uo.getAttribute('roles')).join(' ') || '未配置';
      const raciR = safeParseArray(uo.getAttribute('raciR')).join(' ') || roles;
      const raciA = uo.getAttribute('raciA') || '-';
      const raciC = safeParseArray(uo.getAttribute('raciC')).join(' ') || '-';
      const raciI = safeParseArray(uo.getAttribute('raciI')).join(' ') || '-';
      const execute = safeParseArray(uo.getAttribute('execute')).join(' ') || '-';
      const rights = safeParseArray(uo.getAttribute('rights')).join(' ') || '-';
      const inFiles = safeParseArray(uo.getAttribute('inFileList'));
      const outFiles = safeParseArray(uo.getAttribute('outFileList'));
      const kcp = uo.getAttribute('kcp') === 'true' ? '关键控制点(KCP)' : '常规节点';
      const target = uo.getAttribute('target') || '0';
      const timeType = uo.getAttribute('timeType') || '天';

      rows.push({
        id: uo.getAttribute('id') || `row_${index}`,
        serialNo: `0${index}`,
        name: nameAttr,
        roles,
        raciR,
        raciA,
        raciC,
        raciI,
        desc: uo.getAttribute('desc') || '-',
        in: uo.getAttribute('in') || '-',
        out: uo.getAttribute('out') || '-',
        attachments: [...inFiles, ...outFiles].join(' ') || '-',
        execute,
        kcp,
        kpi: uo.getAttribute('kpi') || '-',
        kpidesc: uo.getAttribute('kpidesc') || '-',
        rights,
        duration: Number(target) > 0 ? `${target}${timeType}` : '-',
        mark: uo.getAttribute('mark') || '-',
      });
      index++;
    });
    return rows;
  } catch {
    return [];
  }
}

export function buildArchTreeXml(archList: any[], flowsList: any[]): string {
  const root = archList.find((a) => !a.parentId) || { id: 'arch_root', label: '企业流程架构全景' };
  const l1List = archList.filter((a) => a.parentId === root.id);

  const lines: string[] = [
    '<mxfile host="dflow.local" version="32.1.0">',
    '  <diagram id="dflow-arch" name="流程架构全景图">',
    '    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200">',
    '      <root>',
    '        <mxCell id="0"/>',
    '        <mxCell id="1" parent="0"/>',
    `        <UserObject id="${root.id}" label="${root.label}" dflowType="nodeActiveFlow" name="${root.label}" desc="流程顶层">`,
    '          <mxCell style="rounded=1;arcSize=15;whiteSpace=wrap;html=1;fillColor=#409eff;strokeColor=#2b7cd3;fontColor=#ffffff;" vertex="1" parent="1">',
    '            <mxGeometry x="380" y="50" width="240" height="54" as="geometry"/>',
    '          </mxCell>',
    '        </UserObject>',
  ];

  l1List.forEach((l1, idx) => {
    const l1X = 120 + idx * 280;
    const l1Y = 170;
    lines.push(
      `        <UserObject id="${l1.id}" label="${l1.label}" dflowType="nodeActiveSerialRect" name="${l1.label}" desc="L1业务流程域">`,
      '          <mxCell style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#409eff;" vertex="1" parent="1">',
      `            <mxGeometry x="${l1X}" y="${l1Y}" width="180" height="56" as="geometry"/>`,
      '          </mxCell>',
      '        </UserObject>',
      `        <mxCell id="edge_root_${idx}" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#409eff;strokeWidth=2;endArrow=block;" edge="1" parent="1" source="${root.id}" target="${l1.id}">`,
      '          <mxGeometry relative="1" as="geometry"/>',
      '        </mxCell>'
    );

    const children = archList.filter((a) => a.parentId === l1.id);
    children.forEach((l2, cIdx) => {
      const l2X = l1X;
      const l2Y = 280 + cIdx * 95;
      lines.push(
        `        <UserObject id="${l2.id}" label="${l2.label}" dflowType="nodeActiveFlow" name="${l2.label}" desc="L2流程组">`,
        '          <mxCell style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;" vertex="1" parent="1">',
        `            <mxGeometry x="${l2X}" y="${l2Y}" width="180" height="48" as="geometry"/>`,
        '          </mxCell>',
        '        </UserObject>',
        `        <mxCell id="edge_${l1.id}_${cIdx}" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#909399;strokeWidth=1.5;endArrow=block;" edge="1" parent="1" source="${l1.id}" target="${l2.id}">`,
        '          <mxGeometry relative="1" as="geometry"/>',
        '        </mxCell>'
      );

      const childFlows = flowsList.filter((f) => f.parentId === l2.id);
      childFlows.slice(0, 1).forEach((fl) => {
        const flY = l2Y + 68;
        lines.push(
          `        <UserObject id="${fl.id}" label="${fl.label}" dflowType="nodeRoleName" name="${fl.label}" desc="${fl.purpose || 'L3业务流程'}">`,
          '          <mxCell style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FACD91;strokeColor=#333333;" vertex="1" parent="1">',
          `            <mxGeometry x="${l2X}" y="${flY}" width="180" height="46" as="geometry"/>`,
          '          </mxCell>',
          '        </UserObject>',
          `        <mxCell id="edge_fl_${fl.id}" value="" style="edgeStyle=orthogonalEdgeStyle;strokeColor=#e6a23c;strokeWidth=1.5;endArrow=block;" edge="1" parent="1" source="${l2.id}" target="${fl.id}">`,
          '          <mxGeometry relative="1" as="geometry"/>',
          '        </mxCell>'
        );
      });
    });
  });

  lines.push('      </root>', '    </mxGraphModel>', '  </diagram>', '</mxfile>');
  return lines.join('\n');
}
