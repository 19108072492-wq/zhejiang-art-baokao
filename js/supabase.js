/**
 * 非凡教育 · 浙江艺考志愿助手 — Supabase REST 客户端（零 CDN 依赖）
 * 全部使用原生 fetch，内置超时 + 重试，适配国内网络环境
 */
var SUPABASE_URL='https://nhewhebhbknydhcbvjnv.supabase.co';
var SUPABASE_KEY='sb_publishable_9XfINH7l5nqjYbdEy4MqTQ__5O4BhnZ';

// 通用请求头
function __supaHeaders(){
  return {
    'apikey':SUPABASE_KEY,
    'Authorization':'Bearer '+SUPABASE_KEY,
    'Content-Type':'application/json',
    'Prefer':'return=minimal'
  };
}

// 带超时 + 重试的 fetch
function __supaFetch(url,options,retries){
  retries=retries||2; // 共3次尝试
  options=options||{};
  var timeout=options.timeout||10000; // 10秒超时（国内网络宽容）

  return new Promise(function(resolve,reject){
    var attempts=0;
    var lastErr=null;

    function attempt(){
      attempts++;
      var controller=new AbortController();
      var tid=setTimeout(function(){controller.abort();},timeout);
      var fetchOpts=Object.assign({},options,{signal:controller.signal});
      delete fetchOpts.timeout;

      fetch(url,fetchOpts).then(function(resp){
        clearTimeout(tid);
        resolve(resp);
      }).catch(function(e){
        clearTimeout(tid);
        lastErr=e;
        if(attempts<=retries && (e.name==='AbortError'||e.message==='timeout'||/network|fetch/i.test(e.message||''))){
          // 网络或超时错误，等一等再试
          var delay=1000*attempts; // 1s, 2s, 3s 指数退避
          setTimeout(attempt,delay);
        }else{
          reject(lastErr);
        }
      });
    }

    attempt();
  });
}

// ========== 公开 API ==========

// 插入数据到 phone_registrations 表
function supaInsert(body){
  return __supaFetch(SUPABASE_URL+'/rest/v1/phone_registrations',{
    method:'POST',
    headers:__supaHeaders(),
    body:JSON.stringify(body),
    timeout:10000
  }).then(function(resp){
    if(resp.ok)return{ok:true};
    return resp.json().then(function(e){return{ok:false,error:e};}).catch(function(){return{ok:false,error:'HTTP '+resp.status};});
  }).catch(function(e){
    return{ok:false,error:(e.message||'网络错误')};
  });
}

// 查询 phone_registrations 表（按时间倒序）
function supaSelect(limit){
  limit=limit||500;
  return __supaFetch(SUPABASE_URL+'/rest/v1/phone_registrations?select=id,phone,grade,direction,created_at&order=created_at.desc&limit='+limit,{
    method:'GET',
    headers:__supaHeaders(),
    timeout:10000
  }).then(function(resp){
    if(resp.ok)return resp.json();
    throw new Error('HTTP '+resp.status);
  });
}

// 检查 Supabase 是否可达（用于诊断）
function supaPing(){
  var start=Date.now();
  return __supaFetch(SUPABASE_URL+'/rest/v1/phone_registrations?select=count&limit=1',{
    method:'GET',
    headers:__supaHeaders(),
    timeout:5000
  },0).then(function(resp){
    return{ok:resp.ok,time:Date.now()-start};
  }).catch(function(e){
    return{ok:false,time:Date.now()-start,error:e.message||'超时'};
  });
}

// 兼容旧代码：supabase 变量（供 auth.js syncToCloud 降级使用）
var supabase=null;
// 尝试用新 API 快速检查连通性
supaPing().then(function(r){console.log('[Supabase] 连通性:',r.ok?'OK '+r.time+'ms':'失败: '+r.error);});
