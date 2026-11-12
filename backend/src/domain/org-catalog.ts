import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { Registry, State } from './types';

export function registerOrgCatalog(app: Registry, state: State) {
  for (const [path, key, code, name] of [
    ['/api/org/positions', 'orgPositions', 'postCode', 'postName'],
    ['/api/org/job-titles', 'orgJobTitles', 'jobCode', 'jobName'],
    ['/api/org/jobs', 'orgJobTitles', 'jobCode', 'jobName'],
  ]) {
    const position = key === 'orgPositions';
    const title = position ? '岗位' : '职位';
    const normalize = (item: any, index: number) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new BadRequestException(`第${index + 1}行格式错误`);
      const value = (field: string, alias: string, required = false) => {
        const raw = item[field] ?? item[alias] ?? '';
        if (typeof raw !== 'string' || raw.length > 500 || (required && !raw.trim())) throw new BadRequestException(`第${index + 1}行：${alias}${required ? '不能为空且' : ''}必须为不超过500字符的文本`);
        return raw.trim();
      };
      const sort = item.sort ?? item['排序号'] ?? 0;
      if (!/^\d+$/.test(String(sort)) || Number(sort) > 1000000) throw new BadRequestException(`第${index + 1}行：排序号必须为0–1000000的整数`);
      const status = String(item.status ?? item['状态'] ?? '0').trim();
      if (!['0', '1', '正常', '停用'].includes(status)) throw new BadRequestException(`第${index + 1}行：状态应为正常或停用`);
      const row: any = { [code]: value(code, `${title}编号`, true), [name]: value(name, `${title}名称`, true),
        sort: Number(sort), status: ['1', '停用'].includes(status) ? '1' : '0', remark: value('remark', '职责概述') };
      if (position) {
        const deptCode = value('deptCode', '部门编号');
        const deptName = value('deptName', '归属部门');
        const matches = state.orgDepts.filter((d: any) => item.deptId ? d.id === item.deptId : deptCode ? d.deptCode === deptCode : deptName && d.deptName === deptName);
        if (matches.length > 1) throw new BadRequestException(`第${index + 1}行：部门名称重复，请使用部门编号`);
        const dept = matches[0];
        if (!dept) throw new BadRequestException(`第${index + 1}行：部门编号不存在，请先维护部门组织`);
        Object.assign(row, { deptId: dept.id, deptCode: dept.deptCode, deptName: dept.deptName });
      } else Object.assign(row, { rankLevel: value('rankLevel', '职级等阶'), jobSeries: value('jobSeries', '所属职系') });
      return row;
    };
    const rows = (body: any) => {
      let items = body.items;
      if (body.rawData !== undefined) {
        if (typeof body.rawData !== 'string' || !body.rawData.trim() || body.rawData.length > 1000000) throw new BadRequestException('请选择不超过1MB的UTF-8 CSV文件');
        try { items = parse(body.rawData, { columns: true, bom: true, skip_empty_lines: true, trim: true, max_record_size: 20000 }); }
        catch { throw new BadRequestException('CSV格式无效，请使用本页下载的模板'); }
      }
      if (!Array.isArray(items) || !items.length || items.length > 1000) throw new BadRequestException('每次导入1–1000条记录');
      const normalized = items.map(normalize), seen = new Set<string>();
      for (const item of normalized) {
        const identity = item[code].toLowerCase();
        if (seen.has(identity)) throw new ConflictException(`导入文件中${title}编号重复：${item[code]}`);
        if (state[key].some((saved: any) => String(saved[code]).toLowerCase() === identity)) throw new ConflictException(`${title}编号已存在：${item[code]}，请修改编号后再导入`);
        seen.add(identity);
      }
      return normalized;
    };
    const save = (items: any[]) => {
      const now = new Date().toISOString();
      const created = items.map(item => ({ ...item, id: randomUUID(), createTime: now }));
      state[key].push(...created);
      state[key].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0) || String(a[code]).localeCompare(String(b[code]), 'zh-CN', { numeric: true }));
      return created;
    };
    const find = (id: string) => {
      const row = state[key].find((item: any) => item.id === id);
      if (!row) throw new NotFoundException(`${title}不存在`);
      return row;
    };
    const remove = (ids: string[]) => {
      const targets = ids.map(find);
      for (const row of targets) {
        const used = state.orgUsers.some((user: any) => position
          ? user.positionId === row.id || user.postId === row.id || user.postCode === row[code] || user.positionName === row[name]
          : user.jobId === row.id || user.jobTitleId === row.id || user.jobCode === row[code] || user.jobName === row[name] || user.jobTitle === row[name]);
        const roleUsed = position && state.buildProcessRoles.some((role: any) => Array.isArray(role.boundPositions) && role.boundPositions.some((value: any) => [row.id, row[code], row[name]].includes(typeof value === 'string' ? value : value?.id ?? value?.postName)));
        if (used || roleUsed) throw new ConflictException(`${title}仍被用户或流程角色引用，请先解除关联`);
      }
      for (const row of targets) state[key].splice(state[key].indexOf(row), 1);
    };
    app.get(path, (_req, res) => res.json({ status: 1, data: state[key], info: 'ok' }));
    app.post(path, (req, res) => {
      const created = save(rows({ items: [req.body] }));
      return res.json({ status: 1, data: created[0], list: state[key], info: `${title}已新增` });
    });
    app.put(`${path}/:id`, (req, res) => {
      const current = find(req.params.id);
      const candidate = { ...current, ...req.body };
      if (position && req.body.deptId === undefined) {
        if (req.body.deptCode !== undefined && req.body.deptCode !== current.deptCode) candidate.deptId = undefined;
        else if (req.body.deptName !== undefined && req.body.deptName !== current.deptName) { candidate.deptId = undefined; candidate.deptCode = ''; }
      }
      const updated = normalize(candidate, 0);
      if (state[key].some((row: any) => row.id !== current.id && String(row[code]).toLowerCase() === updated[code].toLowerCase())) throw new ConflictException(`${title}编号已存在`);
      // Names are stored in legacy user/role records; keep those references consistent.
      const previousName = current[name], previousCode = current[code];
      for (const user of state.orgUsers) {
        if (position) {
          if (user.positionName === previousName) user.positionName = updated[name];
          if (user.postCode === previousCode) user.postCode = updated[code];
        } else {
          for (const field of ['jobName', 'jobTitle']) if (user[field] === previousName) user[field] = updated[name];
          if (user.jobCode === previousCode) user.jobCode = updated[code];
        }
      }
      if (position) for (const role of state.buildProcessRoles) if (Array.isArray(role.boundPositions)) role.boundPositions = role.boundPositions.map((value: any) => value === previousName ? updated[name] : value === previousCode ? updated[code] : value);
      Object.assign(current, updated, { updateTime: new Date().toISOString() });
      state[key].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
      return res.json({ status: 1, data: current, list: state[key], info: `${title}已更新` });
    });
    app.delete(`${path}/:id`, (req, res) => {
      remove([req.params.id]);
      return res.json({ status: 1, list: state[key], info: `${title}已删除` });
    });
    app.post(`${path}/batch-delete`, (req, res) => {
      if (!Array.isArray(req.body.ids) || !req.body.ids.length || req.body.ids.length > 1000 || req.body.ids.some((id: any) => typeof id !== 'string') || new Set(req.body.ids).size !== req.body.ids.length) throw new BadRequestException('请选择1–1000条不重复的记录');
      remove(req.body.ids);
      return res.json({ status: 1, list: state[key], info: `${title}已批量删除` });
    });
    app.post(`${path}/import/preview`, (req, res) => res.json({ status: 1, data: rows(req.body), info: '预览通过，尚未写入数据库' }));
    app.post(`${path}/import`, (req, res) => {
      const created = save(rows(req.body));
      return res.json({ status: 1, data: { imported: created.length }, list: state[key], info: `已导入${created.length}条${title}` });
    });
  }
}
