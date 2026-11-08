/*
 * ودجت حساب الطالب — زر "تسجيل الدخول" / حساب الطالب بالزاوية فوق.
 *
 * الاستخدام البسيط (نفس دومين السيرفر):
 *   <script src="/account-widget.js" defer data-corner="left"></script>
 *
 * الاستخدام مع موقع على دومين ثاني (مثل GitHub Pages) — بنحط الإعدادات قبل السكربت:
 *   <script>window.StudentAccountConfig = {
 *     api: "https://دومين-السيرفر",          // لازم HTTPS، وبالسيرفر ALLOWED_ORIGINS=https://موقعك
 *     mount: "#accountSlot",                   // مكان الزر جوا الهيدر (اختياري، وإلا بيطفو بالزاوية)
 *     tracks: [{ label: "2009 — متقدم", grade: 12 }, ...]   // اختياري: قائمة الجيل/الفرع بدل الصف
 *   };</script>
 *   <script src="account-widget.js" defer></script>
 *
 * (نفس الإعدادات ممكن تنكتب كـ data-api / data-mount / data-corner على وسم السكربت)
 *
 * أحداث على window:
 *   student:login    طالب سجّل دخول للتو (detail = بيانات الطالب)
 *   student:restore  الصفحة انفتحت وفي جلسة شغّالة محفوظة (detail = بيانات الطالب)
 *   student:logout   طالب سجّل خروج (detail = بياناته القديمة)
 *   student:update   الطالب عدّل بياناته أو صورته
 *   student:ready    انتهى الفحص الأول (detail = { user, available })
 *   student:loginclose  الطالب سكّر نافذة الدخول بدون ما يسجّل
 * كائن عام: window.StudentAccount = { getUser, openLogin(msg), logout, available, ready, track }
 *
 * تتبع النشاط (بيشتغل تلقائياً لما الطالب يكون مسجّل دخول):
 *   - مدة وجوده الفعلية على الموقع (نبضة كل 30 ثانية طالما الصفحة مفتوحة وهو بيتفاعل)
 *   - الصفحات اللي بيزورها
 *   - تنزيل الملفات (روابط PDF/Word/PowerPoint/Excel/ZIP أو أي رابط عليه download أو data-track="download")
 *   - الامتحانات: الصفحة بتستدعي هالسطر لما الطالب يخلّص:
 *       window.StudentAccount.track('exam', { ref: 'امتحان الوحدة الأولى', score: 17, max: 20 });
 */
