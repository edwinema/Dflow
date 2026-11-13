import React, { useEffect, useRef, useState } from 'react';
import { Building2, KeyRound, Download, Copy, RefreshCw, X, ShieldCheck, Upload, Users, CalendarDays, History, Settings, FileText, Info, ImagePlus, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [tab, setTab] = useState<'overview' | 'display' | 'history'>('overview');
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
  const inputClass = 'w-full h-9 rounded border border-[#DCDFE6] px-3 bg-white text-xs text-[#303133] outline-none transition-colors placeholder:text-[#A8ABB2] focus:border-[#2F7BFE] focus:ring-2 focus:ring-[#2F7BFE]/10 disabled:bg-[#F5F7FA]';
  const buttonClass = 'inline-flex h-8 items-center justify-center gap-1.5 rounded border border-[#DCDFE6] bg-white px-3 text-xs font-medium text-[#606266] transition-colors hover:border-[#B3D8FF] hover:bg-[#ECF5FF] hover:text-[#2F7BFE] disabled:cursor-not-allowed disabled:opacity-45';
  const primaryClass = 'inline-flex h-8 items-center justify-center gap-1.5 rounded border border-[#2F7BFE] bg-[#2F7BFE] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1E6BE8] disabled:cursor-not-allowed disabled:opacity-45';
  const panelClass = 'rounded border border-[#E4E7ED] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]';
  const formatDate = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
  const statusText = active ? '授权有效' : lic.status === 'EXPIRED' ? '授权已到期' : lic.status === 'INVALID' ? '授权校验未通过' : '待激活';
  const statusClass = active ? 'border-[#B7EB8F] bg-[#F6FFED] text-[#389E0D]' : 'border-[#FFE58F] bg-[#FFFBE6] text-[#AD8B00]';
  const logs = Array.isArray(lic.auditLogs) ? lic.auditLogs : [];
  const changeLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 512000) { showToast('请选择不超过 500KB 的 PNG、JPEG 或 WebP 图片', 'warning'); return; }
    const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.onerror = () => showToast('图片读取失败，请重试', 'error'); reader.readAsDataURL(file);
  };
  return <div className="h-full min-h-0 flex flex-col bg-[#F0F2F5] p-3 text-xs text-[#303133]">
    <input type="file" accept=".lic,.json,.txt" ref={fileInput} className="hidden" onChange={importCertificate} />
    <div className="flex items-center gap-1 mb-3 shrink-0" role="tablist" aria-label="公司授权设置">
      {([{id:'overview',label:'授权概览',icon:ShieldCheck},{id:'display',label:'系统展示',icon:Settings},{id:'history',label:'更新记录',icon:History}] as const).map(t=><button key={t.id} role="tab" aria-selected={tab===t.id} aria-controls={`company-${t.id}`} onClick={()=>setTab(t.id)} className={`inline-flex items-center gap-1.5 px-4 py-1.5 font-medium rounded-t border-t border-x transition-colors ${tab===t.id?'bg-white border-[#E4E7ED] text-[#2F7BFE]':'bg-[#E5E9F2] border-transparent text-[#606266] hover:bg-[#DCDFE6]'}`}><t.icon size={14}/>{t.label}</button>)}
    </div>
    <div className={`${panelClass} p-3 mb-3 flex items-center justify-between gap-3 flex-wrap shrink-0`}>
      <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded bg-[#ECF5FF] text-[#2F7BFE]"><Building2 size={18}/></div><div><h1 className="text-sm font-semibold">公司授权</h1><p className="text-[#909399] mt-0.5">管理企业授权、服务器绑定与平台展示信息</p></div></div>
      <div className="flex items-center gap-2"><button className={buttonClass} onClick={load} disabled={loading||busy} aria-label="刷新授权信息"><RefreshCw size={14} className={loading?'animate-spin':''}/>刷新</button><button className={primaryClass} onClick={openModal} disabled={!data||loading||busy}><KeyRound size={14}/>更新授权</button></div>
    </div>
    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-1">
      {loading ? <div className={`${panelClass} p-12 text-center text-[#909399]`} role="status"><RefreshCw size={22} className="animate-spin mx-auto mb-3 text-[#2F7BFE]"/>正在读取公司授权信息…</div> : error ? <div role="alert" className={`${panelClass} p-10 text-center space-y-3`}><AlertCircle size={24} className="mx-auto text-[#F56C6C]"/><p className="text-[#606266]">{error}</p><button className={buttonClass} onClick={load}>重新加载</button></div> : <>
        {(!config.ready||lic.validationMessage)&&<div role="alert" className="flex gap-2 rounded border border-[#FFE58F] bg-[#FFFBE6] px-3 py-2.5 text-[#AD8B00]"><AlertCircle size={15} className="shrink-0 mt-0.5"/><div><p className="font-medium">{lic.validationMessage?'当前授权需要处理':'授权服务尚未就绪'}</p><p className="mt-1 leading-5">{lic.validationMessage||config.message||'请联系管理员完成授权配置。'}</p></div></div>}
        {tab==='overview'&&<div id="company-overview" role="tabpanel" className="space-y-3">
          <section className={panelClass}>
            <div className="px-4 py-4 border-b border-[#EBEEF5] flex items-start justify-between gap-3 flex-wrap"><div><p className="text-[#909399] mb-1.5">授权企业</p><h2 className="text-base font-semibold break-words">{data?.companyName||'尚未设置授权公司'}</h2><p className="text-[#909399] mt-2">公司名称与授权证书保持一致，更名后需重新签发证书。</p></div><span className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-medium ${statusClass}`}>{active?<CheckCircle2 size={13}/>:<AlertCircle size={13}/>} {statusText}</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {[{label:'授权版本',value:lic.edition||'未授权',icon:ShieldCheck},{label:'用户配额',value:data?.authUsersCount?`${data.authUsersCount.toLocaleString()} 人`:'—',icon:Users},{label:'授权到期时间',value:formatDate(lic.expireDate),icon:CalendarDays},{label:'最近更新时间',value:formatDate(lic.lastUpdateTime),icon:History}].map(item=><div key={item.label} className="px-4 py-4 border-b xl:border-b-0 border-[#EBEEF5] xl:border-r last:border-r-0"><p className="text-[#909399] flex items-center gap-1.5"><item.icon size={14}/>{item.label}</p><p className="font-medium text-sm mt-2 break-words">{item.value}</p></div>)}
            </div>
          </section>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 items-start">
            <section className={`${panelClass} xl:col-span-2`}><div className="px-4 py-3 border-b border-[#EBEEF5] flex items-center justify-between gap-2"><h2 className="font-semibold flex items-center gap-2"><ShieldCheck size={15} className="text-[#2F7BFE]"/>服务器绑定</h2><span className="text-[#909399]">{config.ready?'校验服务已配置':'等待配置'}</span></div><div className="p-4 space-y-3"><p className="text-[#606266]">服务器机器标识</p><div className="flex items-start sm:items-center gap-2"><code className="flex-1 min-w-0 break-all rounded border border-[#E4E7ED] bg-[#F5F7FA] px-3 py-2 font-mono leading-5 select-all">{machineCode||'暂未配置'}</code><button disabled={!machineCode} onClick={()=>copy(machineCode)} className={`${buttonClass} shrink-0`}><Copy size={13}/>复制</button></div><p className="text-[#909399] leading-5">授权与此服务器绑定。迁移服务器前，请使用新机器标识重新申请授权。</p><div className="border-t border-[#EBEEF5] pt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[#909399]">保留当前证书，便于备份与核对。</span><button disabled={!lic.licenseKey} className={buttonClass} onClick={()=>saveFile('dflow-license.lic',{format:'dflow-license-v1',licenseKey:lic.licenseKey})}><Download size={14}/>下载授权证书</button></div></div></section>
            <section className={panelClass}><div className="px-4 py-3 border-b border-[#EBEEF5]"><h2 className="font-semibold flex items-center gap-2"><FileText size={15} className="text-[#2F7BFE]"/>授权办理指引</h2></div><div className="p-4 space-y-4">{[{title:'填写申请',text:'填写公司全称、版本、用户数和到期日，下载申请文件。'},{title:'签发证书',text:'由授权负责人使用离线签发工具，生成 .lic 证书。'},{title:'导入并生效',text:'导入证书并确认更新，通过服务器校验后生效。'}].map((step,i)=><div key={step.title} className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ECF5FF] text-[#2F7BFE] font-medium">{i+1}</span><div><p className="font-medium">{step.title}</p><p className="text-[#909399] leading-5 mt-1">{step.text}</p></div></div>)}<a className={`${buttonClass} w-full`} href="/license-issuer.html" download="Dflow离线授权签发工具.html"><Download size={14}/>下载离线签发工具</a><p className="text-[#909399] leading-5">公司更名、续期或调整用户配额，均通过重新签发证书办理。</p></div></section>
          </div>
        </div>}
        {tab==='display'&&<div id="company-display" role="tabpanel" className="grid grid-cols-1 xl:grid-cols-3 gap-3 items-start">
          <form onSubmit={saveDisplay} className={`${panelClass} xl:col-span-2`}><div className="px-4 py-3 border-b border-[#EBEEF5]"><h2 className="font-semibold">系统展示设置</h2><p className="text-[#909399] mt-1">配置平台名称、标识及登录页信息，保存后生效。</p></div><div className="p-4 space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="space-y-2 block"><span>系统显示名称 <span className="text-[#F56C6C]">*</span></span><input className={inputClass} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="请输入平台名称" required/></label><label className="space-y-2 block"><span>登录页副标题</span><input className={inputClass} value={suffix} onChange={e=>setSuffix(e.target.value)} placeholder="请输入登录页副标题"/></label><label className="space-y-2 block md:col-span-2"><span>版权文字</span><input className={inputClass} value={copyright} onChange={e=>setCopyright(e.target.value)} placeholder="请输入版权声明"/></label></div><div className="space-y-2"><p>系统 Logo</p><div className="flex flex-wrap items-center gap-3"><div className="w-24 h-16 rounded border border-dashed border-[#DCDFE6] bg-[#FAFAFA] flex items-center justify-center p-2">{logo?<img src={logo} alt="系统 Logo" className="max-h-full max-w-full object-contain"/>:<ImagePlus size={24} className="text-[#C0C4CC]"/>}</div><div className="space-y-2"><div className="flex gap-2"><label className={`${buttonClass} cursor-pointer`}>上传图片<input aria-label="上传系统 Logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={changeLogo} className="sr-only"/></label>{logo&&<button type="button" className={buttonClass} onClick={()=>setLogo('')}>移除</button>}</div><p className="text-[#909399]">支持 PNG、JPEG、WebP，最大 500KB</p></div></div></div><div className="rounded border border-[#EBEEF5] bg-[#FAFAFA] p-3"><label className="flex gap-2 items-center font-medium"><input type="checkbox" checked={watermark} onChange={e=>setWatermark(e.target.checked)} className="accent-[#2F7BFE]"/>启用水印</label><p className="text-[#909399] mt-1.5 ml-5">根据平台水印设置展示标识。</p></div></div><div className="px-4 py-3 border-t border-[#EBEEF5] bg-[#FAFAFA] flex justify-end"><button disabled={busy||!displayName.trim()} className={primaryClass}>{busy&&<RefreshCw size={14} className="animate-spin"/>}保存设置</button></div></form>
          <section className={panelClass}><div className="px-4 py-3 border-b border-[#EBEEF5]"><h2 className="font-semibold">展示预览</h2><p className="text-[#909399] mt-1">仅用于预览，实际页面以保存后效果为准。</p></div><div className="p-4"><div className="rounded overflow-hidden border border-[#E4E7ED]"><div className="bg-[#1F2D3D] text-white px-4 py-5 flex items-center gap-2.5">{logo?<img src={logo} alt="Logo 预览" className="max-w-12 max-h-8 object-contain"/>:<Building2 size={22} className="text-[#409EFF] shrink-0"/>}<p className="font-semibold break-words">{displayName||'平台名称'}</p></div><div className="p-4 bg-[#FAFAFA] space-y-3"><p className="font-medium text-[#606266] break-words">{suffix||'登录页副标题'}</p><div className="h-7 border border-[#E4E7ED] bg-white rounded"/><div className="h-7 border border-[#E4E7ED] bg-white rounded"/><div className="rounded bg-[#2F7BFE] text-white text-center py-1.5">登录</div><p className="text-[11px] text-[#909399] text-center break-words">{copyright||'版权文字'}</p></div></div></div></section>
        </div>}
        {tab==='history'&&<section id="company-history" role="tabpanel" className={panelClass}><div className="px-4 py-3 border-b border-[#EBEEF5] flex justify-between items-center"><div><h2 className="font-semibold">授权更新记录</h2><p className="text-[#909399] mt-1">记录已成功生效的商业授权变更。</p></div><span className="text-[#909399]">共 {logs.length} 条</span></div><div className="overflow-x-auto"><table className="w-full text-left min-w-[620px]"><thead className="bg-[#F5F7FA] text-[#606266]"><tr>{['更新时间','变更内容','操作人','结果'].map(h=><th key={h} className="px-4 py-3 font-medium border-b border-[#EBEEF5]">{h}</th>)}</tr></thead><tbody>{logs.map((log:any,i:number)=><tr key={log.id||i} className="hover:bg-[#F5F7FA]"><td className="px-4 py-3 border-b border-[#EBEEF5] whitespace-nowrap text-[#606266]">{formatDate(log.time)}</td><td className="px-4 py-3 border-b border-[#EBEEF5] leading-5">{log.detail||log.event||'授权更新'}</td><td className="px-4 py-3 border-b border-[#EBEEF5]">{log.operator||'—'}</td><td className="px-4 py-3 border-b border-[#EBEEF5]"><span className="inline-flex rounded border border-[#B7EB8F] bg-[#F6FFED] text-[#389E0D] px-2 py-0.5">{log.status||'成功'}</span></td></tr>)}{!logs.length&&<tr><td colSpan={4} className="py-14 text-center text-[#909399]"><History size={26} className="mx-auto mb-3 text-[#C0C4CC]"/>暂无授权更新记录</td></tr>}</tbody></table></div></section>}
      </>}
    </div>
    {modal&&<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="license-dialog-title"><div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E4E7ED] bg-[#FAFAFA] flex justify-between items-center"><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded bg-[#ECF5FF] text-[#2F7BFE] flex items-center justify-center"><KeyRound size={19}/></div><div><h2 id="license-dialog-title" className="text-sm font-semibold">更新商业授权</h2><p className="text-[#909399] mt-0.5">填写申请信息，或导入已签发的授权证书</p></div></div><button className="text-[#909399] hover:text-[#303133] p-1" aria-label="关闭授权窗口" disabled={busy} onClick={()=>setModal(false)}><X size={20}/></button></div>
      <div className="p-5 space-y-4 overflow-y-auto">
        {!config.ready&&<p role="alert" className="text-[#AD8B00] bg-[#FFFBE6] border border-[#FFE58F] px-3 py-2 rounded leading-5">{config.message}</p>}
        <div className="rounded border border-[#E4E7ED] bg-[#F5F7FA] p-3"><div className="flex items-center justify-between gap-2 mb-2"><span className="text-[#606266] font-medium">当前服务器机器标识</span><button className="text-[#2F7BFE] inline-flex gap-1 items-center disabled:opacity-40" disabled={!machineCode} onClick={()=>copy(machineCode)}><Copy size={13}/>复制</button></div><code className="font-mono break-all leading-5">{machineCode||'暂未配置'}</code></div>
        <div className="flex items-center gap-2 font-semibold"><span className="flex h-5 w-5 rounded-full items-center justify-center bg-[#ECF5FF] text-[#2F7BFE]">1</span>授权申请信息</div>
        <label className="block space-y-2"><span>授权公司全称 <span className="text-[#F56C6C]">*</span></span><input className={inputClass} value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="请输入公司法定全称"/><p className="text-[#909399] leading-5">公司名称须与证书一致。更名后，请下载新申请并重新签发。</p></label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="block space-y-2"><span>申请版本</span><select className={inputClass} value={edition} onChange={e=>setEdition(e.target.value)}>{['企业旗舰版 (Enterprise)','企业尊享版 (Ultimate)','行业定制版 (Custom Edition)'].map(v=><option key={v}>{v}</option>)}{!['企业旗舰版 (Enterprise)','企业尊享版 (Ultimate)','行业定制版 (Custom Edition)'].includes(edition)&&<option>{edition}</option>}</select></label><label className="block space-y-2"><span>申请用户数</span><input type="number" min="1" max="1000000" className={inputClass} value={users} onChange={e=>setUsers(Number(e.target.value))}/></label><label className="block space-y-2"><span>申请到期日</span><input type="date" className={inputClass} value={expireDate} onChange={e=>setExpireDate(e.target.value)}/></label></div>
        <button className={buttonClass} onClick={exportRequest} disabled={!machineCode}><Download size={14}/>下载授权申请文件</button>
        <div className="border-t border-[#EBEEF5] pt-4 flex justify-between items-center gap-2 flex-wrap"><div className="flex items-center gap-2 font-semibold"><span className="flex h-5 w-5 rounded-full items-center justify-center bg-[#ECF5FF] text-[#2F7BFE]">2</span>导入已签发证书</div><button className={buttonClass} onClick={()=>fileInput.current?.click()}><Upload size={14}/>导入证书文件</button></div>
        <label className="block space-y-2"><span>商业授权码</span><textarea rows={4} className={`${inputClass} h-auto py-2 font-mono break-all leading-5`} value={key} onChange={e=>setKey(e.target.value)} placeholder="导入 .lic 文件，或粘贴完整授权码"/></label>
        <div className="flex gap-2 rounded border border-[#D9ECFF] bg-[#ECF5FF] p-3 text-[#606266] leading-5"><Info size={15} className="shrink-0 text-[#2F7BFE] mt-0.5"/><p>申请文件不能直接激活。导入证书后，点击确认更新；公司、版本、用户配额和到期日以服务器校验通过的证书为准。</p></div>
      </div>
      <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex justify-end gap-2"><button className={buttonClass} disabled={busy} onClick={()=>setModal(false)}>取消</button><button disabled={busy||!config.ready||!key.trim()||!companyName.trim()} className={primaryClass} onClick={activate}>{busy&&<RefreshCw size={14} className="animate-spin"/>}{busy?'正在校验…':'确认更新授权'}</button></div>
    </div></div>}
  </div>;
};
