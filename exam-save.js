  // ===== لازم الطالب يكون مسجّل دخول قبل أي امتحان (حتى لو فتح الامتحان من رابط مباشر #exams/...) =====
  function examNeedLogin(retry){
    let u = null; try { u = getSessionUser(); } catch(e){}
    if (isSessionValid() && u && u.phone) return false;
    // بعد ما يسجّل دخول بنعيد فتح نفس الامتحان تلقائيًا
    openLogin('سجّل دخولك لتبدأ الامتحان — علامتك لازم تنسجّل باسمك ورقمك', retry ? { click: retry } : null);
    return true;
  }

  // ===== محاولة واحدة فقط لكل امتحان: بنحفظ إجابات الطالب (حسب رقم جواله) وبنعرضها له بدل ما نفتح الامتحان من جديد =====
  function examSaveKey(id){ const u = getSessionUser() || {}; return 'ao_exam_' + (u.phone || 'anon') + '_' + id; }
  function examGetSaved(id){
    try { const v = JSON.parse(getRemembered(examSaveKey(id)) || 'null'); return (v && Array.isArray(v.a)) ? v : null; } catch(e){ return null; }
  }
  function examSetSaved(id, ans, n){
    const a = []; for (let i = 0; i < n; i++) a.push(ans[i] || '');
    const k = examSaveKey(id), v = JSON.stringify({ a: a, t: Date.now() });
    safeStorageSet(k, v); setCookie(k, v, 730);
    try { window.__lastExamAnswers = { sheet: examSheetNames()[id], a: a }; } catch(e){}
  }
  // للمعلّم فقط (للتجربة): افتح الموقع برابط فيه ?resetexams=1 وبتتصفّر محاولات هذا الجهاز
  try {
    if (new URLSearchParams(location.search).has('resetexams')){
      Object.keys(localStorage).forEach(function(k){ if (k.indexOf('ao_exam_') === 0) localStorage.removeItem(k); });
      document.cookie.split(';').forEach(function(c){ const n = c.split('=')[0].trim(); if (n.indexOf('ao_exam_') === 0) document.cookie = n + '=; max-age=0; path=/'; });
    }
  } catch(e){}

  // ===== الشيت هو المرجع: إذا الأستاذ حذف صف (طالب + امتحان) من ورقة "الامتحانات"، بيرجع الامتحان مفتوح للطالب =====
  // مهم: الفحص هذا بيصير بالخلفية. الامتحان بينفتح فورًا من بيانات الجهاز (0 ثانية انتظار)،
  // وإذا الشيت ردّ بعدين إن المحاولة انحذفت، بنمسحها وبنعيد فتح الامتحان "جديد" لحاله.
  // (قبل كده كان الامتحان بيستنى رد سكربت جوجل 3-4 ثواني قبل ما ينفتح.)
  const EXAM_SYNC_GRACE_MS = 3 * 60 * 1000;   // امتحان انسلّم من أقل من 3 دقايق ما منلمسه (لسا بينكتب بالشيت)
  const EXAM_SYNC_TTL_MS   = 60 * 1000;       // نتيجة الفحص بتضل صالحة دقيقة، وما منكرره أسرع من هيك
  let examSyncAt = 0, examSyncBusy = null, examDoneMap = null;

  function examSheetNames(){
    const m = {
      piecewise: 'اختبار الدرس الأول — الاقترانات المتشعبة (الوحدة الأولى 2010)',
      angle: 'امتحان قياس الزاوية بالراديان (الوحدة الثانية 2010)'
    };
    try { Object.keys(EXAMS).forEach(function(id){ m[id] = EXAMS[id].sheet; }); } catch(e){}
    return m;
  }
  function examNorm(s){ return String(s || '').replace(/[\u064B-\u065F\u0640\u200e\u200f]/g, '').replace(/\s+/g, ' ').trim(); }

  // لون كروت الامتحانات: أخضر فقط إذا الامتحان مسجّل بالشيت (أو الطالب لسا مسلّمه من دقايق).
  // إذا الأستاذ حذف الصف بيرجع الكرت لونه الأصلي. إذا ما عرفنا نوصل للشيت ما منغيّر شي.
  function examReconcileCards(){
    if (!examDoneMap || typeof setVisitedExam !== 'function') return;
    try {
      const names = examSheetNames();
      Object.keys(names).forEach(function(id){
        setVisitedExam(id, !!examDoneMap[examNorm(names[id])] || !!examGetSaved(id));
      });
    } catch(e){}
  }

  // ===== السيرفر هو المرجع (بدل الشيت) =====
  // examServerMap: اسم الامتحان المطبّع -> محاولة الطالب المسجّلة عند السيرفر (بتتحمّل بالخلفية)
  let examServerMap = null;
  function examServerAttempt(id){
    if (!examServerMap) return null;
    try { return examServerMap[examNorm(examSheetNames()[id])] || null; } catch(e){ return null; }
  }
  function examWriteSaved(id, a){
    const k = examSaveKey(id), v = JSON.stringify({ a: a, t: Date.now() - EXAM_SYNC_GRACE_MS - 1000 });
    safeStorageSet(k, v); setCookie(k, v, 730);
  }

  // بترجّع Promise<[ids الامتحانات اللي الأستاذ أعاد فتحها]> وما بتفشل أبدًا
  function examSyncSaved(force){
    const u = getSessionUser();
    const A = window.StudentAccount;
    if (!u || !u.phone || !A || typeof A.call !== 'function') return Promise.resolve([]);
    if (examSyncBusy) return examSyncBusy;
    if (!force && Date.now() - examSyncAt < EXAM_SYNC_TTL_MS) return Promise.resolve([]);
    examSyncBusy = A.call('GET', '/api/me/exams')
      .then(function(d){
        const cleared = [];
        if (!d || !d.ok || !Array.isArray(d.attempts)) return cleared;
        examSyncAt = Date.now();
        const done = {}, map = {};
        d.attempts.forEach(function(x){ const k = examNorm(x.name); done[k] = true; map[k] = x; });
        examDoneMap = done; examServerMap = map;
        const names = examSheetNames();
        Object.keys(names).forEach(function(id){
          const sv = examGetSaved(id);
          if (!sv) return;
          if (sv.t && Date.now() - sv.t < EXAM_SYNC_GRACE_MS) return;   // لسا انسلّم من دقايق
          if (done[examNorm(names[id])]) return;
          const k = examSaveKey(id); safeStorageRemove(k); deleteCookie(k);   // الأستاذ أعاد فتحه
          cleared.push(id);
        });
        examReconcileCards();
        return cleared;
      })
      .catch(function(){ return []; })
      .then(function(cleared){ examSyncBusy = null; return cleared; });
    return examSyncBusy;
  }

  (function(){
    const OPENERS = {
      exOpen:        { id: function(a){ return a[0]; },  el: function(a){ return 'ex-' + a[0]; } },
      openPwExam:    { id: function(){ return 'piecewise'; }, el: function(){ return 'pwExam'; } },
      openAngleExam: { id: function(){ return 'angle'; },     el: function(){ return 'angleExam'; } }
    };
    function init(){
      const fns = Object.keys(OPENERS);
      if (!fns.some(function(f){ return typeof window[f] === 'function'; })) return;
      fns.forEach(function(f){
        const orig = window[f];
        if (typeof orig !== 'function') return;
        window[f] = function(){
          const self = this, args = arguments, o = OPENERS[f], id = o.id(args);
          function open(fresh){
            // قبل ما نمنع الطالب: نتأكد من السيرفر (يمكن الأستاذ أعاد فتح الامتحان من الداشبورد وصفحة الطالب لسا قديمة)
            if (!fresh && getSessionUser() && (examServerAttempt(id) || examGetSaved(id))){
              return examSyncSaved(true).then(function(){ return open(true); });
            }
            // محاولة وحدة: إذا السيرفر مسجّل تسليم الطالب وما عنده نسخة محلية (جهاز جديد) بنرجّعله نتيجته ما بنفتح الامتحان من جديد
            const sa = examServerAttempt(id);
            if (sa && !examGetSaved(id)){
              if (Array.isArray(sa.answers) && sa.answers.length){ examWriteSaved(id, sa.answers); }
              else {
                alert('سلّمت هذا الامتحان من قبل (علامتك ' + sa.score + ' / ' + sa.max + '). كل امتحان بينعمل مرة وحدة. إذا بدك تعيده تواصل مع الأستاذ.');
                return;
              }
            }
            const r = orig.apply(self, args);
            setTimeout(examReconcileCards, 0);
            examSyncSaved(false).then(function(cleared){
              const el = document.getElementById(o.el(args));
              if (cleared.indexOf(id) !== -1 && el && !el.hidden) orig.apply(self, args);   // الأستاذ أعاد فتحه: بنعيد فتحه جديد
            });
            try { if (typeof verifyAccount === 'function') verifyAccount(false); } catch(e){}
            return r;
          }
          // أول مرة بالجلسة: بننتظر رد السيرفر (أجزاء من الثانية) قبل ما نقرر
          if (!examServerMap && getSessionUser()) return examSyncSaved(true).then(function(){ return open(true); });
          return open();
        };
      });
      ['exSubmit', 'submitPwExam', 'submitAngleExam'].forEach(function(f){
        const orig = window[f];
        if (typeof orig !== 'function') return;
        window[f] = function(){ const r = orig.apply(this, arguments); setTimeout(examReconcileCards, 0); return r; };
      });
      examSyncSaved(true);   // تسخين مبكر
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  })();
