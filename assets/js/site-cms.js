// ===== محتوى الموقع من الداشبورد =====
// بيجيب الإعدادات من السيرفر (إعلان، جدول، جروبات، دروس، أوراق عمل، مواعيد امتحانات، رقم الواتساب)
// وبيطبّقها على الصفحة (ومعهم مربعات الرئيسية وكروت التواصل). لو السيرفر مش متاح بيضل الموقع على محتواه الأصلي (ما بيخرب شي).
(function(){
  var API = (window.StudentAccountConfig && window.StudentAccountConfig.api) || '';
  if (!API) return;
  var CACHE = 'site_cms_v1';
  var OLD_WA = '962788119796';

  function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, text){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safeUrl(u){
    u = String(u || '');
    if (/^\/files\/[A-Za-z0-9._-]+$/.test(u)) return API + u;
    return /^https?:\/\//i.test(u) ? u : '';
  }

  // ---------- إعلان أعلى الموقع ----------
  function applyBanner(b){
    var old = document.getElementById('cmsBanner'); if (old) old.remove();
    if (!b || !b.on || !b.text) return;
    var key = 'cms_banner_closed';
    try { if (localStorage.getItem(key) === b.text) return; } catch(e){}
    var bar = el('div'); bar.id = 'cmsBanner';
    bar.style.cssText = 'background:#0b3d91;color:#fff;padding:10px 44px 10px 16px;text-align:center;font-size:.95rem;line-height:1.6;position:relative;z-index:9999;font-weight:600';
    bar.appendChild(el('span', '', b.text));
    var link = safeUrl(b.link);
    if (link){
      var a = el('a', '', b.linkText || 'التفاصيل'); a.href = link; a.target = '_blank'; a.rel = 'noopener';
      a.style.cssText = 'color:#fff;background:rgba(255,255,255,.2);border-radius:8px;padding:2px 12px;margin-inline-start:10px;text-decoration:none;white-space:nowrap';
      bar.appendChild(a);
    }
    var x = el('button', '', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'إغلاق');
    x.style.cssText = 'position:absolute;inset-inline-end:10px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:1rem;cursor:pointer;padding:6px';
    x.onclick = function(){ bar.remove(); try { localStorage.setItem(key, b.text); } catch(e){} };
    bar.appendChild(x);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // ---------- رقم الواتساب ----------
  function applyWhatsapp(s){
    var n = s && String(s.whatsapp || '').replace(/\D/g, '');
    if (!n || n === OLD_WA) return;
    $all('a[href]').forEach(function(a){
      var h = a.getAttribute('href') || '';
      if (h.indexOf(OLD_WA) > -1 && /wa\.me|whatsapp|tel:/i.test(h)) a.setAttribute('href', h.split(OLD_WA).join(n));
    });
  }

  // ---------- جدول الحصص ----------
  function applySchedule(rows){
    if (!Array.isArray(rows) || !rows.length) return;
    $all('table').forEach(function(t){
      var th = $all('thead th', t).map(function(x){ return x.textContent.trim(); });
      if (th[0] !== 'اليوم' || th.indexOf('الوقت') < 0) return;
      var tb = t.querySelector('tbody'); if (!tb) return;
      tb.textContent = '';
      rows.forEach(function(r){
        var tr = el('tr');
        tr.appendChild(el('td', '', r.day)); tr.appendChild(el('td', '', r.time)); tr.appendChild(el('td', '', r.gen || ''));
        tb.appendChild(tr);
      });
    });
  }

  // ---------- جروبات الواتساب ----------
  function applyGroups(list){
    if (!Array.isArray(list) || !list.length) return;
    var grid = document.querySelector('.groups-grid'); if (!grid) return;
    var cards = $all('.group-card', grid);
    if (!cards.length) return;
    var byGen = {};
    cards.forEach(function(c){ var b = c.querySelector('.gi-badge'); if (b) byGen[b.textContent.trim()] = c; });
    var template = cards[0];
    var used = {};
    list.forEach(function(g){
      var card = byGen[g.gen];
      if (!card){
        card = template.cloneNode(true);
        var b = card.querySelector('.gi-badge'); if (b) b.textContent = g.gen;
        grid.appendChild(card);
      }
      used[g.gen] = true;
      var h4 = card.querySelector('h4'); if (h4 && g.title) h4.textContent = g.title;
      var p = card.querySelector('p'); if (p && g.desc) p.textContent = g.desc;
      var a = card.querySelector('a.group-link'); var url = safeUrl(g.link);
      if (a && url) a.setAttribute('href', url);
      card.style.display = g.show === false ? 'none' : '';
    });
    Object.keys(byGen).forEach(function(k){ if (!used[k]) byGen[k].style.display = 'none'; });
  }

  // ---------- دروس وأوراق عمل وملفات ----------
  function applyResources(r){
    $all('[data-cms]').forEach(function(n){ n.remove(); });
    $all('.item-card').forEach(function(c){ c.style.display = ''; });
    if (!r) return;
    var hide = {}; (r.hideTitles || []).forEach(function(t){ hide[t] = true; });
    $all('.item-card').forEach(function(c){
      var h3 = c.querySelector('h3');
      if (h3 && hide[h3.textContent.trim()]) c.style.display = 'none';
    });
    (r.items || []).slice().reverse().forEach(function(it){
      if (it.hidden) return;
      var root = it.kind === 'lesson' ? '#view-lessons' : '#view-eschool';
      var list = document.querySelector(root + ' .gen-panel[data-gen="' + it.gen + '"] .item-card-list');
      var url = safeUrl(it.url);
      if (!list || !url) return;
      var card = el('div', 'item-card'); card.setAttribute('data-cms', it.id || '1');
      var body = el('div', 'item-card-body');
      body.appendChild(el('span', 'item-card-badge', it.badge || ''));
      body.appendChild(el('h3', '', it.title));
      if (it.desc) body.appendChild(el('p', '', it.desc));
      var prev = it.kind === 'lesson' ? '' : imgSrc(it.preview);
      var wid = 'cms' + String(it.id || '').replace(/[^a-z0-9]/gi, '');
      if (prev && wid.length > 3){
        // ورقة بصورة + PDF: «عرض الملف» بيفتح الصورة بالمعاينة، و«تحميل» بينزّل الـPDF (نفس أوراق العمل الأصلية)
        var fname = (it.title || 'file') + '.pdf';
        var pdf = url;
        if (/\/files\/[A-Za-z0-9._-]+$/.test(url)) pdf = url + '?dl=1&n=' + encodeURIComponent(fname);
        var js = document.createElement('script'); js.type = 'application/json'; js.id = 'wsdata-' + wid; js.setAttribute('data-cms', it.id || '1');
        js.textContent = JSON.stringify({ name: it.title, file: fname, pdf: pdf, pages: [prev] });
        document.body.appendChild(js);
        var btns = el('div', 'item-card-btns');
        var vb = el('button', 'item-card-btn alt', 'عرض الملف'); vb.type = 'button'; vb.setAttribute('onclick', "wsView('" + wid + "')");
        var db = el('button', 'item-card-btn', 'تحميل ⬇'); db.type = 'button'; db.setAttribute('onclick', "wsDownload('" + wid + "')");
        btns.appendChild(vb); btns.appendChild(db);
        card.appendChild(body); card.appendChild(btns);
      } else {
        var a = el('a', 'item-card-btn', it.kind === 'lesson' ? 'شاهد الحصة ›' : 'افتح الملف ›');
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        card.appendChild(body); card.appendChild(a);
      }
      list.insertBefore(card, list.firstChild);
    });
  }

  // ---------- امتحانات: مواعيد الفتح والإخفاء ----------
  function whenText(iso){
    var d = new Date(iso); if (isNaN(d.getTime())) return '';
    var o = { timeZone: 'Asia/Amman' };
    var day = d.toLocaleDateString('ar-JO-u-nu-latn', Object.assign({ weekday: 'long' }, o));
    var p = {}; new Intl.DateTimeFormat('en-GB', Object.assign({ day: '2-digit', month: '2-digit', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }, o)).formatToParts(d).forEach(function(x){ p[x.type] = x.value; });
    var hr = parseInt(p.hour, 10), ap = hr < 12 ? 'صباحًا' : 'مساءً', h12 = hr % 12 || 12;
    return 'يفتح ' + day + ' ' + parseInt(p.day, 10) + '/' + parseInt(p.month, 10) + ' الساعة ' + h12 + ':' + p.minute + ' ' + ap + ' (بتوقيت الأردن)';
  }
  function applyExams(x){
    if (!x) return;
    var opens = x.opens || {}, hidden = x.hidden || [];
    $all('.item-card[data-exam]').forEach(function(c){
      var id = c.getAttribute('data-exam');
      if (opens[id] && c.querySelector('.exam-cd')){
        c.setAttribute('data-opens', opens[id]);
        var w = c.querySelector('.exam-cd-when'); if (w) w.textContent = whenText(opens[id]);
      }
      c.style.display = hidden.indexOf(id) > -1 ? 'none' : '';
    });
  }

  // ---------- مربعات الصفحة الرئيسية ----------
  function imgSrc(p){
    p = String(p || '');
    if (/^\/files\/[A-Za-z0-9._-]+$/.test(p)) return API + p;
    if (/^assets\/img\/[A-Za-z0-9._-]+$/.test(p)) return p;
    return /^https?:\/\//i.test(p) ? p : '';
  }
  function applyTiles(list){
    if (!Array.isArray(list) || !list.length) return;
    var grid = document.querySelector('.home-grid-boxes'); if (!grid) return;
    var nodes = [];
    list.forEach(function(t){
      if (!t || t.show === false) return;
      var node;
      if (t.to === 'url'){
        var u = safeUrl(t.url); if (!u) return;
        node = el('a', 'feat'); node.href = u; node.target = '_blank'; node.rel = 'noopener'; node.style.textDecoration = 'none';
      } else {
        if (!t.view) return;
        node = el('button', 'feat'); node.type = 'button';
        node.addEventListener('click', function(){
          try {
            if (t.view === 'contact') window.goHomeSection('contact'); else window.showView(t.view);
          } catch(e){ console.warn('cms tile', e); }
        });
      }
      if (t.label) node.setAttribute('aria-label', t.label);
      var src = imgSrc(t.img);
      if (src){
        node.className += ' feat-img';
        var im = el('img'); im.src = src; im.alt = t.label || ''; im.loading = 'lazy'; im.decoding = 'async';
        node.appendChild(im);
      } else {
        node.appendChild(el('h4', '', t.label || ''));
      }
      nodes.push(node);
    });
    if (!nodes.length) return;
    grid.textContent = '';
    nodes.forEach(function(n){ grid.appendChild(n); });
  }

  // ---------- كروت التواصل الاجتماعي ----------
  var FOOT_LABELS = { facebook: 'فيسبوك', instagram: 'انستغرام', snapchat: 'سناب شات', youtube: 'يوتيوب', telegram: 'تيليجرام', whatsapp: 'واتساب' };
  function applySocial(list){
    if (!Array.isArray(list) || !list.length) return;
    var grid = document.querySelector('.social-grid'); if (!grid) return;
    var nodes = [];
    list.forEach(function(s){
      if (!s) return;
      var link = safeUrl(s.link);
      var foot = FOOT_LABELS[s.id] && $all('.social-row a').filter(function(a){ return a.getAttribute('aria-label') === FOOT_LABELS[s.id]; })[0];
      if (foot){ if (s.show === false) foot.style.display = 'none'; else { foot.style.display = ''; if (link) foot.setAttribute('href', link); } }
      if (s.show === false || !link) return;
      var a = el('a', 'social-card social-img'); a.href = link; a.target = '_blank'; a.rel = 'noopener';
      if (s.label) a.setAttribute('aria-label', s.label);
      var src = imgSrc(s.img);
      if (src){ var im = el('img'); im.src = src; im.alt = s.label || ''; im.loading = 'lazy'; im.decoding = 'async'; a.appendChild(im); }
      else {
        a.style.cssText = 'display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;font-weight:800;font-size:1.15rem;padding:12px';
        a.appendChild(el('span', '', s.label || ''));
      }
      if (s.cta){ var cta = el('span', 'soc-cta', s.cta); cta.setAttribute('aria-hidden', 'true'); a.appendChild(cta); }
      nodes.push(a);
    });
    if (!nodes.length) return;
    grid.textContent = '';
    nodes.forEach(function(n){ grid.appendChild(n); });
  }

  function apply(c){
    if (!c) return;
    try { applyBanner(c.banner); } catch(e){ console.warn('cms banner', e); }
    try { applyTiles(c.tiles); } catch(e){ console.warn('cms tiles', e); }
    try { applySocial(c.social); } catch(e){ console.warn('cms social', e); }
    try { applyWhatsapp(c.settings); } catch(e){ console.warn('cms wa', e); }
    try { applySchedule(c.schedule); } catch(e){ console.warn('cms schedule', e); }
    try { applyGroups(c.groups); } catch(e){ console.warn('cms groups', e); }
    try { applyResources(c.resources); } catch(e){ console.warn('cms resources', e); }
    try { applyExams(c.exams); } catch(e){ console.warn('cms exams', e); }
  }

  try { var cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); if (cached) apply(cached); } catch(e){}

  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = setTimeout(function(){ if (ctrl) ctrl.abort(); }, 10000);
  fetch(API + '/api/site/content', ctrl ? { signal: ctrl.signal } : {})
    .then(function(r){ return r.json(); })
    .then(function(c){
      clearTimeout(timer);
      if (!c || !c.ok) return;
      try { localStorage.setItem(CACHE, JSON.stringify(c)); } catch(e){}
      apply(c);
    })
    .catch(function(){ clearTimeout(timer); });
})();
