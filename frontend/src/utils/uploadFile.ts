export async function uploadFile(file:File):Promise<{id:string;filename:string;size:number}> {
  if(!file.size||file.size>5*1024*1024)throw new Error('请选择非空且不超过5MB的文件');
  const base64=await new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('读取文件失败'));reader.readAsDataURL(file);
  });
  const response=await fetch('/api/files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,contentType:file.type||'application/octet-stream',base64})});
  const body=await response.json();if(!response.ok||body.status!==1)throw new Error(body.info||'文件上传失败');return body.data;
}