(() => {
  if (window.StudentAccount) return;
  const script = document.currentScript;
  const CFG = Object.assign({}, window.StudentAccountConfig || {});
  const pick = (k) => script?.dataset[k] ?? CFG[k];
  const API = String(pick('api') || '').replace(/\/$/, '');
  const corner = pick('corner') === 'right' ? 'right' : 'left';
  const MOUNT = pick('mount') || '';
  const TRACKS = Array.isArray(CFG.tracks) && CFG.tracks.length ? CFG.tracks : null;

  // سيرفر على دومين ثاني → بنستخدم توكن بهيدر Authorization (الكوكيز بتنحجب بسفاري وغيره)
  const TOKEN_MODE = (() => {
    if (!API) return false;
    try {
      return new URL(API, location.href).origin !== location.origin;
    } catch {
      return false;
    }
  })();
  const TK = 'student_acct_token';
  const tokenGet = () => { try { return localStorage.getItem(TK); } catch { return null; } };
  const tokenSet = (t) => { try { localStorage.setItem(TK, t); } catch {} };
  const tokenClear = () => { try { localStorage.removeItem(TK); } catch {} };

  const GRADES = {
    1: 'الصف الأول', 2: 'الصف الثاني', 3: 'الصف الثالث', 4: 'الصف الرابع', 5: 'الصف الخامس', 6: 'الصف السادس',
    7: 'الصف السابع', 8: 'الصف الثامن', 9: 'الصف التاسع', 10: 'الصف العاشر', 11: 'الصف الحادي عشر', 12: 'الصف الثاني عشر (توجيهي)',
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // خيارات الجيل/الفرع (أو الصف إذا ما في إعداد tracks)
  const levelLabel = TRACKS ? 'الجيل / الفرع' : 'الصف';
  const levelPlaceholder = TRACKS ? 'اختر الجيل والفرع' : 'اختر الصف';
  function levelOptions(user) {
    const cur = TRACKS ? user?.track || '' : String(user?.grade || '');
    const opts = TRACKS
      ? TRACKS.map((t, i) => [String(i), t.label, t.label === cur])
      : Object.entries(GRADES).map(([k, v]) => [k, v, k === cur]);
    return `<option value="">${levelPlaceholder}</option>` + opts.map(([v, t, sel]) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(t)}</option>`).join('');
  }
  // بيحوّل القيمة المختارة لحقول جاهزة للإرسال
  function levelPayload(value) {
    if (value === '' || value == null) return null;
    if (TRACKS) {
      const t = TRACKS[Number(value)];
      return t ? { grade: t.grade, track: t.label } : null;
    }
    return { grade: value };
  }
  const levelText = (u) => (TRACKS ? u.track || u.gradeLabel : u.gradeLabel) || '';

  async function call(method, url, body, raw, extra) {
    const headers = {};
    const opts = { method, headers, credentials: TOKEN_MODE ? 'omit' : 'include', ...extra };
    const t = TOKEN_MODE ? tokenGet() : null;
    if (t) headers.Authorization = 'Bearer ' + t;
    if (raw) {
      opts.body = raw;
      headers['Content-Type'] = raw.type;
    } else if (body !== undefined) {
      opts.body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), 15000);
    if (ctrl) opts.signal = ctrl.signal;
    let r;
    try {
      r = await fetch(API + url, opts);
    } catch {
      throw Object.assign(new Error('تعذّر الاتصال بالخادم'), { network: true });
    } finally {
      clearTimeout(timer);
    }
    let data = {};
    try {
      data = await r.json();
    } catch {}
    if (!r.ok) throw Object.assign(new Error(data.error || 'صار خطأ، جرّب مرة ثانية'), { status: r.status });
    return data;
  }
  // بعد دخول ناجح: بنحفظ التوكن إذا كنا بوضع الدومين المختلف
  function keepToken(d) {
    if (!TOKEN_MODE) return;
    if (!d.token) throw new Error('إعدادات السيرفر ناقصة (ALLOWED_ORIGINS). تواصل مع الإدارة.');
    tokenSet(d.token);
  }

  // مربّع من وسط الصورة بحجم 512px (بيصغّر حجم الرفع كتير)
  async function squareJpeg(file, size = 512) {
    let bmp;
    try {
      bmp = await createImageBitmap(file);
    } catch {
      throw new Error('صيغة الصورة غير مدعومة، جرّب JPG أو PNG');
    }
    const s = Math.min(bmp.width, bmp.height);
    const c = document.createElement('canvas');
    c.width = c.height = Math.min(size, s);
    c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, c.width, c.height);
    return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('تعذّرت معالجة الصورة'))), 'image/jpeg', 0.85));
  }

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: "Tajawal", system-ui, -apple-system, "Segoe UI", Tahoma, "Noto Sans Arabic", sans-serif; }
    .wrap { direction: rtl; color: #0f172a; font-size: 15px; }
    .wrap.float { position: fixed; top: 12px; ${corner}: 12px; z-index: 2147483000; }
    .wrap.slot { position: relative; }
    button { font: inherit; cursor: pointer; }
    .login-btn { display: inline-flex; align-items: center; gap: 7px; background: #2563eb; color: #fff; border: 0; border-radius: 999px; padding: 9px 18px; font-weight: 700; box-shadow: 0 2px 8px rgba(37,99,235,.35); white-space: nowrap; }
    .login-btn:hover { background: #1d4ed8; }
    .login-btn svg { width: 18px; height: 18px; flex: none; display: none; }
    .chip { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 6px 4px 14px; box-shadow: 0 2px 8px rgba(15,23,42,.12); max-width: 220px; }
    .chip span.nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; color: #0f172a; }
    .av { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; background: #dbeafe; color: #1d4ed8; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex: none; }
    .av.big { width: 72px; height: 72px; font-size: 28px; }
    .pf { max-width: 460px; max-height: 88vh; overflow: auto; text-align: right; }
    .pf-top { display: flex; gap: 12px; align-items: center; }
    .pf-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 14px 0; text-align: center; }
    .pf-kpis div { background: #f1f5f9; border-radius: 12px; padding: 10px 4px; }
    .pf-kpis b { display: block; font-size: 20px; } .pf-kpis span { font-size: 12px; color: #64748b; }
    .pf h3 { margin: 14px 0 6px; font-size: 15px; }
    .pf-list { list-style: none; margin: 0; padding: 0; font-size: 13.5px; }
    .pf-list li { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid #e2e8f0; }
    .pf-list li span { flex: 1; word-break: break-word; }
    .menu { position: absolute; top: calc(100% + 8px); ${corner}: 0; width: 280px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; box-shadow: 0 12px 32px rgba(15,23,42,.18); text-align: center; z-index: 5; color: #0f172a; }
    .menu .nm { font-size: 17px; font-weight: 700; margin-top: 10px; word-break: break-word; }
    .menu .meta { color: #64748b; font-size: 13.5px; margin-top: 4px; }
    .menu .phone { direction: ltr; unicode-bidi: embed; }
    .row { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .btn { border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a; border-radius: 10px; padding: 9px 12px; }
    .btn:hover { background: #f1f5f9; }
    .btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 700; }
    .btn.primary:hover { background: #1d4ed8; }
    .btn.danger { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
    .btn[disabled] { opacity: .6; cursor: default; }
    .overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 2147483001; direction: rtl; overflow-y: auto; }
    .card { background: #fff; color: #0f172a; border-radius: 18px; width: 100%; max-width: 380px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,.3); margin: auto; }
    .card h2 { margin: 0 0 6px; font-size: 20px; }
    .card p { margin: 0 0 16px; color: #64748b; font-size: 14px; line-height: 1.6; }
    .note { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; border-radius: 10px; padding: 9px 12px; font-size: 13.5px; margin-bottom: 14px; line-height: 1.6; }
    label { display: block; font-size: 13.5px; font-weight: 700; margin: 12px 0 6px; }
    input, select { width: 100%; font: inherit; padding: 11px 12px; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; color: #0f172a; }
    input:focus, select:focus { outline: 2px solid #93c5fd; border-color: #2563eb; }
    input.ltr { direction: ltr; text-align: left; }
    input.code { direction: ltr; text-align: center; letter-spacing: 8px; font-size: 22px; font-weight: 700; }
    .err { color: #b91c1c; font-size: 13.5px; min-height: 20px; margin-top: 10px; }
    .link { background: none; border: 0; color: #2563eb; padding: 6px 0; font-size: 13.5px; }
    .link[disabled] { color: #94a3b8; cursor: default; }
    .between { display: flex; justify-content: space-between; margin-top: 8px; }
    .hint { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 10px; font-size: 13px; margin-top: 10px; direction: ltr; text-align: center; }
    input[type=file] { display: none; }
    /* على الشاشات الضيقة (هيدر الموبايل): أيقونة بس */
    @media (max-width: 900px) {
      .slot .login-btn { padding: 0; width: 42px; height: 42px; justify-content: center; }
      .slot .login-btn svg { display: block; }
      .slot .login-btn .t { display: none; }
      .slot .chip { padding: 3px; max-width: none; }
      .slot .chip span.nm { display: none; }
      .slot .menu { ${corner === 'left' ? 'left: auto; right: 0;' : ''} }
    }
  `;

  // ---------- الحالة ----------
  let user = null;
  let menuOpen = false;
  let editing = false;
  let modal = null; // { step: 'phone'|'code'|'profile', phone, signupToken, devCode, note }
  let timer = null;
  let available = null; // null = لسا بنفحص، true = السيرفر شغّال، false = السيرفر مش متاح
  let readyResolve;
  const ready = new Promise((r) => (readyResolve = r));

  // مكان الزر: داخل عنصر بالهيدر إذا موجود، وإلا بيطفو بالزاوية
  const slotEl = MOUNT ? document.querySelector(MOUNT) : null;
  const barHost = document.createElement('div');
  barHost.id = 'student-account-root';
  const barRoot = barHost.attachShadow({ mode: 'open' });
  // النوافذ دايماً على body (الهيدر عنده backdrop-filter وبيكسر position:fixed للأبناء)
  const modalHost = document.createElement('div');
  modalHost.id = 'student-account-modal';
  const modalRoot = modalHost.attachShadow({ mode: 'open' });
  const mount = () => {
    (slotEl || document.body).appendChild(barHost);
    document.body.appendChild(modalHost);
  };
  document.body ? mount() : document.addEventListener('DOMContentLoaded', mount);

  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const initial = (n) => (String(n).trim()[0] || '?').toUpperCase();
  const avatar = (u, big) => (u.photo ? `<img class="av${big ? ' big' : ''}" src="${esc(API + u.photo)}" alt="">` : `<span class="av${big ? ' big' : ''}">${esc(initial(u.name))}</span>`);
  const USER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';

  function modalHtml() {
    const note = modal.note ? `<div class="note">${esc(modal.note)}</div>` : '';
    if (modal.step === 'phone')
      return `<div class="overlay" data-act="overlay"><form class="card" data-form="phone" novalidate>
        <h2>تسجيل الدخول</h2><p>اكتب رقم هاتفك وبنبعتلك رمز تحقق على واتساب.</p>${note}
        <label for="phone">رقم الهاتف</label>
        <input id="phone" name="phone" class="ltr" type="tel" inputmode="tel" autocomplete="tel" placeholder="07XXXXXXXX" required>
        <div class="err"></div>
        <div class="row"><button class="btn primary" type="submit">إرسال الرمز عبر واتساب</button><button class="btn" type="button" data-act="close">إلغاء</button></div>
      </form></div>`;
    if (modal.step === 'code')
      return `<div class="overlay" data-act="overlay"><form class="card" data-form="code" novalidate>
        <h2>أدخل الرمز</h2><p>بعتنا رمز من 6 أرقام على واتساب للرقم <span dir="ltr">+${esc(modal.phone)}</span></p>
        <input name="code" class="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" required>
        ${modal.devCode ? `<div class="hint">وضع تجريبي — الرمز: ${esc(modal.devCode)}</div>` : ''}
        <div class="err"></div>
        <div class="row"><button class="btn primary" type="submit">تأكيد</button></div>
        <div class="between"><button class="link" type="button" data-act="resend" disabled>إعادة الإرسال</button><button class="link" type="button" data-act="changePhone">تغيير الرقم</button></div>
      </form></div>`;
    if (modal.step === 'myprofile') return profileHtml();
    if (modal.step === 'newphone')
      return `<div class="overlay" data-act="overlay"><form class="card" data-form="newphone" novalidate>
        <h2>تغيير رقم الهاتف</h2><p>اكتب الرقم الجديد وبنبعتله رمز تأكيد على واتساب. حسابك ونتائجك بتضل كما هي.</p>
        <input name="phone" class="ltr" type="tel" inputmode="tel" placeholder="07XXXXXXXX" required>
        <div class="err"></div>
        <div class="row"><button class="btn primary" type="submit">إرسال الرمز</button><button class="btn" type="button" data-act="close">إلغاء</button></div>
      </form></div>`;
    if (modal.step === 'newphonecode')
      return `<div class="overlay" data-act="overlay"><form class="card" data-form="newphonecode" novalidate>
        <h2>أدخل الرمز</h2><p>بعتنا رمز على واتساب للرقم <span dir="ltr">+${esc(modal.phone)}</span></p>
        <input name="code" class="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" required>
        ${modal.devCode ? `<div class="hint">وضع تجريبي — الرمز: ${esc(modal.devCode)}</div>` : ''}
        <div class="err"></div>
        <div class="row"><button class="btn primary" type="submit">تأكيد</button><button class="btn" type="button" data-act="close">إلغاء</button></div>
      </form></div>`;
    return `<div class="overlay"><form class="card" data-form="profile" novalidate>
        <h2>حساب جديد</h2><p>خطوة أخيرة: اكتب اسمك الكامل واختر ${TRACKS ? 'جيلك وفرعك' : 'صفك'}.</p>
        <label for="name">الاسم الكامل</label><input id="name" name="name" maxlength="50" autocomplete="name" required>
        <label for="level">${levelLabel}</label><select id="level" name="level" required>${levelOptions(null)}</select>
        <div class="err"></div>
        <div class="row"><button class="btn primary" type="submit">إنشاء الحساب</button></div>
      </form></div>`;
  }

  const fmtD = (ms) => { try { return new Date(ms).toLocaleDateString('ar-JO-u-nu-latn'); } catch { return ''; } };
  function profileHtml() {
    const d = modal.data;
    const body = !d
      ? `<p>${modal.error ? esc(modal.error) : 'جاري التحميل…'}</p>`
      : `<div class="pf-top">${avatar(user, true)}<div><div class="nm">${esc(user.name)}</div><div class="meta">${esc(levelText(user))}</div><div class="meta phone">+${esc(user.phone)}</div></div></div>
         <div class="pf-kpis">
           <div><b>${d.stats.average == null ? '—' : esc(d.stats.average) + '%'}</b><span>معدلي العام</span></div>
           <div><b>${esc(d.stats.examsCount)}</b><span>امتحانات</span></div>
           <div><b>${esc(d.stats.filesCount)}</b><span>ملفات</span></div>
         </div>
         ${d.stats.inHonor ? '<div class="hint" style="background:#fef3c7;color:#92400e">🏅 أنت في لوحة الشرف</div>' : d.stats.average != null ? `<div class="hint">لوحة الشرف لمعدل ${esc(d.stats.honorMin)}% فأكثر</div>` : ''}
         <h3>امتحاناتي</h3>
         ${d.exams.length ? '<ul class="pf-list">' + d.exams.map((e) => `<li><span>${esc(e.name)}</span><b dir="ltr">${esc(e.score)}/${esc(e.max)} (${esc(e.percent)}%)</b></li>`).join('') + '</ul>' : '<p class="meta">ما قدّمت أي امتحان بعد.</p>'}
         <h3>ملفاتي</h3>
         ${d.files.length ? '<ul class="pf-list">' + d.files.map((f) => `<li><span>${esc(f.file)}</span><b>${esc(f.downloads)} تحميل</b></li>`).join('') + '</ul>' : '<p class="meta">ما فتحت أي ملف بعد.</p>'}`;
    return `<div class="overlay" data-act="overlay"><div class="card pf" role="dialog" aria-label="ملفي">${body}<div class="row" style="margin-top:14px"><button class="btn" type="button" data-act="close">إغلاق</button></div></div></div>`;
  }

  function menuHtml() {
    if (editing)
      return `<div class="menu"><form data-form="edit" novalidate>
        <label for="name" style="margin-top:0;text-align:right">الاسم</label><input id="name" name="name" maxlength="50" value="${esc(user.name)}" required>
        <label for="level" style="text-align:right">${levelLabel}</label><select id="level" name="level">${levelOptions(user)}</select>
        <div class="err"></div>
        <div class="row"><button class="btn primary" type="submit">حفظ</button><button class="btn" type="button" data-act="cancelEdit">إلغاء</button></div>
      </form></div>`;
    return `<div class="menu">
      ${avatar(user, true)}
      <div class="nm">${esc(user.name)}</div>
      <div class="meta">${esc(levelText(user))}</div>
      <div class="meta phone">+${esc(user.phone)}</div>
      <div class="err"></div>
      <div class="row">
        <label class="btn" style="margin:0;font-weight:400;cursor:pointer">${user.photo ? 'تغيير الصورة' : 'إضافة صورة'}<input type="file" accept="image/*"></label>
        ${user.photo ? '<button class="btn" data-act="removePhoto">حذف الصورة</button>' : ''}
        <button class="btn primary" data-act="openProfile">ملفي ونتائجي</button>
        <button class="btn" data-act="edit">تعديل الاسم والجيل</button>
        <button class="btn" data-act="changeMyPhone">تغيير رقم الهاتف</button>
        <button class="btn danger" data-act="logout">تسجيل الخروج</button>
      </div></div>`;
  }

  function render() {
    // إذا السيرفر مش متاح بنخفي الزر بدل ما نعرض زر ما بيشتغل (الموقع بيرجع لنموذج الدخول القديم)
    const bar = !available && !user
      ? ''
      : user
        ? `<button class="chip" data-act="toggleMenu" aria-label="حسابي"><span class="nm">${esc(user.name)}</span>${avatar(user)}</button>${menuOpen ? menuHtml() : ''}`
        : `<button class="login-btn" data-act="openLogin" aria-label="تسجيل الدخول">${USER_ICON}<span class="t">تسجيل الدخول</span></button>`;
    barRoot.innerHTML = `<style>${CSS}</style><div class="wrap ${slotEl ? 'slot' : 'float'}">${bar}</div>`;
    modalRoot.innerHTML = `<style>${CSS}</style>${modal ? modalHtml() : ''}`;
    if (modal?.step === 'code') startCountdown(modal.countdown ?? 60);
    const first = modalRoot.querySelector('.card input, .card select');
    if (first) setTimeout(() => first.focus(), 30);
  }

  function startCountdown(sec) {
    clearInterval(timer);
    let left = sec;
    const tick = () => {
      const b = modalRoot.querySelector('[data-act=resend]');
      if (!b) return clearInterval(timer);
      modal.countdown = left;
      b.disabled = left > 0;
      b.textContent = left > 0 ? `إعادة الإرسال بعد ${left} ثانية` : 'إعادة الإرسال';
      if (left-- <= 0) clearInterval(timer);
    };
    tick();
    timer = setInterval(tick, 1000);
  }

  const showErr = (msg, where) => {
    const e = (where || (modal ? modalRoot : barRoot)).querySelector('.err');
    if (e) e.textContent = msg || '';
  };
  const busy = (form, on) => form.querySelectorAll('button').forEach((b) => (b.disabled = on));

  function setUser(u, evt) {
    user = u;
    modal = null;
    menuOpen = false;
    editing = false;
    clearInterval(timer);
    render();
    if (evt) emit(evt, u);
  }

  async function sendCode() {
    const d = await call('POST', '/api/auth/request-code', { phone: modal.phone });
    modal = { step: 'code', phone: d.phone, devCode: d.devCode, countdown: 60, note: modal.note };
    render();
  }

  const forms = {
    async newphone(f) {
      showErr('');
      try {
        const phone = f.elements.phone.value.trim();
        const d = await call('POST', '/api/me/phone/request-code', { phone });
        modal = { step: 'newphonecode', phone: d.phone, devCode: d.devCode };
        render();
      } catch (e) { showErr(e.message); }
    },
    async newphonecode(f) {
      showErr('');
      try {
        const d = await call('POST', '/api/me/phone/verify', { phone: modal.phone, code: f.elements.code.value.trim() });
        user = d.user; modal = null; render(); emit('student:update', user);
      } catch (e) { showErr(e.message); }
    },
    async phone(f) {
      const phone = f.phone.value.trim();
      if (!phone) return showErr('اكتب رقم الهاتف');
      busy(f, true);
      showErr('');
      try {
        modal.phone = phone;
        await sendCode();
      } catch (e) {
        showErr(e.message);
        busy(f, false);
      }
    },
    async code(f) {
      const code = f.code.value.trim();
      if (!code) return showErr('اكتب الرمز');
      busy(f, true);
      showErr('');
      try {
        const d = await call('POST', '/api/auth/verify-code', { phone: modal.phone, code });
        if (d.needsProfile) {
          modal = { step: 'profile', phone: modal.phone, signupToken: d.signupToken };
          render();
        } else {
          keepToken(d);
          setUser(d.user, 'student:login');
        }
      } catch (e) {
        showErr(e.message);
        busy(f, false);
      }
    },
    async profile(f) {
      const lv = levelPayload(f.level.value);
      if (!lv) return showErr(TRACKS ? 'اختر الجيل والفرع' : 'اختر الصف');
      busy(f, true);
      showErr('');
      try {
        const d = await call('POST', '/api/auth/register', { signupToken: modal.signupToken, name: f.name.value, ...lv });
        keepToken(d);
        setUser(d.user, 'student:login');
      } catch (e) {
        showErr(e.message);
        busy(f, false);
      }
    },
    async edit(f) {
      busy(f, true);
      showErr('');
      try {
        const body = { name: f.name.value };
        const lv = levelPayload(f.level.value);
        if (lv) Object.assign(body, lv);
        const d = await call('PATCH', '/api/me', body);
        user = d.user;
        editing = false;
        render();
        emit('student:update', user);
      } catch (e) {
        showErr(e.message);
        busy(f, false);
      }
    },
  };

  function closeModal(silent) {
    const was = !!modal;
    modal = null;
    clearInterval(timer);
    render();
    if (was && !silent) emit('student:loginclose');
  }

  const acts = {
    openLogin() { openLogin(); },
    close() { closeModal(); },
    overlay(el, e) { if (e.target === el) closeModal(); },
    changePhone() { modal = { step: 'phone', note: modal?.note }; render(); },
    async resend(el) {
      el.disabled = true;
      try { await sendCode(); } catch (e) { showErr(e.message); startCountdown(10); }
    },
    async openProfile() {
      menuOpen = false;
      modal = { step: 'myprofile', data: null };
      render();
      try { const d = await call('GET', '/api/me/summary'); if (modal && modal.step === 'myprofile') { modal.data = d; user = d.user || user; render(); } }
      catch (e) { if (modal && modal.step === 'myprofile') { modal.error = e.message; render(); } }
    },
    changeMyPhone() { menuOpen = false; modal = { step: 'newphone' }; render(); },
    toggleMenu() { menuOpen = !menuOpen; editing = false; render(); },
    edit() { editing = true; render(); },
    cancelEdit() { editing = false; render(); },
    async removePhoto() {
      try { user = (await call('DELETE', '/api/me/photo')).user; render(); } catch (e) { showErr(e.message); }
    },
    async logout() {
      try { await call('POST', '/api/auth/logout'); } catch {}
      tokenClear();
      const old = user;
      setUser(null);
      emit('student:logout', old);
    },
  };

  function openLogin(note) {
    if (user) return;
    menuOpen = false;
    modal = { step: 'phone', note: typeof note === 'string' ? note : '' };
    render();
  }

  async function uploadPhoto(file) {
    if (!file) return;
    showErr('');
    try {
      const blob = await squareJpeg(file);
      user = (await call('PUT', '/api/me/photo', undefined, blob)).user;
      menuOpen = true;
      render();
      emit('student:update', user);
    } catch (e) {
      showErr(e.message);
    }
  }

  for (const root of [barRoot, modalRoot]) {
    root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-act]');
      if (el && acts[el.dataset.act]) acts[el.dataset.act](el, e);
    });
    root.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target.closest('form[data-form]');
      if (f && forms[f.dataset.form]) forms[f.dataset.form](f);
    });
    root.addEventListener('change', (e) => {
      if (e.target.matches('input[type=file]')) uploadPhoto(e.target.files[0]);
    });
  }
  document.addEventListener('click', (e) => {
    if (menuOpen && !e.composedPath().includes(barHost)) {
      menuOpen = false;
      editing = false;
      render();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal) closeModal();
  });

  // ---------- تتبع النشاط ----------
  // أي خطأ هون بيتجاهل بصمت: التتبع ما لازم يعطّل الموقع أبداً.
  const fire = (url, body) => {
    if (!user) return;
    call('POST', url, body, undefined, { keepalive: true }).catch(() => {});
  };
  function track(type, d = {}) {
    if (!user) return;
    fire('/api/me/track', { type, ref: d.ref, label: d.label, score: d.score, max: d.max, answers: d.answers });
  }

  const DL_EXT = /\.(pdf|docx?|pptx?|xlsx?|zip|rar|7z)$/i;
  document.addEventListener(
    'click',
    (e) => {
      try {
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a || !user) return;
        const u = new URL(a.getAttribute('href'), location.href);
        const file = decodeURIComponent(u.pathname.split('/').pop() || '');
        const flagged = a.hasAttribute('download') || a.dataset.track === 'download';
        if (!flagged && !DL_EXT.test(u.pathname)) return;
        const label = (a.dataset.trackLabel || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100);
        track('download', { ref: file || u.hostname, label });
      } catch {}
    },
    true,
  );

  let lastInput = Date.now();
  let beatTimer = null;
  const touch = () => { lastInput = Date.now(); };
  ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'].forEach((ev) => window.addEventListener(ev, touch, { passive: true, capture: true }));
  const beat = () => {
    if (!user || document.visibilityState !== 'visible' || Date.now() - lastInput > 60000) return;
    fire('/api/me/ping', {});
  };
  function startTracking() {
    if (!beatTimer) beatTimer = setInterval(beat, 30000);
    try {
      const key = 'sa_pv:' + location.pathname;
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last > 20 * 60000) {
        sessionStorage.setItem(key, String(Date.now()));
        track('page', { ref: location.pathname, label: document.title });
      }
    } catch {
      track('page', { ref: location.pathname, label: document.title });
    }
    beat();
  }
  function stopTracking() {
    clearInterval(beatTimer);
    beatTimer = null;
  }
  window.addEventListener('student:login', startTracking);
  window.addEventListener('student:restore', startTracking);
  window.addEventListener('student:logout', stopTracking);

  window.StudentAccount = {
    getUser: () => user,
    track,
    call,   // للموقع: طلبات موثّقة للسيرفر (امتحانات، ملفات، تواصل)
    openLogin,
    logout: acts.logout,
    // تصفير محلي (بيستخدمه الموقع لما الأستاذ يلغي الحساب من الشيت): بيمسح التوكن وبيرجّع الزر لـ"تسجيل الدخول"
    reset() {
      call('POST', '/api/auth/logout').catch(() => {});
      tokenClear();
      user = null;
      menuOpen = false;
      editing = false;
      modal = null;
      render();
    },
    get available() { return available; },
    ready,
  };

  // ---------- الفحص الأول (هل في جلسة محفوظة؟) ----------
  let firstCheck = true;
  async function check() {
    try {
      const d = await call('GET', '/api/me');
      available = true;
      user = d.user;
      if (!user) tokenClear();
      render();
      if (firstCheck) {
        firstCheck = false;
        readyResolve(true);
      }
      emit('student:ready', { user, available: true });
      if (user) emit('student:restore', user);
    } catch (e) {
      // السيرفر مش متاح: بنكمّل بدون حسابات، وبنعيد المحاولة بالخلفية
      available = false;
      render();
      if (firstCheck) {
        firstCheck = false;
        readyResolve(false);
      }
      emit('student:ready', { user: null, available: false });
      setTimeout(check, 45000);
    }
  }
  render();
  check();
})();
