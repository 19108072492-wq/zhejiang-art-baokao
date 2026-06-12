/**
 * 非凡教育 · 浙江艺考志愿助手 — Supabase 客户端
 */
var SUPABASE_URL='https://nhewhebhbknydhcbvjnv.supabase.co';
var SUPABASE_KEY='sb_publishable_9XfINH7l5nqjYbdEy4MqTQ__5O4BhnZ';
var supabase=null;
try{
  if(window.supabase && typeof window.supabase.createClient==='function'){
    supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  }else{
    console.warn('[Supabase] CDN 未加载，云端功能暂不可用');
  }
}catch(e){
  console.warn('[Supabase] 初始化失败:',e.message);
}
