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

  // بترجّع Promise<[ids الامتحانات اللي انمسحت محاولتها]> وما بتفشل أبدًا
  function examSyncSaved(force){
    const u = getSessionUser();
    if (!u || !u.phone) return Promise.resolve([]);
    if (examSyncBusy) return examSyncBusy;
    if (!force && Date.now() - examSyncAt < EXAM_SYNC_TTL_MS) return Promise.resolve([]);
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = setTimeout(function(){ if (ctrl) ctrl.abort(); }, 8000);
    examSyncBusy = fetch(SHEET_ENDPOINT + '?action=done&phone=' + encodeURIComponent(u.phone) + '&_=' + Date.now(), ctrl ? { signal: ctrl.signal } : {})
      .then(function(r){ return r.json(); })
      .then(function(d){
        clearTimeout(timer);
        const cleared = [];
        if (!d || !d.ok || !Array.isArray(d.exams)) return cleared;
        examSyncAt = Date.now();
        const done = {}; d.exams.forEach(function(n){ done[examNorm(n)] = true; });
        examDoneMap = done;
        const names = examSheetNames();
        Object.keys(names).forEach(function(id){
          const sv = examGetSaved(id);
          if (!sv) return;
          if (sv.t && Date.now() - sv.t < EXAM_SYNC_GRACE_MS) return;
          if (done[examNorm(names[id])]) return;
          const k = examSaveKey(id); safeStorageRemove(k); deleteCookie(k);
          cleared.push(id);
        });
        examReconcileCards();
        return cleared;
      })
      .catch(function(){ clearTimeout(timer); return []; })
      .then(function(cleared){ examSyncBusy = null; return cleared; });
    return examSyncBusy;
  }

  (function(){
    // لكل دالة فتح: معرّف الامتحان + العنصر اللي بيظهر لما يكون مفتوح
    const OPENERS = {
      exOpen:        { id: function(a){ return a[0]; },  el: function(a){ return 'ex-' + a[0]; } },
      openPwExam:    { id: function(){ return 'piecewise'; }, el: function(){ return 'pwExam'; } },
      openAngleExam: { id: function(){ return 'angle'; },     el: function(){ return 'angleExam'; } }
    };
    function init(){
      const fns = Object.keys(OPENERS);
      if (!fns.some(function(f){ return typeof window[f] === 'function'; })) return;   // صفحات بدون امتحانات
      fns.forEach(function(f){
        const orig = window[f];
        if (typeof orig !== 'function') return;
        window[f] = function(){
          const self = this, args = arguments, o = OPENERS[f];
          const r = orig.apply(self, args);                       // 1) بنفتح الامتحان فورًا
          setTimeout(examReconcileCards, 0);                      //    ولون الكرت حسب آخر رد من الشيت
          // 2) بالخلفية: فحص الشيت + فحص الحساب (إذا انتهى الكاش فقط)
          examSyncSaved(false).then(function(cleared){
            const id = o.id(args), el = document.getElementById(o.el(args));
            if (cleared.indexOf(id) !== -1 && el && !el.hidden) orig.apply(self, args);   // المحاولة انحذفت: نعيد فتحه جديد
          });
          try { if (typeof verifyAccount === 'function') verifyAccount(false); } catch(e){}
          return r;
        };
      });
      // بعد تسليم أي امتحان: الكرت بيصير أخضر فورًا (المحاولة انحفظت محليًا والشيت بيتسجل بالخلفية)
      ['exSubmit', 'submitPwExam', 'submitAngleExam'].forEach(function(f){
        const orig = window[f];
        if (typeof orig !== 'function') return;
        window[f] = function(){ const r = orig.apply(this, arguments); setTimeout(examReconcileCards, 0); return r; };
      });
      examSyncSaved(true);   // تسخين مبكر: لما الطالب يضغط على الامتحان يكون الفحص جاهز
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  })();
