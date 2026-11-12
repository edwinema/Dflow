// Propagate expired server sessions to the shell without treating failed logins as success.
const originalFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{
  const response=await originalFetch(input,init);
  const url=new URL(input instanceof Request?input.url:String(input),window.location.href);
  const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
  if(url.origin===window.location.origin&&url.pathname.startsWith('/api/')&&response.status===401&&!(url.pathname==='/api/session'&&method==='POST'))window.dispatchEvent(new Event('session-expired'));
  return response;
};
export {};
