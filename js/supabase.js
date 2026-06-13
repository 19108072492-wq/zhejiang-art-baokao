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

// ========== 授权用户验证 API ==========

// 检查手机号是否在授权用户表中
function checkUserAuthorization(phone) {
  var url = SUPABASE_URL + '/rest/v1/authorized_users?phone=eq.' + encodeURIComponent(phone) + '&is_active=eq.true&select=id,phone,expires_at,notes';
  var headers = __supaHeaders();
  console.log('[Supa] checkUserAuthorization 请求:', url);
  console.log('[Supa] headers:', JSON.stringify(headers));
  return __supaFetch(
    url,
    { method: 'GET', headers: headers, timeout: 8000 },
    1
  ).then(function(resp) {
    console.log('[Supa] 响应状态:', resp.status, resp.ok);
    if (!resp.ok) {
      return resp.text().then(function(txt) {
        console.error('[Supa] 响应内容:', txt);
        return { ok: false, error: 'HTTP ' + resp.status + ': ' + txt.substring(0, 200) };
      }).catch(function() {
        return { ok: false, error: 'HTTP ' + resp.status };
      });
    }
    return resp.json().then(function(data) {
      console.log('[Supa] 返回数据:', JSON.stringify(data));
      if (!data || data.length === 0) return { ok: true, authorized: false };
      var user = data[0];
      if (user.expires_at) {
        var exp = new Date(user.expires_at);
        if (exp < new Date()) return { ok: true, authorized: false, expired: true };
      }
      return { ok: true, authorized: true, data: user };
    }).catch(function(e) {
      console.error('[Supa] JSON解析失败:', e);
      return { ok: true, authorized: false };
    });
  }).catch(function(e) {
    console.error('[Supa] 网络错误:', e);
    return { ok: false, error: e.message || '网络错误' };
  });
}

// 管理员函数：添加授权用户
function addAuthorizedUser(body) {
  return __supaFetch(
    SUPABASE_URL + '/rest/v1/authorized_users',
    { method: 'POST', headers: __supaHeaders(), body: JSON.stringify(body), timeout: 10000 }
  ).then(function(resp) {
    if (resp.ok) return { ok: true };
    return resp.json().then(function(e) { return { ok: false, error: e }; }).catch(function() {
      return { ok: false, error: 'HTTP ' + resp.status };
    });
  }).catch(function(e) { return { ok: false, error: e.message || '网络错误' }; });
}

// 管理员函数：获取所有授权用户
function getAuthorizedUsers() {
  return __supaFetch(
    SUPABASE_URL + '/rest/v1/authorized_users?order=created_at.desc',
    { method: 'GET', headers: __supaHeaders(), timeout: 10000 },
    1
  ).then(function(resp) {
    if (resp.ok) return resp.json();
    throw new Error('HTTP ' + resp.status);
  });
}

// 管理员函数：更新授权用户（停用/延长/修改备注）
function updateAuthorizedUser(id, updates) {
  return __supaFetch(
    SUPABASE_URL + '/rest/v1/authorized_users?id=eq.' + encodeURIComponent(id),
    { method: 'PATCH', headers: __supaHeaders(), body: JSON.stringify(updates), timeout: 10000 }
  ).then(function(resp) {
    if (resp.ok) return { ok: true };
    return { ok: false, error: '更新失败' };
  }).catch(function(e) { return { ok: false, error: e.message || '网络错误' }; });
}

// 管理员函数：删除授权用户
function deleteAuthorizedUser(id) {
  return __supaFetch(
    SUPABASE_URL + '/rest/v1/authorized_users?id=eq.' + encodeURIComponent(id),
    { method: 'DELETE', headers: __supaHeaders(), timeout: 10000 }
  ).then(function(resp) {
    if (resp.ok) return { ok: true };
    return { ok: false, error: '删除失败' };
  }).catch(function(e) { return { ok: false, error: e.message || '网络错误' }; });
}

// 兼容旧代码：supabase 变量（供 auth.js syncToCloud 降级使用）
var supabase=null;
// 尝试用新 API 快速检查连通性
supaPing().then(function(r){console.log('[Supabase] 连通性:',r.ok?'OK '+r.time+'ms':'失败: '+r.error);});
