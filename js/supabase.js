/**
 * 非凡教育 · 浙江艺考志愿助手 — Supabase 客户端
 */
var SUPABASE_URL='https://nhewhebhbknydhcbvjnv.supabase.co';
var SUPABASE_KEY='sb_publishable_9XfINH7l5nqjYbdEy4MqTQ__5O4BhnZ';
var supabase=null;
function __initSupabase(){
  try{
    if(window.supabase && typeof window.supabase.createClient==='function'){
      supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      return true;
    }
  }catch(e){console.warn('[Supabase] 初始化失败:',e.message);}
  return false;
}
// 首次尝试
__initSupabase();
// 如果 CDN 尚未加载，通过 async 脚本不阻塞页面，后续轮询等待 CDN 就绪
if(!supabase){
  var __supabaseCheck=0;
  var __supabaseTimer=setInterval(function(){
    __supabaseCheck++;
    if(__initSupabase()||__supabaseCheck>50){clearInterval(__supabaseTimer);}
  },200);
}
