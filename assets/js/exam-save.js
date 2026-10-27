  // ===== محاولة واحدة فقط لكل امتحان: بنحفظ إجابات الطالب (حسب رقم جواله) وبنعرضها له بدل ما نفتح الامتحان من جديد =====
  function examSaveKey(id){ const u = getSessionUser() || {}; return 'ao_exam_' + (u.phone || 'anon') + '_' + id; }
  function examGetSaved(id){
    try { const v = JSON.parse(getRemembered(examSaveKey(id)) || 'null'); return (v && Array.isArray(v.a)) ? v : null; } catch(e){ return null; }
  }
  function examSetSaved(id, ans, n){
    const a = []; for (let i = 0; i < n; i++) a.push(ans[i] || '');
    const k = examSaveKey(id), v = JSON.stringify({ a: a, t: Date.now() });
    safeStorageSet(k, v); setCookie(k, v, 730);
  }
  // للمعلّم فقط (للتجربة): افتح الموقع برابط فيه ?resetexams=1 وبتتصفّر محاولات هذا الجهاز
  try {
    if (new URLSearchParams(location.search).has('resetexams')){
      Object.keys(localStorage).forEach(function(k){ if (k.indexOf('ao_exam_') === 0) localStorage.removeItem(k); });
      document.cookie.split(';').forEach(function(c){ const n = c.split('=')[0].trim(); if (n.indexOf('ao_exam_') === 0) document.cookie = n + '=; max-age=0; path=/'; });
    }
  } catch(e){}
