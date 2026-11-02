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

  // ===== الشيت هو المرجع: إذا الأستاذ حذف صف (طالب + امتحان) من ورقة "الامتحانات"، بيرجع الامتحان مفتوح للطالب =====
  // قبل ما ينفتح أي امتحان بنسأل الشيت أي امتحانات إلها صف لهالطالب. الامتحان المحفوظ عنده وما إله صف بنمسحه (بيصير جديد).
  // إذا الاتصال فشل: ما بنمسح شي (بيضل زي القديم). والامتحان اللي انسلّم من أقل من 3 دقايق ما بنلمسه (لسا بينكتب بالشيت).
  const EXAM_SYNC_GRACE_MS = 3 * 60 * 1000;
  function examSheetNames(){
    const m = {
      piecewise: 'اختبار الدرس الأول — الاقترانات المتشعبة (الوحدة الأولى 2010)',
      angle: 'امتحان قياس الزاوية بالراديان (الوحدة الثانية 2010)'
    };
    try { Object.keys(EXAMS).forEach(function(id){ m[id] = EXAMS[id].sheet; }); } catch(e){}
    return m;
  }
  function examNorm(s){ return String(s || '').replace(/[\u064B-\u065F\u0640\u200e\u200f]/g, '').replace(/\s+/g, ' ').trim(); }
  function examSyncSaved(){
    const u = getSessionUser();
    if (!u || !u.phone) return Promise.resolve();
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = setTimeout(function(){ if (ctrl) ctrl.abort(); }, 6000);
    return fetch(SHEET_ENDPOINT + '?action=done&phone=' + encodeURIComponent(u.phone) + '&_=' + Date.now(), ctrl ? { signal: ctrl.signal } : {})
      .then(function(r){ return r.json(); })
      .then(function(d){
        clearTimeout(timer);
        if (!d || !d.ok || !Array.isArray(d.exams)) return;
        const done = {}; d.exams.forEach(function(n){ done[examNorm(n)] = true; });
        const names = examSheetNames();
        Object.keys(names).forEach(function(id){
          const sv = examGetSaved(id);
          if (!sv) return;
          if (sv.t && Date.now() - sv.t < EXAM_SYNC_GRACE_MS) return;
          if (done[examNorm(names[id])]) return;
          const k = examSaveKey(id); safeStorageRemove(k); deleteCookie(k);
        });
      })
      .catch(function(){ clearTimeout(timer); });
  }
  (function(){
    function init(){
      const fns = ['exOpen', 'openPwExam', 'openAngleExam'];
      if (!fns.some(function(f){ return typeof window[f] === 'function'; })) return;   // صفحات بدون امتحانات
      fns.forEach(function(f){
        const orig = window[f];
        if (typeof orig !== 'function') return;
        window[f] = function(){
          const self = this, args = arguments;
          examSyncSaved().then(function(){ orig.apply(self, args); });
        };
      });
      examSyncSaved();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  })();
