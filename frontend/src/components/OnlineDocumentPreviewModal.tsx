import React,{useEffect,useState} from 'react';
import {X,Download,Printer,ZoomIn,ZoomOut} from 'lucide-react';
import {DocumentCanvas,DocumentContent} from './DocumentTemplateTools';
export interface DocumentItem {id?:string;label:string;docNo?:string;fileId?:string;documentContent?:DocumentContent;[key:string]:any}
export interface OnlineDocumentPreviewModalProps {document:DocumentItem;onClose:()=>void;showToast?:(message:string,type?:any)=>void;allowDownload?:boolean;previewOnly?:boolean}
export const getFileExtension=(name:string)=>name?.split('.').pop()?.toLowerCase()||'';
export const getDocumentFormat=(name:string):'pdf'|'word'|'excel'|'ppt'=>{const ext=getFileExtension(name);return ['doc','docx'].includes(ext)?'word':['xls','xlsx','csv'].includes(ext)?'excel':['ppt','pptx'].includes(ext)?'ppt':'pdf';};
const escapeHtml=(text:any)=>String(text??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
function contentHtml(doc:DocumentItem) {
  const c=doc.documentContent!;const color=/^#[\da-f]{6}$/i.test(c.headerColor)?c.headerColor:'#DC2626';
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escapeHtml(c.title||doc.label)}</title><style>@page{size:A4;margin:20mm}body{max-width:680px;margin:40px auto;font-family:serif;color:#202124;line-height:1.9;overflow-wrap:anywhere}.red{border-bottom:2px solid ${color};padding-bottom:16px}.heading{text-align:center;color:${color};font-size:${Math.min(48,Math.max(20,c.headerFontSize))}px;font-weight:bold;white-space:pre-wrap}.meta{display:flex;justify-content:space-between;gap:12px;font-size:14px}.body,footer{white-space:pre-wrap;font-size:${Math.min(24,Math.max(12,c.bodyFontSize))}px}h1{text-align:center;margin:32px 0;font-size:24px}footer{text-align:right;margin-top:40px}.watermark{position:fixed;inset:40% 0;text-align:center;font-size:60px;opacity:.06;transform:rotate(-30deg);pointer-events:none}@media print{body{margin:0}}</style><body><div class="watermark">${escapeHtml(c.watermark)}</div><header class="red"><div class="heading">${escapeHtml(c.headerTitle)}</div><div class="meta"><span>${escapeHtml(c.officialNo)}</span><span>${c.signatory?'签发人：'+escapeHtml(c.signatory):''}</span><span>${c.confidentiality?'密级：'+escapeHtml(c.confidentiality):''}</span></div></header><h1>${escapeHtml(c.title)}</h1><main class="body">${escapeHtml(c.body)}</main><footer>${escapeHtml(c.footer)}</footer></body></html>`;
}
function saveBlob(blob:Blob,name:string) {const url=URL.createObjectURL(blob),a=window.document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const downloadDocumentFile=async(doc:DocumentItem,showToast?:(text:string,type?:any)=>void)=>{
  try {
    if(doc.documentContent){saveBlob(new Blob([contentHtml(doc)],{type:'text/html;charset=utf-8'}),(doc.label||'制度正文').replace(/\.[^.]+$/,'')+'.html');return;}
    if(!doc.id||!doc.fileId)throw new Error('尚未上传原文件或编写模板正文');
    const response=await fetch(`/api/dict/doc/download?id=${encodeURIComponent(doc.id)}`);
    if(!response.ok){const result=await response.json();throw new Error(result.info||'下载失败');}
    saveBlob(await response.blob(),doc.label);
  }catch(error){showToast?.(error instanceof Error?error.message:'下载失败','error');}
};
export const OnlineDocumentPreviewModal:React.FC<OnlineDocumentPreviewModalProps>=({document:doc,onClose,showToast,allowDownload=true,previewOnly=false})=>{
  const restricted=previewOnly||!allowDownload;const [zoom,setZoom]=useState(100),[pdfUrl,setPdfUrl]=useState(''),[error,setError]=useState('');
  useEffect(()=>{if(doc.documentContent||!doc.fileId||!doc.id||getDocumentFormat(doc.label)!=='pdf')return;let disposed=false,url='';
    fetch(`/api/dict/doc/preview?id=${encodeURIComponent(doc.id)}`).then(async response=>{if(!response.ok){const result=await response.json();throw new Error(result.info||'原文件预览失败');}if(!response.headers.get('content-type')?.includes('application/pdf'))throw new Error('此文件请下载后使用相应软件查看');return response.blob();}).then(blob=>{if(!disposed){url=URL.createObjectURL(blob);setPdfUrl(url);}}).catch(e=>{if(!disposed)setError(e.message);});return()=>{disposed=true;if(url)URL.revokeObjectURL(url);};
  },[doc.id,doc.fileId,doc.documentContent]);
  const print=()=>{if(restricted||!doc.documentContent)return;const popup=window.open('','_blank');if(!popup){showToast?.('请允许打开打印窗口','warning');return;}popup.document.write(contentHtml(doc));popup.document.close();popup.focus();popup.print();};
  return <div className="fixed inset-0 z-[80] bg-black/60 p-3 flex items-center justify-center"><section role="dialog" aria-label="制度正文预览" className="bg-gray-100 rounded-lg w-[96vw] max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
    <header className="bg-gray-800 text-white px-4 py-3 flex flex-wrap gap-3 items-center justify-between"><div><h2 className="font-bold text-sm">{doc.label||'制度正文预览'}</h2><p className="text-xs text-gray-400">{doc.documentContent?'模板正文 · 可打印或另存为PDF':doc.fileId?'已上传的原文件':'尚未编写正文'}</p></div><div className="flex gap-3 items-center text-xs"><button aria-label="缩小" onClick={()=>setZoom(Math.max(50,zoom-10))}><ZoomOut size={16}/></button><span>{zoom}%</span><button aria-label="放大" onClick={()=>setZoom(Math.min(150,zoom+10))}><ZoomIn size={16}/></button>{!restricted&&<><button className="flex gap-1 items-center" onClick={()=>downloadDocumentFile(doc,showToast)}><Download size={15}/>{doc.documentContent?'导出正文HTML':'下载原文件'}</button>{doc.documentContent&&<button className="flex gap-1 items-center" onClick={print}><Printer size={15}/>打印 / 保存PDF</button>}</>}<button aria-label="关闭正文预览" onClick={onClose}><X size={19}/></button></div></header>
    <div className="flex-1 min-h-0 overflow-auto p-5">{doc.documentContent?<div style={{zoom:zoom/100}}><DocumentCanvas content={doc.documentContent}/></div>:pdfUrl?<iframe title="制度原文件" className="w-full h-full min-h-[70vh]" src={pdfUrl}/>:<div className="bg-white border rounded p-8 text-sm text-gray-600 text-center">{error|| (doc.fileId?(getDocumentFormat(doc.label)==='pdf'?'正在加载原文件…':'此格式请下载原文件后查看，或编辑制度并选用模板编写正文。'):'本制度尚未上传原文件或编写模板正文，请在编辑制度中补充内容。')}</div>}</div>
  </section></div>;
};
