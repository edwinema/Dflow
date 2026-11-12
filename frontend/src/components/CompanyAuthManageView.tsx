import React, { useEffect, useRef, useState } from 'react';
import { Building2, KeyRound, Download, Copy, RefreshCw, X, ShieldCheck, Upload } from 'lucide-react';

interface CompanyAuthManageViewProps {
  onUpdateSystemDisplay?: (name: string, logo: string) => void;
  onUpdateCompanyName?: (name: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}
const saveFile = (name: string, value: unknown) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
// This preview is untrusted. Only the API may verify a certificate and activate it.
function readClaims(key: string) {
  if (key.length > 10000 || !/^[\w-]+\.[\w-]+$/.test(key)) throw new Error('请导入离线签发工具生成的 .lic 证书，旧的演示授权码不可使用');
  const raw = key.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
  const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw), c => c.charCodeAt(0))));
  if (!claims.companyName || !claims.machineCode || !claims.edition || !Number.isInteger(claims.authUsersCount) || claims.authUsersCount <= 0 || !Number.isFinite(Date.parse(claims.expireDate))) throw new Error('授权证书内容不完整');
  return claims;
}
export const CompanyAuthManageView: React.FC<CompanyAuthManageViewProps> = ({ onUpdateCompanyName, onUpdateSystemDisplay, showToast }) => {
  const [tab, setTab] = useState<'company' | 'license'>('company');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [key, setKey] = useState('');
  const [edition, setEdition] = useState('企业旗舰版 (Enterprise)');
  const [users, setUsers] = useState(200);
  const [expireDate, setExpireDate] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [logo, setLogo] = useState('');
  const [suffix, setSuffix] = useState('');
  const [copyright, setCopyright] = useState('');
  const [watermark, setWatermark] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const lic = data?.license || {};
  const config = data?.licenseConfiguration || {};
  const active = lic.status === 'ACTIVE';
  const machineCode = config.machineCode || '';
  const applyData = (next: any) => {
    setData(next); setCompanyName(next.companyName || '');
    setKey(next.license?.licenseKey || '');
    setEdition(next.license?.edition || '企业旗舰版 (Enterprise)');
    setUsers(next.authUsersCount || 200);
    setExpireDate(next.license?.expireDate?.slice(0, 10) || '');
  };
  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/system/company'); const json = await res.json();
      if (!res.ok || json.status !== 1) throw new Error(json.info || '读取授权信息失败');
      applyData(json.data);
      setDisplayName(json.data.systemDisplayName || '全源流程资产管理平台 dflow');
      setLogo(json.data.systemLogo || ''); setSuffix(json.data.loginTitleSuffix || '数字化流程设计与运营系统');
      setCopyright(json.data.copyrightText || ''); setWatermark(Boolean(json.data.watermarkEnabled));
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); showToast('已复制', 'success'); }
    catch { showToast('复制失败，请手动选择并复制', 'error'); }
  };
  const exportRequest = () => {
    if (!companyName.trim() || !machineCode || !expireDate || !Number.isInteger(users) || users <= 0) {
      showToast('请填写公司全称、用户数和到期日，并确认服务器机器标识已配置', 'warning'); return;
    }
    saveFile('dflow-license-request.json', { companyName: companyName.trim(), machineCode, edition, authUsersCount: users, expireDate: new Date(`${expireDate}T23:59:59+08:00`).toISOString() });
    showToast('申请文件已下载，请在本机离线签发工具中打开', 'success');
  };
  const importCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    try {
      if (file.size > 20000) throw new Error('证书文件过大，请选择 .lic 授权证书');
      const content = (await file.text()).trim(); let value = content;
      if (content.startsWith('{')) value = JSON.parse(content).licenseKey;
      if (typeof value !== 'string') throw new Error('文件不含授权码，请选择签发后的 .lic 证书');
      const claims = readClaims(value);
      if (machineCode && claims.machineCode !== machineCode) throw new Error('该证书属于其他服务器，请重新签发');
      setKey(value); setCompanyName(claims.companyName); setEdition(claims.edition);
      setUsers(claims.authUsersCount); setExpireDate(claims.expireDate.slice(0, 10));
      showToast('证书已导入，点击确认更新授权后由服务器验证签名', 'info');
    } catch (e) { showToast((e as Error).message, 'error'); }
  };
  const activate = async () => {
    if (!config.ready) { showToast(config.message || '授权校验配置尚未就绪', 'warning'); return; }
    setBusy(true);
    try {
      const claims = readClaims(key.trim());
      if (claims.companyName !== companyName.trim()) throw new Error('公司名称与证书不一致，请按新名称重新签发证书');
      const res = await fetch('/api/system/license/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: companyName.trim(), licenseKey: key.trim() }) });
      const json = await res.json(); if (!res.ok || json.status !== 1) throw new Error(json.info || '授权更新失败');
      applyData(json.data); onUpdateCompanyName?.(json.data.companyName); setModal(false); showToast('商业授权已更新，公司名称已同步', 'success');
    } catch (e) { showToast((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  const saveDisplay = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch('/api/system/company', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemDisplayName: displayName.trim(), systemLogo: logo, loginTitleSuffix: suffix, copyrightText: copyright, watermarkEnabled: watermark }) });
      const json = await res.json(); if (!res.ok || json.status !== 1) throw new Error(json.info || '保存失败');
      onUpdateSystemDisplay?.(displayName.trim(), logo); showToast('个性化配置已保存', 'success');
    } catch (e) { showToast((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  const openModal = () => { applyData(data); setModal(true); };
  const inputClass = 'w-full rounded border border-[#DCDFE6] px-3 py-2 bg-white text-sm outline-none focus:border-[#2F7BFE]';
  const buttonClass = 'inline-flex items-center gap-2 rounded border border-[#DCDFE6] bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50';
  const primaryClass = 'inline-flex items-center gap-2 rounded bg-[#2F7BFE] px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50';
  if (loading) return <div className="p-8 text-gray-500">正在读取授权信息…</div>;
  if (error) return <div className="p-8 space-y-4"><p className="text-red-600">{error}</p><button className={buttonClass} onClick={load}>重新加载</button></div>;
  return <div className="h-full flex flex-col bg-[#F8FAFC] text-[#303133]">
    <input type="file" accept=".lic,.json,.txt" ref={fileInput} className="hidden" onChange={importCertificate} />
    <div className="flex gap-6 border-b bg-white px-6 pt-4">
      {(['company', 'license'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm border-b-2 ${tab === t ? 'text-blue-600 border-blue-600' : 'border-transparent'}`}>{t === 'company' ? '公司授权信息' : '许可证与激活管理'}</button>)}
    </div>
    <div className="flex-1 overflow-auto p-6 space-y-5">
      {!config.ready && <div role="alert" className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{config.message || '授权校验尚未配置，请联系管理员。'}</div>}
      {lic.validationMessage && <div role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{lic.validationMessage}</div>}
      <section className="max-w-5xl rounded-lg border bg-white p-5 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap"><div><h2 className="text-lg font-bold flex gap-2 items-center"><Building2 size={22} />{data?.companyName || '尚未设置授权公司'}</h2><p className={`mt-2 text-sm ${active ? 'text-green-600' : 'text-amber-600'}`}>{active ? '商业授权生效中' : lic.status === 'EXPIRED' ? '授权已过期' : '尚未激活有效商业授权'}</p></div><button className={primaryClass} onClick={openModal}><KeyRound size={16} />更新商业授权</button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
          {[['授权版本', lic.edition || '未授权'], ['授权用户数', data?.authUsersCount ? `${data.authUsersCount} 人` : '—'], ['最近更新时间', lic.lastUpdateTime ? new Date(lic.lastUpdateTime).toLocaleString('zh-CN') : '—'], ['到期时间', lic.expireDate ? new Date(lic.expireDate).toLocaleString('zh-CN') : '—']].map(([label, value]) => <div key={label}><p className="text-gray-500 mb-2">{label}</p><p>{value}</p></div>)}
        </div>
      </section>
      <section className="max-w-5xl rounded-lg border bg-white p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><ShieldCheck size={18} />服务器授权绑定</h3>
        <div className="flex gap-3 items-center"><code className="break-all select-all">{machineCode || '机器标识尚未配置'}</code><button disabled={!machineCode} onClick={() => copy(machineCode)} className={buttonClass}><Copy size={14} />复制</button></div>
        <p className="text-sm text-gray-500">使用部署时保存的稳定机器标识进行绑定，重启和更新程序不会改变。证书中的公司、版本、用户数和期限由服务器校验签名。</p>
        {lic.licenseKey && <button className={buttonClass} onClick={() => saveFile('dflow-license.lic', { format: 'dflow-license-v1', licenseKey: lic.licenseKey })}><Download size={16} />下载当前授权证书</button>}
      </section>
      <section className="max-w-5xl rounded-lg border bg-blue-50 p-5 space-y-3 text-sm">
        <h3 className="font-semibold">授权文书在哪里生成？</h3>
        <p>1. 点击“更新商业授权”，填写公司全称、用户数和到期日，下载授权申请文件。</p>
        <p>2. 下载下方离线签发工具，在本机打开，导入签发私钥和申请文件，生成 .lic 授权证书。私钥由软件所有者保管。</p>
        <p>3. 返回本页面导入 .lic 证书，点击“确认更新授权”。公司更名、续期或修改配额时，重新签发并导入。</p>
        <a className={buttonClass} href="/license-issuer.html" download="Dflow离线授权签发工具.html"><Download size={16} />下载离线签发工具</a>
      </section>
      {tab === 'company' && <form onSubmit={saveDisplay} className="max-w-5xl rounded-lg border bg-white p-5 space-y-4">
        <h3 className="font-semibold">系统展示设置</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm block">系统显示名称<input className={inputClass} value={displayName} onChange={e => setDisplayName(e.target.value)} required /></label>
          <label className="space-y-2 text-sm block">登录页副标题<input className={inputClass} value={suffix} onChange={e => setSuffix(e.target.value)} /></label>
          <label className="space-y-2 text-sm block">版权文字<input className={inputClass} value={copyright} onChange={e => setCopyright(e.target.value)} /></label>
          <label className="space-y-2 text-sm block">系统 Logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 512000) { showToast('请选择不超过 500KB 的 PNG、JPEG 或 WebP 图片', 'warning'); return; } const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file); }} />{logo && <img src={logo} alt="系统 Logo" className="h-10 object-contain" />}</label>
        </div>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={watermark} onChange={e => setWatermark(e.target.checked)} />启用水印</label>
        <button disabled={busy} className={primaryClass}>保存展示设置</button>
      </form>}
      {tab === 'license' && <section className="max-w-5xl rounded-lg border bg-white p-5 space-y-3"><h3 className="font-semibold">授权更新日志</h3>{(lic.auditLogs || []).length ? lic.auditLogs.map((log: any) => <div key={log.id} className="border-t pt-3 text-sm"><p>{log.detail}</p><p className="text-gray-500 mt-1">{new Date(log.time).toLocaleString('zh-CN')} · {log.operator}</p></div>) : <p className="text-sm text-gray-500">暂无更新记录</p>}</section>}
    </div>
    {modal && <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"><div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
      <div className="p-5 border-b flex justify-between items-center"><h2 className="text-lg font-bold">更新商业授权</h2><button aria-label="关闭" onClick={() => setModal(false)}><X size={22} /></button></div>
      <div className="p-5 space-y-4 overflow-y-auto">
        {!config.ready && <p role="alert" className="text-amber-700 bg-amber-50 p-3 rounded text-sm">{config.message}</p>}
        <label className="block text-sm space-y-2">服务器机器标识<input readOnly className={`${inputClass} bg-gray-50 font-mono`} value={machineCode} /></label>
        <label className="block text-sm space-y-2">授权公司全称<input className={inputClass} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="请输入公司法定全称" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm space-y-2">申请版本<select className={inputClass} value={edition} onChange={e => setEdition(e.target.value)}>{['企业旗舰版 (Enterprise)', '企业尊享版 (Ultimate)', '行业定制版 (Custom Edition)'].map(v => <option key={v}>{v}</option>)}{!['企业旗舰版 (Enterprise)', '企业尊享版 (Ultimate)', '行业定制版 (Custom Edition)'].includes(edition) && <option>{edition}</option>}</select></label>
          <label className="block text-sm space-y-2">申请用户数<input type="number" min="1" max="1000000" className={inputClass} value={users} onChange={e => setUsers(Number(e.target.value))} /></label>
          <label className="block text-sm space-y-2 col-span-2">申请到期日<input type="date" className={inputClass} value={expireDate} onChange={e => setExpireDate(e.target.value)} /></label>
        </div>
        <div className="flex flex-wrap gap-3"><button className={buttonClass} onClick={exportRequest} disabled={!machineCode}><Download size={16} />下载授权申请文件</button><button className={buttonClass} onClick={() => fileInput.current?.click()}><Upload size={16} />导入授权证书文件</button></div>
        <label className="block text-sm space-y-2">商业授权码<textarea rows={4} className={`${inputClass} font-mono break-all`} value={key} onChange={e => setKey(e.target.value)} placeholder="导入 .lic 文件或粘贴离线签发工具生成的完整授权码" /></label>
        <p className="text-sm text-gray-500">申请文件用于签发证书，本身不能激活授权。实际版本、配额与到期日以通过签名校验的证书为准。</p>
      </div>
      <div className="p-5 border-t flex justify-end gap-3"><button className={buttonClass} onClick={() => setModal(false)}>取消</button><button disabled={busy || !config.ready || !key.trim() || !companyName.trim()} className={primaryClass} onClick={activate}>{busy && <RefreshCw size={16} className="animate-spin" />}{busy ? '正在校验…' : '确认更新授权'}</button></div>
    </div></div>}
  </div>;
};
