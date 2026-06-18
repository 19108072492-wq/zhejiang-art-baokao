/**
 * 小凡择校·艺考志愿填报神器 — Supabase REST 客户端（零 CDN 依赖）
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
  return __supaFetch(SUPABASE_URL+'/rest/v1/phone_registrations?select=id,phone,grade,direction,advisor_code,created_at&order=created_at.desc&limit='+limit,{
    method:'GET',
    headers:__supaHeaders(),
    timeout:10000
  }).then(function(resp){
    if(resp.ok)return resp.json();
    throw new Error('HTTP '+resp.status);
  });
}

// 按顾问码查询绑定学生（用于顾问看板）
function supaGetAdvisorClients(advisorCode){
  return __supaFetch(
    SUPABASE_URL+'/rest/v1/phone_registrations?select=id,phone,grade,direction,advisor_code,created_at&advisor_code=eq.'+encodeURIComponent(advisorCode)+'&order=created_at.desc&limit=500',
    { method:'GET', headers:__supaHeaders(), timeout:10000 }
  ).then(function(resp){
    if(resp.ok)return resp.json();
    throw new Error('HTTP '+resp.status);
  });
}

// 查询所有顾问（从 authorized_users 中解析 notes 字段）
function supaGetAdvisors(){
  return __supaFetch(
    SUPABASE_URL+'/rest/v1/authorized_users?select=id,phone,name,is_active,expires_at,notes&order=created_at.desc&limit=200',
    { method:'GET', headers:__supaHeaders(), timeout:10000 }
  ).then(function(resp){
    if(resp.ok)return resp.json().then(function(users){
      // 解析 notes 中的 advisor_code 和 display_name
      return users.filter(function(u){
        return u.notes&&u.notes.indexOf('advisor_code:')!==-1;
      }).map(function(u){
        var parsed={};
        var parts=(u.notes||'').split('|');
        for(var i=0;i<parts.length;i++){
          var kv=parts[i].split(':',2);
          if(kv.length===2)parsed[kv[0]]=kv[1];
        }
        return {
          id:u.id, phone:u.phone, name:u.name, is_active:u.is_active,
          expires_at:u.expires_at, notes:u.notes,
          advisor_code:parsed.advisor_code||'',
          display_name:parsed.display_name||u.name||''
        };
      });
    });
    throw new Error('HTTP '+resp.status);
  });
}

// 更新授权用户（含顾问信息）
function supaUpdateAuthUser(id, updates){
  return __supaFetch(
    SUPABASE_URL+'/rest/v1/authorized_users?id=eq.'+encodeURIComponent(id),
    { method:'PATCH', headers:__supaHeaders(), body:JSON.stringify(updates), timeout:10000 }
  ).then(function(resp){
    if(resp.ok)return{ok:true};
    return resp.json().then(function(e){return{ok:false,error:e.message||'更新失败'};}).catch(function(){return{ok:false,error:'HTTP '+resp.status};});
  });
}

// 添加授权用户（含顾问信息）
function addAdvisorUser(body){
  // 将 advisor_code 和 display_name 编码到 notes 中
  var parts=[];
  var notes=body.notes||'';
  if(notes)parts.push(notes);
  if(body.advisor_code)parts.push('advisor_code:'+body.advisor_code);
  if(body.display_name)parts.push('display_name:'+body.display_name);
  var mergedNotes=parts.join('|');
  var reqBody={phone:body.phone,name:body.name,is_active:body.is_active!==false,notes:mergedNotes};
  if(body.expires_at)reqBody.expires_at=body.expires_at;
  if(body.major_direction)reqBody.major_direction=body.major_direction;
  return addAuthorizedUser(reqBody);
}

// 获取所有注册用户（管理员看板用）
function supaGetAllRegistrations(){
  return __supaFetch(
    SUPABASE_URL+'/rest/v1/phone_registrations?select=id,phone,grade,direction,advisor_code,created_at&order=created_at.desc&limit=1000',
    { method:'GET', headers:__supaHeaders(), timeout:10000 }
  ).then(function(resp){
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
  return __supaFetch(
    url,
    { method: 'GET', headers: headers, timeout: 8000 },
    1
  ).then(function(resp) {
    if (!resp.ok) {
      return resp.text().then(function(txt) {
        return { ok: false, error: 'HTTP ' + resp.status + ': ' + txt.substring(0, 200) };
      }).catch(function() {
        return { ok: false, error: 'HTTP ' + resp.status };
      });
    }
    return resp.json().then(function(data) {
      if (!data || data.length === 0) return { ok: true, authorized: false };
      var user = data[0];
      if (user.expires_at) {
        var exp = new Date(user.expires_at);
        if (exp < new Date()) return { ok: true, authorized: false, expired: true };
      }
      return { ok: true, authorized: true, data: user };
    }).catch(function(e) {
      return { ok: true, authorized: false };
    });
  }).catch(function(e) {
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
    return resp.json().then(function(e) {
      // Supabase 返回 {code, message, hint, details}，提取 message 便于 toast 显示
      var msg = (e && e.message) ? e.message : ('HTTP ' + resp.status);
      if (e && e.code === '23505') msg = '该手机号已被授权';
      return { ok: false, error: msg };
    }).catch(function() {
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
