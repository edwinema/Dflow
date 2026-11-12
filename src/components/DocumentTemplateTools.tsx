import React, {useEffect,useState} from 'react';
import {X,Plus,Save,Eye} from 'lucide-react';

export interface DocumentContent {
  headerTitle:string; officialNo:string; signatory:string; confidentiality:string;
  title:string; body:string; footer:string; watermark:string;
  headerColor:string; headerFontSize:number; bodyFontSize:number;
}
export const emptyDocumentContent:DocumentContent={headerTitle:'',officialNo:'',signatory:'',confidentiality:'内部公开',title:'',body:'',footer:'',watermark:'',headerColor:'#DC2626',headerFontSize:28,bodyFontSize:16};
export function DocumentCanvas({content}:{content:DocumentContent}) {
  return <article className="bg-white text-[#202124] shadow border mx-auto relative overflow-hidden select-text" style={{width:794,minHeight:1123,padding:'64px 58px',fontFamily:'serif'}}>
    {content.watermark&&<div aria-hidden className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.06] text-5xl -rotate-30 break-all">{content.watermark}</div>}
    <div className="relative">
      <header style={{color:content.headerColor,borderBottom:`2px solid ${content.headerColor}`,paddingBottom:16}}>
        <div style={{fontSize:content.headerFontSize,fontWeight:900,textAlign:'center',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{content.headerTitle}</div>
        <div className="flex flex-wrap justify-between gap-3 text-sm mt-5 text-gray-600"><span>{content.officialNo}</span><span>{content.signatory&&`签发人：${content.signatory}`}</span><span>{content.confidentiality&&`密级：${content.confidentiality}`}</span></div>
      </header>
      <h1 className="text-center text-2xl font-bold mt-8 mb-8 whitespace-pre-wrap break-words">{content.title}</h1>
      <div style={{fontSize:content.bodyFontSize,lineHeight:1.9,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{content.body||'正文尚未填写'}</div>
      <footer className="mt-12 text-right whitespace-pre-wrap break-words" style={{fontSize:content.bodyFontSize}}>{content.footer}</footer>
    </div>
  </article>;
}
export function DocumentContentEditor({value,onChange}:{value:DocumentContent;onChange:(value:DocumentContent)=>void}) {
  const change=(key:string,val:any)=>onChange({...value,[key]:val});
  const input='w-full border border-[#DCDFE6] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500';
  return <div className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[
      ['headerTitle','红头标题（公司名称）',500],['officialNo','发文字号',300],['signatory','签发人',300],['confidentiality','密级',100],['title','正文标题',500],['watermark','水印文字（可留空）',200],
    ].map(([key,label,max])=><label key={key} className="block text-xs text-gray-600">{label}<input aria-label={String(label)} className={input+' mt-1'} maxLength={Number(max)} value={String(value[key as keyof DocumentContent]??'')} onChange={e=>change(String(key),e.target.value)}/></label>)}</div>
    <div className="flex flex-wrap gap-4 items-end"><label className="text-xs text-gray-600">红头颜色<input aria-label="红头颜色" type="color" className="block h-9 w-20 mt-1" value={value.headerColor} onChange={e=>change('headerColor',e.target.value)}/></label>{[['headerFontSize','红头字号',20,48],['bodyFontSize','正文字号',12,24]].map(([key,label,min,max])=><label key={key} className="text-xs text-gray-600">{label}<input aria-label={String(label)} type="number" className={input+' block w-24 mt-1'} min={Number(min)} max={Number(max)} value={value[key as keyof DocumentContent]} onChange={e=>change(String(key),Number(e.target.value))}/></label>)}</div>
    <label className="block text-xs text-gray-600">制度正文（支持分章、条款和换行）<textarea aria-label="制度正文" maxLength={200000} className={input+' mt-1 min-h-64 leading-7'} value={value.body} onChange={e=>change('body',e.target.value)}/></label>
    <label className="block text-xs text-gray-600">落款与日期<textarea aria-label="落款与日期" maxLength={2000} className={input+' mt-1 h-20'} value={value.footer} onChange={e=>change('footer',e.target.value)}/></label>
  </div>;
}
export async function templateRequest(path:string,method='GET',body?:any) {
  const response=await fetch(path,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const result=await response.json();if(!response.ok||result.status!==1)throw new Error(result.info||'模板操作失败');return result.data;
}
export function DocumentTemplateManager({onClose,showToast}:{onClose:()=>void;showToast:(text:string,type?:any)=>void}) {
  const [templates,setTemplates]=useState<any[]>([]),[current,setCurrent]=useState<any>(null),[saving,setSaving]=useState(false),[preview,setPreview]=useState(false);
  useEffect(()=>{templateRequest('/api/dict/document-templates').then(rows=>{setTemplates(rows);setCurrent(structuredClone(rows[0]));}).catch(e=>showToast(e.message,'error'));},[]);
  const save=async()=>{if(!current||saving)return;setSaving(true);try{
    const row=await templateRequest(current.id?`/api/dict/document-templates/${current.id}`:'/api/dict/document-templates',current.id?'PUT':'POST',{name:current.name,content:current.content,...(current.id?{revision:current.revision}:{})});
    setTemplates(await templateRequest('/api/dict/document-templates'));setCurrent(row);showToast('模板已保存，已保存的制度文件内容保持不变','success');
  }catch(e){showToast(e instanceof Error?e.message:'保存失败','error');}finally{setSaving(false);}};
  return <div className="fixed inset-0 z-[60] bg-black/45 flex items-center justify-center p-4"><section role="dialog" aria-label="制度文件模板管理" className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
    <header className="px-5 py-4 bg-[#F8F9FA] border-b flex justify-between items-center"><h2 className="font-bold">制度文件模板管理</h2><button aria-label="关闭模板管理" onClick={onClose}><X size={20}/></button></header>
    <div className="p-5 border-b flex flex-wrap gap-3 items-center"><select aria-label="选择要编辑的模板" className="border rounded p-2 text-sm" value={current?.id||''} onChange={e=>{setCurrent(structuredClone(templates.find(t=>t.id===e.target.value)));setPreview(false);}}>{!current?.id&&<option value="">新模板</option>}{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><button className="text-blue-600 text-sm flex gap-1 items-center" onClick={()=>{setCurrent({name:'新制度模板',content:structuredClone(current?.content||emptyDocumentContent)});setPreview(false);}}><Plus size={15}/>新建模板</button><button className="text-blue-600 text-sm flex gap-1 items-center" onClick={()=>setPreview(!preview)}><Eye size={15}/>{preview?'返回编辑':'预览模板'}</button></div>
    <div className="flex-1 min-h-0 overflow-auto p-5 bg-gray-50">{current&&(preview?<DocumentCanvas content={current.content}/>:<div className="max-w-3xl mx-auto"><label className="block text-xs mb-3">模板名称<input aria-label="模板名称" maxLength={100} className="w-full border rounded p-2 mt-1 text-sm" value={current.name} onChange={e=>setCurrent({...current,name:e.target.value})}/></label><p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded p-3 mb-4">可使用变量：{'{{companyName}} 公司名称、{{docNo}} 制度编号、{{referenceNo}} 发文字号、{{title}} 文件名称、{{versionNo}} 版本、{{ownerName}} 责任人、{{publishTime}} 日期'}。应用模板时自动填入，正文采用纯文本排版。</p><DocumentContentEditor value={current.content} onChange={content=>setCurrent({...current,content})}/></div>)}</div>
    <footer className="px-5 py-3 border-t bg-gray-50 flex justify-end gap-3"><button className="border rounded px-4 py-2 text-sm" onClick={onClose}>关闭</button><button disabled={!current||saving} className="bg-blue-500 text-white rounded px-4 py-2 text-sm disabled:opacity-50 flex gap-1 items-center" onClick={save}><Save size={16}/>{saving?'保存中...':'保存模板'}</button></footer>
  </section></div>;
}
