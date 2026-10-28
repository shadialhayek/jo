  // ===================== بوابة تسجيل الدخول الإجباري =====================
  const loginGate = document.getElementById('loginGate');
  const siteContent = document.getElementById('siteContent');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  function showLoginError(msg){
    loginError.textContent = msg;
    loginError.classList.add('show');
  }
  function hideLoginError(){
    loginError.classList.remove('show');
  }
  function unlockSite(){
    loginGate.hidden = true;
    siteContent.classList.add('unlocked');
    document.body.style.overflow = '';
    scheduleCardPopup();
    if (typeof applyVisited === 'function') applyVisited();
    if (typeof routeFromHash === 'function') routeFromHash();
    if (typeof pendingAction !== 'undefined' && pendingAction){ const a = pendingAction; pendingAction = null; a.click(); }
  }

  // localStorage قد يكون محجوب أو بيتصفّر بسرعة ببعض المتصفحات/التطبيقات
  // (متصفح داخل واتساب/انستغرام مثلاً)، فبنغلّفه بدالة آمنة، وبنخزن نسخة
  // احتياطية بكوكيز طويلة العمر (سنة كاملة) لأن الكوكيز أحيانًا بتنعاش
  // بأماكن ما بتنعاش فيها localStorage، والعكس صحيح
  function safeStorageGet(key){
    try { return localStorage.getItem(key); } catch(err){ return null; }
  }
  function safeStorageSet(key, value){
    try { localStorage.setItem(key, value); } catch(err){ /* تجاهل */ }
  }
  function safeStorageRemove(key){
    try { localStorage.removeItem(key); } catch(err){ /* تجاهل */ }
  }
  function setCookie(name, value, days){
    try {
      const maxAge = days * 24 * 60 * 60;
      document.cookie = name + '=' + encodeURIComponent(value) + '; max-age=' + maxAge + '; path=/; SameSite=Lax';
    } catch(err){ /* تجاهل */ }
  }
  function getCookie(name){
    try {
      const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[2]) : null;
    } catch(err){ return null; }
  }
  function deleteCookie(name){
    try { document.cookie = name + '=; max-age=0; path=/'; } catch(err){ /* تجاهل */ }
  }

  // بنقرأ من localStorage أولًا، وإذا مش موجودة منجرّب الكوكيز (نسخة احتياطية)
  function getRemembered(key){
    return safeStorageGet(key) || getCookie(key);
  }

  // ===== مدة الجلسة: ساعة واحدة من لحظة تسجيل الدخول =====
  const SESSION_MS = 7 * 24 * 60 * 60 * 1000;   // أسبوع كامل على نفس الجهاز

  function getLoginTime(){
    const v = parseInt(getRemembered('ao_login_time'), 10);
    return isNaN(v) ? 0 : v;
  }
  // الجلسة صالحة فقط إذا مرّ أقل من ساعة (ولو رجّع أحد ساعة الجهاز للخلف بتنرفض)
  function isSessionValid(){
    const t = getLoginTime();
    const now = Date.now();
    return t > 0 && now >= t && (now - t) < SESSION_MS;
  }
  function fillSavedFields(){
    const savedName = getRemembered('ao_user_name');
    const savedPhone = getRemembered('ao_user_phone');
    const savedTrack = getRemembered('ao_user_track');
    if (savedName) document.getElementById('loginName').value = savedName;
    if (savedPhone) document.getElementById('loginPhone').value = savedPhone;
    if (savedTrack) document.getElementById('loginTrack').value = savedTrack;
  }
  // يقفل الموقع ويرجّع بوابة تسجيل الدخول
  function lockSite(message){
    safeStorageRemove('ao_login_time');
    deleteCookie('ao_login_time');
    safeStorageRemove('ao_session_user');
    deleteCookie('ao_session_user');
    clearTimeout(cardTimer);
    safeStorageRemove('ao_card_shown');
    deleteCookie('ao_card_shown');
    document.getElementById('cardPop').hidden = true;
    siteContent.inert = false;
    const mm = document.getElementById('mobileMenu');
    if (mm) mm.classList.remove('open');
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = 'تسجيل الدخول والمتابعة';
    if (message) showLoginError(message); else hideLoginError();
    fillSavedFields();
  }
  function checkSession(){
    if (getRemembered('ao_login_time') && !isSessionValid()){
      lockSite('انتهت مدة جلستك (أسبوع)، سجّل دخولك من جديد.');
    }
  }

  // ===== سؤال بطاقة الأستاذ: بوب أب بعد 10 ثواني من تسجيل الدخول =====
  const CARD_POPUP_DELAY_MS = 10000;
  const CARD_QUESTION = 'هل تمتلك بطاقة الأستاذ شادي الحايك؟';
  const CARD_ANSWERS = {
    yes:  'نعم — يمتلك البطاقة',
    no:   'لا — لا يمتلك البطاقة ولا يريدها',
    want: 'لا يمتلك البطاقة — يريد الحصول عليها'
  };
  const CARD_THANKS = {
    yes:  'شكرًا لك ✓',
    no:   'شكرًا لك ✓',
    want: 'تم تسجيل طلبك ✓ جاري تحويلك للواتساب...'
  };
  const CARD_WA_NUMBER = '962788119796';
  let cardTimer = null;

  // للاختبار: افتح الصفحة برابط فيه ?testcard=1 وبيتمسح جواب البطاقة المحفوظ، فيرجع البوب أب يظهر
  try {
    if (new URLSearchParams(location.search).has('testcard')){
      Object.keys(localStorage).forEach(function(k){ if (k.indexOf('ao_card_') === 0) localStorage.removeItem(k); });
      document.cookie.split(';').forEach(function(c){
        const n = c.split('=')[0].trim();
        if (n.indexOf('ao_card_') === 0) document.cookie = n + '=; max-age=0; path=/';
      });
    }
  } catch(err){ /* تجاهل */ }

  function getSessionUser(){
    try { return JSON.parse(getRemembered('ao_session_user') || 'null'); } catch(err){ return null; }
  }
  function cardKey(phone){ return 'ao_card_answer_' + phone; }
  function cardAnswered(u){
    return !!(getRemembered(cardKey('anon')) || (u && u.phone && getRemembered(cardKey(u.phone))));
  }

  function closeCardPopup(){
    document.getElementById('cardPop').hidden = true;
    siteContent.inert = false;
    if (siteContent.classList.contains('unlocked')) document.body.style.overflow = '';
  }
  function showCardPopup(){
    if (!siteContent.classList.contains('unlocked')) return;
    const u = getSessionUser();
    if (cardAnswered(u)) return;
    // نسجّل إن السؤال انعرض، عشان لو الطالب عمل Refresh يرجع يظهرله فورًا
    safeStorageSet('ao_card_shown', '1');
    setCookie('ao_card_shown', '1', 1/24);
    document.getElementById('cardPopMain').hidden = false;
    document.getElementById('cardPopWant').hidden = true;
    document.getElementById('cardPopThanks').hidden = true;
    document.getElementById('cardPop').hidden = false;
    siteContent.inert = true;   // الجواب إجباري: ما بيقدر يتفاعل مع الموقع لحد ما يجاوب
    document.body.style.overflow = 'hidden';
    const first = document.querySelector('#cardPop .card-opt');
    if (first) first.focus();
  }
  // نجدول ظهور البوب أب: بعد 10 ثواني من الدخول، وإذا انعرض قبل وما جاوب بيظهر فورًا.
  // مين جاوب قبل (على نفس الجهاز) ما بنسأله ثاني.
  function scheduleCardPopup(){
    clearTimeout(cardTimer);
    const u = getSessionUser();
    if (cardAnswered(u)) return;
    const alreadyShown = getRemembered('ao_card_shown') === '1';
    cardTimer = setTimeout(showCardPopup, alreadyShown ? 0 : CARD_POPUP_DELAY_MS);
  }

  // الجواب النهائي: بنحفظه، بنسجله بالشيت، وبنعرض رسالة الشكر
  // إرسال جواب البطاقة للشيت (بصف الطالب نفسه، لازم يكون عنده رقم جوال)
  function sendCardRow(u, key){
    return sendToSheet({
      المصدر: 'بطاقة الأستاذ',
      الاسم: u.name,
      الجوال: u.phone,
      'الجيل/الفرع': u.track,
      الحالة: CARD_ANSWERS[key],
      الرسالة: CARD_QUESTION,
      التاريخ: new Date().toLocaleString('ar-JO')
    }).catch(err => console.warn('تعذر إرسال إجابة البطاقة للشيت:', err));
  }
  function finishCardAnswer(key){
    const u = getSessionUser();
    let waUrl = null;
    {
      const ck = cardKey(u && u.phone ? u.phone : 'anon');
      safeStorageSet(ck, key);
      setCookie(ck, key, 365);
      if (u && u.phone){
        sendCardRow(u, key);
      } else {
        // زائر غير مسجّل: الشيت بيربط الجواب برقم الطالب، فبنحتفظ بالجواب وبنرسله لحظة تسجيل دخوله
        safeStorageRemove('ao_card_anon_sent'); deleteCookie('ao_card_anon_sent');
      }
    }
    if (key === 'want'){
      const track = (u && u.track) ? u.track : '';
      const text = 'أريد الحصول على بطاقة الأستاذ' + (track ? ' — الجيل: ' + track : '');
      waUrl = 'https://wa.me/' + CARD_WA_NUMBER + '?text=' + encodeURIComponent(text);
    }
    document.getElementById('cardPopMain').hidden = true;
    document.getElementById('cardPopWant').hidden = true;
    const thanks = document.getElementById('cardPopThanks');
    thanks.textContent = CARD_THANKS[key];
    thanks.hidden = false;
    if (waUrl){
      // بنفتح الواتساب مباشرة (من ضغطة الطالب نفسها عشان ما يتحجب)
      const w = window.open(waUrl, '_blank', 'noopener');
      if (!w) window.location.href = waUrl;
    }
    setTimeout(closeCardPopup, waUrl ? 1500 : 2200);
  }

  document.querySelectorAll('#cardPop .card-opt').forEach(function(btn){
    btn.addEventListener('click', function(){
      const ans = btn.dataset.answer;
      if (ans === 'yes'){
        finishCardAnswer('yes');
      } else if (ans === 'no'){
        // ما عنده بطاقة: بنسأله إذا بدو يحصل عليها
        document.getElementById('cardPopMain').hidden = true;
        document.getElementById('cardPopWant').hidden = false;
        const first = document.querySelector('#cardPopWant .card-opt');
        if (first) first.focus();
      } else if (ans === 'want-yes'){
        finishCardAnswer('want');
      } else if (ans === 'want-no'){
        finishCardAnswer('no');
      }
    });
  });

  // للاختبار: افتح الموقع برابط فيه ?testlogin=1 وبينمسح تسجيل الدخول الحالي (بيرجع يطلب التسجيل)
  try {
    if (new URLSearchParams(location.search).has('testlogin')){
      safeStorageRemove('ao_login_time'); deleteCookie('ao_login_time');
      safeStorageRemove('ao_session_user'); deleteCookie('ao_session_user');
    }
  } catch(err){ /* تجاهل */ }

  // نسخة قديمة كانت تحفظ الدخول لسنة كاملة، منشيلها
  safeStorageRemove('ao_logged_in');
  deleteCookie('ao_logged_in');

  // ===== التصفح مفتوح للجميع؛ تسجيل الدخول إجباري فقط عند الامتحانات والتنزيل والحصص =====
  let pendingAction = null;
  function openLogin(msg, action){
    pendingAction = action || null;
    hideLoginError();
    const nt = document.getElementById('loginNote'); nt.textContent = msg || ''; nt.hidden = !msg;
    fillSavedFields();
    syncTrk();
    loginGate.hidden = false;
    document.body.style.overflow = 'hidden';
    const f = document.getElementById('loginName'); if (f) f.focus();
  }
  function closeLogin(){
    loginGate.hidden = true;
    pendingAction = null;
    document.body.style.overflow = '';
  }
  document.getElementById('loginClose').addEventListener('click', closeLogin);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !loginGate.hidden) closeLogin(); });
  const GATED = '.gen-panel a,.gen-panel button,[onclick*="exOpen("],[onclick*="openPwExam("],[onclick*="openAngleExam("],[onclick*="wsView("],[onclick*="wsDownload("],[onclick*="wsZoom("],a.item-card-btn[href*="youtu"]';
  document.addEventListener('click', function(e){
    if (isSessionValid()) return;
    const el = e.target.closest ? e.target.closest(GATED) : null;
    if (!el || el.closest('.gen-back,.back-link')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openLogin('سجّل دخولك لتفتح هذا المحتوى', el);
  }, true);

  // أزرار اختيار الجيل/الفرع (بتعبّي الـ select المخفي)
  const trackSel = document.getElementById('loginTrack'), trkBox = document.getElementById('trkChips');
  [...trackSel.options].forEach(function(o, i){
    if (!i) return;
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = o.text; b.dataset.v = o.value;
    b.addEventListener('click', function(){ trackSel.value = o.value; syncTrk(); });
    trkBox.appendChild(b);
  });
  function syncTrk(){ trkBox.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.dataset.v === trackSel.value); }); }

  siteContent.classList.add('unlocked');
  if (isSessionValid()){
    unlockSite();
  } else {
    fillSavedFields();
    window.addEventListener('load', function(){ if (typeof applyVisited === 'function') applyVisited(); });
    // بعد 10 ثواني: بوب أب سؤال البطاقة (حتى بدون تسجيل دخول)
    scheduleCardPopup();
  }

  // فحص دوري + عند رجوع الطالب للتبويب (المتصفح بيبطّئ المؤقتات بالتبويبات الخلفية)
  setInterval(checkSession, 15000);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) checkSession(); });
  window.addEventListener('focus', checkSession);

  loginForm.addEventListener('submit', function(e){
    e.preventDefault();
    hideLoginError();
    const nameVal = document.getElementById('loginName').value.trim();
    const phoneVal = document.getElementById('loginPhone').value.trim();
    const trackVal = document.getElementById('loginTrack').value;
    const rememberChecked = document.getElementById('rememberMe').checked;

    if (nameVal.length < 3){
      showLoginError('رجاءً أدخل اسمك الكامل');
      return;
    }
    if (!isValidJoPhone(phoneVal)){
      showLoginError('رجاءً أدخل رقم جوال أردني صحيح (مثال: 0791234567)');
      return;
    }
    if (!trackVal){
      showLoginError('رجاءً اختر الجيل والفرع');
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'جاري التسجيل...';

    const normalizedPhone = normalizeJoPhone(phoneVal);
    const previousPhone = getRemembered('ao_user_phone');

    // نحدد إذا هاد "دخول متكرر" لنفس الرقم على نفس الجهاز، عشان تظهر
    // الحالة بعمود بالشيت (تكرار حقيقي عبر كل الأجهزة لازم ينفحص من الشيت نفسه)
    let loginStatus = 'دخول جديد';
    if (previousPhone && previousPhone === normalizedPhone){
      loginStatus = 'دخول متكرر (نفس الرقم ونفس الجهاز)';
    } else if (previousPhone && previousPhone !== normalizedPhone){
      loginStatus = 'جهاز مستخدم من قبل برقم مختلف';
    }

    // وقت تسجيل الدخول (الجلسة بتنتهي بعد ساعة من هالوقت)
    const loginTime = String(Date.now());
    safeStorageSet('ao_login_time', loginTime);
    setCookie('ao_login_time', loginTime, 7);
    // بيانات الطالب طول الجلسة (بنحتاجها لإجابة سؤال البطاقة)
    const sessionUser = JSON.stringify({ name: nameVal, phone: normalizedPhone, track: trackVal });
    safeStorageSet('ao_session_user', sessionUser);
    setCookie('ao_session_user', sessionUser, 7);
    safeStorageRemove('ao_card_shown');
    deleteCookie('ao_card_shown');

    if (rememberChecked){
      // حفظ البيانات لتعبئتها تلقائيًا فقط (مش لتخطي تسجيل الدخول)
      safeStorageSet('ao_user_name', nameVal);
      safeStorageSet('ao_user_phone', normalizedPhone);
      safeStorageSet('ao_user_track', trackVal);
      setCookie('ao_user_name', nameVal, 365);
      setCookie('ao_user_phone', normalizedPhone, 365);
      setCookie('ao_user_track', trackVal, 365);
    } else {
      safeStorageRemove('ao_user_name');
      safeStorageRemove('ao_user_phone');
      safeStorageRemove('ao_user_track');
      deleteCookie('ao_user_name');
      deleteCookie('ao_user_phone');
      deleteCookie('ao_user_track');
    }

    unlockSite();

    sendToSheet({
      المصدر: 'تسجيل دخول',
      الاسم: nameVal,
      الجوال: normalizedPhone,
      'الجيل/الفرع': trackVal,
      الحالة: loginStatus,
      التاريخ: new Date().toLocaleString('ar-JO')
    }).then(function(){
      // إذا الطالب جاوب على البطاقة قبل ما يسجّل: بنرسل جوابه الحين برقمه (بعد ما ينكتب صف دخوله)
      const pk = getRemembered(cardKey('anon'));
      if (pk && CARD_ANSWERS[pk] && !getRemembered('ao_card_anon_sent')){
        safeStorageSet('ao_card_anon_sent', '1'); setCookie('ao_card_anon_sent', '1', 365);
        setTimeout(function(){ sendCardRow({ name: nameVal, phone: normalizedPhone, track: trackVal }, pk); }, 1200);
      }
    }).catch(err => console.warn('تعذر إرسال بيانات تسجيل الدخول للشيت:', err));
  });

  // ===================== إعدادات ربط Google Sheet =====================
  // رابط Google Apps Script (Web App) اللي بيسجل البيانات بجدول Excel/Google Sheet
  const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbyJlWWWHWFRdZezcH2MWtttxhcF3c1nrD8iWpAbAxJkV7I9RPKvqUVvndP3OzqXDTQ/exec";

  function sendToSheet(data){
    try{
      // no-cors: ما بنقدر نقرأ الرد، بس الطلب بيوصل للسكربت وبيسجل الصف بالشيت
      return fetch(SHEET_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(data)
      });
    } catch(err){
      console.warn('sendToSheet error:', err);
      return Promise.resolve();
    }
  }

  // ===================== تحقق من رقم الجوال الأردني =====================
  function normalizeJoPhone(v){
    v = (v || "").replace(/[\s-]/g, "");
    if (v.startsWith("+962")) v = "0" + v.slice(4);
    else if (v.startsWith("00962")) v = "0" + v.slice(5);
    else if (v.startsWith("962")) v = "0" + v.slice(3);
    return v;
  }
  function isValidJoPhone(v){
    return /^07[789]\d{7}$/.test(normalizeJoPhone(v));
  }

  // mobile menu
  const burger = document.getElementById('burgerBtn');
  const mMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => mMenu.classList.toggle('open'));

  // ===== single-page view switching (no external links, no "leave site" prompts) =====
  // ===== multi-page: كل قسم صار صفحة (ملف) لحاله =====
  const CUR_PAGE = (document.body && document.body.dataset.page) || 'home';
  const PAGE_FILES = {
    'home':'index.html', 'groups':'groups.html', 'testimonials':'testimonials.html', 'gallery':'gallery.html',
    'honor-board':'honor-board.html', 'schedule':'schedule.html', 'question-bank':'question-bank.html',
    'contact-fast':'contact-fast.html', 'exams':'exams.html', 'live':'live.html', 'lessons':'lessons.html',
    'eschool':'eschool.html'
  };
  function showView(key, push){
    if (!document.getElementById('view-' + key)){
      if (PAGE_FILES[key]) location.href = PAGE_FILES[key];
      return;
    }
    document.querySelectorAll('.view').forEach(v => v.hidden = true);
    const el = document.getElementById('view-' + key);
    if (el){ el.hidden = false; resetGenPicker(el); }
    window.scrollTo({ top: 0, behavior: 'auto' });
    mMenu.classList.remove('open');
    if (push !== false){
      history.pushState({ page: key }, '', '#' + key);
    }
  }

  // ===== دعم زر الرجوع من الموبايل ومن المتصفح =====
  if (!history.state){
    history.replaceState({ page: CUR_PAGE }, '', location.href);
  }
  window.addEventListener('popstate', function(e){
    const page = (e.state && e.state.page) || CUR_PAGE;
    showView(page, false);
  });
  function goBack(fallbackId){
    if (history.length > 1){
      history.back();
    } else {
      goHomeSection(fallbackId || 'about');
    }
  }

  // ===== لوحة الشرف: فلترة البحث عن اسم طالب =====
  const rankingSearch = document.getElementById('rankingSearch');
  const rankingCount = document.getElementById('rankingCount');
  const rankingRows = document.querySelectorAll('#rankingBody tr');
  function updateRankingCount(visible){
    if (rankingCount) rankingCount.textContent = 'عدد الأسماء الظاهرة: ' + visible + ' من ' + rankingRows.length;
  }
  if (rankingSearch){
    updateRankingCount(rankingRows.length);
    rankingSearch.addEventListener('input', function(){
      const q = this.value.trim();
      let visible = 0;
      rankingRows.forEach(tr => {
        const match = !q || qnorm(tr.dataset.name).indexOf(qnorm(q)) !== -1;
        tr.classList.toggle('no-match', !match);
        if (match) visible++;
      });
      updateRankingCount(visible);
    });
  }

  // jump to the home view, then smooth-scroll to a section inside it
  function goHomeSection(id, push){
    if (!document.getElementById('view-home')){
      location.href = 'index.html' + ((id && id !== 'top') ? '#home/' + id : '');
      return;
    }
    showView('home', push);
    requestAnimationFrame(() => {
      if (id === 'top') return;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  }

  // smooth-scroll used only for buttons that live inside the home view already
  function scrollToSection(id){
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
    mMenu.classList.remove('open');
  }
  function goToContact(trackValue){
    if (!document.getElementById('view-home')){
      location.href = 'index.html#home/contact/' + encodeURIComponent(trackValue || '');
      return;
    }
    var sel = document.getElementById('trackSelect');
    if (sel) sel.value = trackValue;
    showView('home');
    requestAnimationFrame(function(){
      var el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  }

  // ===== اختيار الجيل داخل صفحات الأقسام =====
  // أول ما تنفتح الصفحة بتظهر 3 مربعات (كل مربع جيل)، والضغط على مربع بيفتح مكان الرفع الخاص بهاد الجيل
  function resetGenPicker(root){
    root.querySelectorAll('.upload-section').forEach(function(sec){
      const picker = sec.querySelector('.gen-picker');
      if (!picker) return;
      picker.hidden = false;
      sec.querySelectorAll('.gen-panel').forEach(function(p){ p.hidden = true; });
    });
  }
  document.querySelectorAll('.gen-card').forEach(function(btn){
    btn.addEventListener('click', function(){
      const sec = btn.closest('.upload-section');
      sec.querySelector('.gen-picker').hidden = true;
      sec.querySelectorAll('.gen-panel').forEach(function(p){ p.hidden = (p.dataset.gen !== btn.dataset.gen); });
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  });
  document.querySelectorAll('.gen-back').forEach(function(btn){
    btn.addEventListener('click', function(){
      const sec = btn.closest('.upload-section');
      sec.querySelectorAll('.gen-panel').forEach(function(p){ p.hidden = true; });
      sec.querySelector('.gen-picker').hidden = false;
    });
  });

  // ===== بحث داخل كل قسم (الامتحانات / شاهد حصصك / بنك الأسئلة / المدرسة الإلكترونية) بعد اختيار الجيل =====
  function qnorm(s){
    return String(s || '').toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function(d){ return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/\s+/g, ' ').trim();
  }
  const GEN_SEARCH_HINT = {
    exams: 'ابحث عن الامتحان...',
    lessons: 'ابحث عن الحصة أو الدرس...',
    eschool: 'ابحث عن الملف أو ورقة العمل...',
    'question-bank': 'ابحث في بنك الأسئلة...'
  };
  document.querySelectorAll('.gen-panel').forEach(function(panel){
    const getCards = function(){ return panel.querySelectorAll('.item-card'); };
    const view = panel.closest('.view');
    const key = view ? view.id.replace('view-', '') : '';
    const wrap = document.createElement('div');
    wrap.className = 'gen-search';
    wrap.innerHTML = '<input type="text" class="ranking-search" autocomplete="off" placeholder="🔍 ' + (GEN_SEARCH_HINT[key] || 'ابحث...') + '">' +
      '<p class="ranking-count"></p><p class="gen-empty" hidden>ما لقينا نتائج مطابقة، جرّب كلمة ثانية.</p>';
    const back = panel.querySelector('.gen-back');
    if (back) back.insertAdjacentElement('afterend', wrap); else panel.insertBefore(wrap, panel.firstChild);
    const input = wrap.querySelector('input'), count = wrap.querySelector('.ranking-count'), empty = wrap.querySelector('.gen-empty');
    // الكروت بتنقرأ كل مرة (مش مرة وحدة) عشان أي شي جديد بينضاف بينلقى بالبحث تلقائي
    function run(){
      const cards = getCards();
      const q = qnorm(input.value), toks = q ? q.split(' ') : [];
      let vis = 0;
      cards.forEach(function(c){
        const body = c.querySelector('.item-card-body');
        const hay = qnorm(body ? body.textContent : c.textContent);
        const ok = toks.every(function(t){ return hay.indexOf(t) !== -1; });
        c.classList.toggle('no-match', !ok);
        if (ok) vis++;
      });
      count.textContent = cards.length ? 'عدد النتائج: ' + vis + ' من ' + cards.length : '';
      empty.hidden = !(toks.length && vis === 0);
    }
    input.addEventListener('input', run);
    run();
    if (back) back.addEventListener('click', function(){ input.value = ''; run(); });
  });

  // ===== upload widgets on the internal channel pages =====
  function fileIcon(){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>';
  }
  document.querySelectorAll('.upload-card').forEach(card => {
    const zone = card.querySelector('.upload-zone');
    const input = card.querySelector('.file-input');
    const list = card.querySelector('.file-list');
    if (!zone || !input || !list) return;

    function addFiles(files){
      [...files].forEach(f => {
        const li = document.createElement('li');
        li.className = 'file-item';
        const sizeKB = (f.size / 1024).toFixed(0);
        li.innerHTML = `<span class="f-name">${fileIcon()} ${f.name} <span style="color:#6E7690; font-weight:500;">(${sizeKB} كيلوبايت)</span></span><button type="button" class="f-remove" onclick="this.closest('li').remove()">إزالة</button>`;
        list.appendChild(li);
      });
    }

    input.addEventListener('change', e => addFiles(e.target.files));
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', e => { e.preventDefault(); zone.classList.remove('drag'); });
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag'); addFiles(e.dataTransfer.files); });
  });

  // reveal on scroll (single subtle entrance)
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // stat count-up
  const stats = document.querySelectorAll('.stat b');
  const statIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const raw = el.textContent.trim();
      const num = parseInt(raw.replace(/\D/g,''), 10);
      if (!isNaN(num) && num > 1){
        const suffix = raw.replace(/[0-9]/g,'');
        let cur = 0;
        const step = Math.max(1, Math.round(num/40));
        const t = setInterval(() => {
          cur += step;
          if (cur >= num){ cur = num; clearInterval(t); }
          el.textContent = cur + suffix;
        }, 25);
      }
      statIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  stats.forEach(s => statIO.observe(s));

  // carousel
  if (document.getElementById('carTrack')){
  const track = document.getElementById('carTrack');
  const slides = track.children;
  const dotsWrap = document.getElementById('carDots');
  let idx = 0;
  const galThumbs = document.getElementById('galThumbs');
  for (let i=0;i<slides.length;i++){
    const d = document.createElement('button');
    d.className = 'dot' + (i===0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  }
  function goTo(i){
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${idx * 100}%)`;
    [...dotsWrap.children].forEach((d,n) => d.classList.toggle('active', n===idx));
    if (galThumbs) [...galThumbs.children].forEach((b,n) => b.classList.toggle('active', n===idx));
  }
  if (galThumbs){
    [...slides].forEach(function(sl,i){
      const im = sl.querySelector('img'); if (!im) return;
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label','عرض الصورة ' + (i+1));
      if (i === 0) b.className = 'active';
      const t = document.createElement('img'); t.src = im.src; t.alt = ''; b.appendChild(t);
      b.addEventListener('click', function(){ goTo(i); });
      galThumbs.appendChild(b);
    });
  }
  document.getElementById('carNext').addEventListener('click', () => goTo(idx+1));
  document.getElementById('carPrev').addEventListener('click', () => goTo(idx-1));
  let autoSlide = setInterval(() => goTo(idx+1), 4500);
  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoSlide));
  track.parentElement.addEventListener('mouseleave', () => autoSlide = setInterval(() => goTo(idx+1), 4500));

  }

  // نموذج التواصل — بيرسل البيانات لجدول الشيت
  if (document.getElementById('contactForm')){
  document.getElementById('contactForm').addEventListener('submit', function(e){
    e.preventDefault();
    const form = this;
    const su = getSessionUser() || {};
    const nameVal = su.name || form.querySelector('input[type="text"]').value.trim();
    const phoneVal = su.phone || form.querySelector('input[type="tel"]').value.trim();
    const trackVal = su.track || document.getElementById('trackSelect').value;
    const msgVal = form.querySelector('textarea').value.trim();

    if (!nameVal || !trackVal){
      alert('رجاءً عبّئ الاسم والجيل / الفرع');
      return;
    }
    if (!isValidJoPhone(phoneVal)){
      alert('رجاءً أدخل رقم جوال أردني صحيح (مثال: 0791234567)');
      return;
    }

    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;

    // نظهر رسالة النجاح فورًا، وإرسال البيانات للشيت بيصير بالخلفية
    sendToSheet({
      المصدر: 'نموذج التواصل',
      الاسم: nameVal,
      الجوال: normalizeJoPhone(phoneVal),
      'الجيل/الفرع': trackVal,
      الرسالة: msgVal,
      التاريخ: new Date().toLocaleString('ar-JO')
    }).catch(err => console.warn('تعذر إرسال بيانات النموذج للشيت:', err));

    submitBtn.disabled = false;
    document.getElementById('formMsg').style.display = 'block';
    form.reset();
    syncContactFields();
  });

  // لما الطالب يكون مسجّل دخول: منخفي الاسم والجوال والجيل ونستخدم بيانات تسجيل الدخول
  function syncContactFields(){
    const f = document.getElementById('contactForm');
    const u = getSessionUser();
    const logged = !!(u && u.phone);
    f.querySelectorAll('.ct-id').forEach(function(el){ el.style.display = logged ? 'none' : ''; });
    if (logged){
      f.querySelector('input[type="text"]').value = u.name || '';
      f.querySelector('input[type="tel"]').value = u.phone || '';
      const sel = document.getElementById('trackSelect');
      if (u.track) sel.value = u.track;
    }
  }
  ['pointerenter','focusin','touchstart'].forEach(function(ev){
    document.getElementById('contactForm').addEventListener(ev, syncContactFields, {passive:true});
  });
  syncContactFields();
  }

  // ===================== ورقة العمل: عرض + تحميل + تسجيل بالشيت =====================
  let wsCur = null;
  const wsCache = {};
  function wsData(id){
    if (!wsCache[id]){
      const el = document.getElementById('wsdata-' + id);
      wsCache[id] = el ? JSON.parse(el.textContent) : null;
    }
    return wsCache[id];
  }
  function wsBytes(d){
    const bin = atob(d.pdf);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
  function wsLog(kind, name){
    try {
      const u = getSessionUser() || {};
      if (!u.phone) return;
      sendToSheet({
        المصدر: 'ملف',
        الاسم: u.name || '',
        الجوال: u.phone,
        'الجيل/الفرع': u.track || '',
        الحالة: kind,
        الرسالة: name,
        التاريخ: new Date().toLocaleString('ar-JO')
      }).catch(function(err){ console.warn('تعذر تسجيل الملف بالشيت:', err); });
    } catch(err){ console.warn(err); }
  }
  // ===== حفظ ملف على الجهاز مباشرة (آيفون / آيباد / أندرويد / كمبيوتر) =====
  function isIOSDevice(){
    try { return /iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); } catch(e){ return false; }
  }
  // لازم تنندعى مباشرة من ضغطة المستخدم (بدون انتظار) عشان سفاري يسمح بالتنزيل
  function saveFileToDevice(bytes, fileName){
    const canDl = ('download' in document.createElement('a'));
    // آيفون/آيباد: نوع الملف octet-stream عشان ما يفتحه عرض ويطلع سؤال التنزيل/الحفظ مباشرة (سفاري وكروم)
    const blob = new Blob([bytes], {type: (isIOSDevice() && canDl) ? 'application/octet-stream' : 'application/pdf'});
    const url = URL.createObjectURL(blob);
    if (!canDl){
      // آيفون قديم (قبل iOS 13) ما بيدعم خاصية download: بنفتح الـPDF وبيحفظه من زر المشاركة
      let w = null; try { w = window.open(url, '_blank'); } catch(e){}
      if (!w) location.href = url;
      setTimeout(function(){ URL.revokeObjectURL(url); }, 300000);
      return;
    }
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ a.remove(); URL.revokeObjectURL(url); }, 60000);
  }
  window.saveFileToDevice = saveFileToDevice; window.isIOSDevice = isIOSDevice;

  let wsExam = null;   // نتيجة امتحان مفتوحة بالمعاينة: {bytes, file, urls}
  function wsDownload(id){
    if (!id && wsExam){ saveFileToDevice(wsExam.bytes, wsExam.file); return; }
    id = id || wsCur; const d = wsData(id); if (!d) return;
    // الملف صار ملف PDF حقيقي على السيرفر: تنزيل مباشر من نفس ضغطة المستخدم (بدون انتظار)
    const a = document.createElement('a');
    a.href = d.pdf; a.download = /\.pdf$/i.test(d.file) ? d.file : d.file + '.pdf'; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ a.remove(); }, 1000);
    wsLog('تحميل', d.name);
  }
  function wsView(id){
    const d = wsData(id); if (!d) return;
    wsCur = id; wsExam = null;
    document.getElementById('wsTitle').textContent = d.name;
    const body = document.getElementById('wsBody');
    body.innerHTML = '';
    d.pages.forEach(function(src){ const im = document.createElement('img'); im.src = src; im.alt = d.name; body.appendChild(im); });
    document.getElementById('wsViewer').hidden = false;
    document.body.style.overflow = 'hidden';
    body.scrollTop = 0; wsPrep();
    wsLog('عرض', d.name);
  }
  // معاينة نتيجة امتحان (صفحات) مع زر تنزيل — بتنفتح بعد ما يجهز الـPDF
  function wsShowExam(title, urls, bytes, file){
    wsCur = null; wsExam = { bytes: bytes, file: file, urls: urls };
    document.getElementById('wsTitle').textContent = title;
    const body = document.getElementById('wsBody');
    body.innerHTML = '';
    urls.forEach(function(src){ const im = document.createElement('img'); im.src = src; im.alt = title; body.appendChild(im); });
    document.getElementById('wsViewer').hidden = false;
    document.body.style.overflow = 'hidden';
    body.scrollTop = 0; wsPrep();
  }
  function wsClose(){
    document.getElementById('wsViewer').hidden = true;
    document.getElementById('wsBody').innerHTML = '';
    if (wsExam){ wsExam.urls.forEach(function(u){ try { URL.revokeObjectURL(u); } catch(e){} }); wsExam = null; }
    document.body.style.overflow = document.querySelector('.qx:not([hidden])') ? 'hidden' : '';
  }
  // ===== شريط المعاينة (رقم الصفحة + تكبير/تصغير) =====
  const WS_ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  let wsZi = 2, wsBound = false;
  function wsApplyZoom(){
    const body = document.getElementById('wsBody'), z = WS_ZOOMS[wsZi];
    body.querySelectorAll('img').forEach(function(im){ im.style.setProperty('--z', z); });
    document.getElementById('wsZoomVal').textContent = Math.round(z * 100) + '%';
  }
  function wsZoom(dir){ wsZi = Math.max(0, Math.min(WS_ZOOMS.length - 1, wsZi + dir)); wsApplyZoom(); wsPageNo(); }
  function wsPageNo(){
    const body = document.getElementById('wsBody'), imgs = body.querySelectorAll('img');
    let cur = 1; const mid = body.getBoundingClientRect().top + body.clientHeight / 3;
    imgs.forEach(function(im, i){ if (im.getBoundingClientRect().top <= mid) cur = i + 1; });
    document.getElementById('wsPageNo').textContent = cur;
    document.getElementById('wsPageTot').textContent = imgs.length;
  }
  function wsPrep(){
    wsZi = 2; wsApplyZoom(); wsPageNo();
    document.getElementById('wsBody').querySelectorAll('img').forEach(function(im){ im.addEventListener('load', wsPageNo); });
    if (!wsBound){ wsBound = true; let t = 0; document.getElementById('wsBody').addEventListener('scroll', function(){ if (!t) t = requestAnimationFrame(function(){ t = 0; wsPageNo(); }); }, {passive:true}); }
  }
  window.wsZoom = wsZoom;
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') wsClose(); });
  window.wsView = wsView; window.wsDownload = wsDownload; window.wsClose = wsClose; window.wsShowExam = wsShowExam;
