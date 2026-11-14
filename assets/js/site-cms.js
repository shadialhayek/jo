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
    // رسالة «المحتوى قريبًا» بتنخفي أول ما ينضاف عنصر للقائمة
    $all('#view-question-bank .item-card-list > p').forEach(function(p){ p.style.display = ''; });
    if (!r) return;
    var hide = {}; (r.hideTitles || []).forEach(function(t){ hide[t] = true; });
    $all('.item-card').forEach(function(c){
      var h3 = c.querySelector('h3');
      if (h3 && hide[h3.textContent.trim()]) c.style.display = 'none';
    });
    (r.items || []).slice().reverse().forEach(function(it){
      if (it.hidden) return;
      var root = it.kind === 'lesson' ? '#view-lessons' : it.kind === 'qbank' ? '#view-question-bank' : '#view-eschool';
      var list = document.querySelector(root + ' .gen-panel[data-gen="' + it.gen + '"] .item-card-list');
      var url = safeUrl(it.url);
      if (!list || !url) return;
      var card = el('div', 'item-card'); card.setAttribute('data-cms', it.id || '1');
      var body = el('div', 'item-card-body');
      body.appendChild(el('span', 'item-card-badge', it.badge || ''));
      body.appendChild(el('h3', '', it.title));
      if (it.desc) body.appendChild(el('p', '', it.desc));
      var pages = [];
      if (it.kind !== 'lesson'){ [it.preview].concat(it.pages || []).forEach(function(x){ var u = imgSrc(x); if (u) pages.push(u); }); }
      var prev = pages[0] || '';
      var isImgOnly = /\.(jpe?g|png|webp)(\?|$)/i.test(url);
      var wid = 'cms' + String(it.id || '').replace(/[^a-z0-9]/gi, '');
      if (prev && wid.length > 3){
        // ورقة بصورة + PDF: «عرض الملف» بيفتح الصورة بالمعاينة، و«تحميل» بينزّل الـPDF (نفس أوراق العمل الأصلية)
        var fname = (it.title || 'file') + (isImgOnly ? (url.match(/\.(jpe?g|png|webp)/i) || ['.jpg'])[0] : '.pdf');
        var pdf = url;
        if (/\/files\/[A-Za-z0-9._-]+$/.test(url)) pdf = url + '?dl=1&n=' + encodeURIComponent(fname);
        var js = document.createElement('script'); js.type = 'application/json'; js.id = 'wsdata-' + wid; js.setAttribute('data-cms', it.id || '1');
        js.textContent = JSON.stringify({ name: it.title, file: fname, pdf: pdf, pages: pages });
        document.body.appendChild(js);
        var btns = el('div', 'item-card-btns');
        var vb = el('button', 'item-card-btn alt', 'عرض الملف'); vb.type = 'button'; vb.setAttribute('onclick', "wsView('" + wid + "')");
        var db;
        if (isImgOnly){
          // ملف صور بدون PDF: التحميل بينزّل الصورة نفسها
          db = el('a', 'item-card-btn', 'تحميل ⬇'); db.href = pdf; db.setAttribute('download', fname); db.rel = 'noopener';
        } else {
          db = el('button', 'item-card-btn', 'تحميل ⬇'); db.type = 'button'; db.setAttribute('onclick', "wsDownload('" + wid + "')");
        }
        btns.appendChild(vb); btns.appendChild(db);
        card.appendChild(body); card.appendChild(btns);
      } else {
        var a = el('a', 'item-card-btn', it.kind === 'lesson' ? 'شاهد الحصة ›' : 'افتح الملف ›');
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        card.appendChild(body); card.appendChild(a);
      }
      list.insertBefore(card, list.firstChild);
      $all(':scope > p', list).forEach(function(p){ p.style.display = 'none'; });
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


  // ---------- معرض الصور ----------
  function applyGallery(list){
    if (!Array.isArray(list)) return;
    var track = document.getElementById('carTrack'); if (!track) return;
    var shown = list.filter(function(g){ return g && g.show !== false && imgSrc(g.img); });
    if (!shown.length) return;
    track.textContent = '';
    shown.forEach(function(g, i){
      var sl = el('div', 'slide photo');
      var im = el('img'); im.src = imgSrc(g.img); im.alt = g.caption || ('صورة ' + (i + 1) + ' من لحظات الأستاذ شادي الحايك مع الطلاب'); im.decoding = 'async';
      if (i > 0) im.loading = 'lazy';
      sl.appendChild(im);
      if (g.caption){
        var cap = el('div', '', g.caption);
        cap.style.cssText = 'position:absolute;inset-inline:0;bottom:0;padding:34px 16px 14px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff;font-weight:700;text-align:center;font-size:1rem';
        sl.style.position = 'relative'; sl.appendChild(cap);
      }
      track.appendChild(sl);
    });
    if (typeof window.__initCarousel === 'function') window.__initCarousel();
  }

  // ---------- آراء الطلاب ----------
  function applyTestimonials(list){
    if (!Array.isArray(list)) return;
    var grid = document.querySelector('.testi-grid'); if (!grid) return;
    var shown = list.filter(function(t){ return t && t.show !== false && (t.text || imgSrc(t.img)); });
    grid.textContent = '';
    if (!shown.length){ var e = el('p', '', 'ترقّبوا آراء الطلاب قريبًا'); e.style.cssText = 'grid-column:1/-1;text-align:center;opacity:.7;font-weight:700;padding:30px 0'; grid.appendChild(e); return; }
    shown.forEach(function(t){
      var item = el('div', 't-item');
      var n = Math.max(0, Math.min(5, +t.stars || 0));
      if (n){ var st = el('div', 'stars', new Array(n + 1).join('★')); item.appendChild(st); }
      var src = imgSrc(t.img);
      if (src){
        var im = el('img'); im.src = src; im.alt = t.name || 'رأي طالب'; im.loading = 'lazy'; im.decoding = 'async';
        im.style.cssText = 'width:100%;border-radius:12px;display:block;margin:0 0 14px;background:#0003';
        item.appendChild(im);
      }
      if (t.text) item.appendChild(el('p', 'quote', '"' + t.text + '"'));
      var who = el('div', 't-who');
      var name = t.name || 'طالب من طلاب الأستاذ شادي';
      who.appendChild(el('div', 't-avatar', Array.from(name.replace(/^(الطالب|الطالبة|طالب|طالبة)\s+/, ''))[0] || 'ط'));
      var box = el('div'); box.appendChild(el('b', '', name)); box.appendChild(el('span', '', t.role || 'رأي طالب'));
      who.appendChild(box); item.appendChild(who);
      grid.appendChild(item);
    });
  }

  // ---------- امتحانات أنشأها الأستاذ من الداشبورد ----------
  // بتتسجّل بنفس محرك الامتحانات الأصلي (EXAMS)، فكل شي بيشتغل زي الباقي: محاولة وحدة، علامة بحساب الطالب، لوحة الشرف، PDF.
  var CX_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];
  var cxSig = {}, cxTimer = null, cxRetries = 0;
  // نص رياضي: x^2 → أُس، والأجزاء اللاتينية/الأرقام بتنعرض يسار-يمين
  function plainMath(parent, text){
    var re = /([A-Za-z0-9π°√∞][A-Za-z0-9π°√∞+\-−×÷=<>≤≥|().,\/^_ ]*[A-Za-z0-9π°√∞)|°])|[A-Za-z0-9π°√∞]/g, last = 0, m;
    text = String(text || '');
    function plain(t){ if (t) parent.appendChild(document.createTextNode(t)); }
    while ((m = re.exec(text))){
      plain(text.slice(last, m.index));
      var b = document.createElement('bdi'); b.setAttribute('dir', 'ltr');
      var parts = m[0].split(/\^(\([^)]*\)|-?[A-Za-z0-9]+)/);
      parts.forEach(function(seg, i){
        if (i % 2){ var sp = document.createElement('sup'); sp.textContent = seg.replace(/^\(|\)$/g, ''); b.appendChild(sp); }
        else if (seg) b.appendChild(document.createTextNode(seg));
      });
      parent.appendChild(b);
      last = m.index + m[0].length;
    }
    plain(text.slice(last));
  }
  // معادلات LaTeX بين $...$ (من محرر الداشبورد) بتنرسم بمكتبة KaTeX، وبتنحمّل أول ما تلزم
  var katexQ = null;
  function withKatex(fn){
    if (window.katex) return fn();
    if (!katexQ){
      katexQ = [];
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'; document.head.appendChild(l);
      var sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'; sc.async = true;
      sc.onload = function(){ var q = katexQ; katexQ = []; q.forEach(function(f){ try { f(); } catch(e){} }); };
      document.head.appendChild(sc);
    }
    katexQ.push(fn);
  }
  function texNode(parent, tex, display){
    var sp = document.createElement('span'); sp.className = 'qx-tex'; sp.setAttribute('dir', 'ltr');
    sp.textContent = '$' + tex + '$';          // احتياط لو تأخرت المكتبة
    parent.appendChild(sp);
    withKatex(function(){ window.katex.render(tex, sp, { throwOnError: false, displayMode: !!display }); });
  }
  function mathNodes(parent, text){
    text = String(text || '');
    if (text.indexOf('$') < 0) return plainMath(parent, text);
    var re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g, last = 0, m;
    while ((m = re.exec(text))){
      plainMath(parent, text.slice(last, m.index));
      texNode(parent, m[1] || m[2], !!m[1]);
      last = m.index + m[0].length;
    }
    plainMath(parent, text.slice(last));
  }
  window.cxMathNodes = mathNodes;
  function cxBuild(it){
    var id = it.id, qs = it.questions || [], n = qs.length || it.n || 0;
    // كرت الامتحان
    var list = document.querySelector('#view-exams .gen-panel[data-gen="' + it.gen + '"] .item-card-list');
    if (list){
      var card = el('div', 'item-card'); card.setAttribute('data-exam', id); card.setAttribute('data-cx', '1');
      if (it.opens) card.setAttribute('data-opens', it.opens);
      var body = el('div', 'item-card-body');
      body.appendChild(el('span', 'item-card-badge', it.badge || 'امتحان إلكتروني'));
      body.appendChild(el('h3', '', it.title));
      body.appendChild(el('p', '', it.desc || (n + ' ' + (n === 1 ? 'سؤال' : n <= 10 ? 'أسئلة' : 'سؤال') + ' اختيار من متعدد — العلامة من ' + n)));
      var cd = el('div', 'exam-cd'); cd.hidden = true;
      cd.appendChild(el('div', 'exam-cd-when', it.opens ? whenText(it.opens) : ''));
      var boxes = el('div', 'exam-cd-boxes'); boxes.setAttribute('aria-live', 'off');
      [['d', 'يوم', '0'], ['h', 'ساعة', '00'], ['m', 'دقيقة', '00'], ['s', 'ثانية', '00']].forEach(function(u){
        var sp = el('span'); var b = el('b', '', u[2]); b.setAttribute('data-u', u[0]); sp.appendChild(b); sp.appendChild(el('small', '', u[1])); boxes.appendChild(sp);
      });
      cd.appendChild(boxes); body.appendChild(cd);
      var a = el('a', 'item-card-btn', 'ابدأ الامتحان ›'); a.href = '#'; a.setAttribute('onclick', "exOpen('" + id + "'); return false;");
      card.appendChild(body); card.appendChild(a);
      list.insertBefore(card, list.firstChild);
    }
    // نافذة الامتحان
    var d = el('div', 'qx'); d.id = 'ex-' + id; d.setAttribute('data-nosnippet', ''); d.setAttribute('data-cx', '1');
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', it.title); d.hidden = true;
    var wrap = el('div', 'qx-wrap'); d.appendChild(wrap);
    var top = el('div', 'qx-top'); top.appendChild(el('h2', '', it.title));
    var tb = el('div'); tb.style.cssText = 'display:flex;gap:8px';
    var b1 = el('button', 'qx-close', '🔗 نسخ الرابط'); b1.type = 'button'; b1.setAttribute('onclick', 'copyPageLink()');
    var b2 = el('button', 'qx-close', 'إغلاق ✕'); b2.type = 'button'; b2.setAttribute('onclick', "exClose('" + id + "')");
    tb.appendChild(b1); tb.appendChild(b2); top.appendChild(tb); wrap.appendChild(top);
    var eb = el('div', 'ex-body');
    eb.appendChild(el('p', 'qx-hint', 'اختر رمز الإجابة الصحيحة لكل سؤال. لكل سؤال علامة واحدة (المجموع ' + n + ').'));
    var qwrap = el('div', 'ex-questions');
    qs.forEach(function(q, qi){
      var qe = el('div', 'qx-q'); var bb = el('b'); bb.appendChild(el('span', 'qx-n', String(qi + 1))); bb.appendChild(document.createTextNode(' ')); mathNodes(bb, q.text); qe.appendChild(bb);
      var qi_ = imgSrc(q.img);
      if (qi_){ var im = el('img'); im.src = qi_; im.alt = 'صورة السؤال ' + (qi + 1); im.loading = 'lazy'; im.style.cssText = 'display:block;max-width:100%;max-height:340px;margin:10px auto;border-radius:10px;background:#fff'; qe.appendChild(im); }
      var os = el('div', 'qx-opts');
      q.opts.forEach(function(o, oi){
        var btn = el('button', 'qx-opt'); btn.type = 'button'; btn.setAttribute('data-q', String(qi)); btn.setAttribute('data-o', CX_LETTERS[oi]);
        btn.appendChild(el('span', 'qx-l', CX_LETTERS[oi])); var t = el('span', 'qx-t'); mathNodes(t, o); btn.appendChild(t); os.appendChild(btn);
      });
      qe.appendChild(os); qwrap.appendChild(qe);
    });
    eb.appendChild(qwrap);
    eb.appendChild(el('div', 'qx-msg ex-msg'));
    var sub = el('button', 'btn btn-primary qx-submit', 'إنهاء الاختبار وعرض النتيجة'); sub.type = 'button'; sub.setAttribute('onclick', "exSubmit('" + id + "')");
    eb.appendChild(sub); wrap.appendChild(eb);
    var rs = el('div', 'qx-result ex-result'); rs.hidden = true;
    rs.appendChild(el('h2', '', 'انتهى الاختبار'));
    var sc = el('div', 'qx-score'); sc.appendChild(el('span', 'ex-score', '0')); sc.appendChild(el('small', '', ' / ' + n)); rs.appendChild(sc);
    rs.appendChild(el('p', 'ex-note')); rs.appendChild(el('div', 'qx-review ex-review'));
    var cl = el('button', 'btn btn-primary', 'إغلاق'); cl.type = 'button'; cl.setAttribute('onclick', "exClose('" + id + "')"); rs.appendChild(cl);
    wrap.appendChild(rs);
    document.body.appendChild(d);
    // تسجيل بمحرك الامتحانات الأصلي
    // srv: التصحيح عند السيرفر، فما في مفتاح إجابات هون (بيوصل بعد التسليم من /api/me/exam-submit)
    EXAMS[id] = { srv: 1, n: n, key: [], notes: [], sheet: it.title, title: it.title, gen: it.gen, cx: 1, ans: [] };
    d.querySelectorAll('.ex-questions .qx-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        var q = +btn.dataset.q;
        EXAMS[id].ans[q] = btn.dataset.o;
        d.querySelectorAll('.ex-questions .qx-opt[data-q="' + q + '"]').forEach(function(b){ b.classList.toggle('sel', b === btn); });
        d.querySelector('.ex-msg').textContent = '';
      });
    });
  }
  function cxRemove(id){
    $all('.item-card[data-exam="' + id + '"][data-cx]').forEach(function(n){ n.remove(); });
    var d = document.getElementById('ex-' + id); if (d) d.remove();
    try { delete EXAMS[id]; } catch(e){}
  }
  function applyCustomExams(x){
    if (typeof EXAMS === 'undefined' || !document.getElementById('view-exams') || !x) return;
    var items = Array.isArray(x.items) ? x.items : [];
    var keep = {};
    items.forEach(function(it){
      keep[it.id] = true;
      var sig = JSON.stringify(it);
      var d = document.getElementById('ex-' + it.id);
      if (d && cxSig[it.id] === sig) return;
      if (d && !d.hidden) return;              // الطالب جوّا الامتحان: ما منلمسه
      if (d) cxRemove(it.id);
      cxBuild(it); cxSig[it.id] = sig;
    });
    $all('[data-cx].qx').forEach(function(d){ var id = d.id.replace(/^ex-/, ''); if (!keep[id]) { cxRemove(id); delete cxSig[id]; } });
    try { applyExams(lastCms && lastCms.exams); } catch(e){}
    try { if (window.examScheduleTick) window.examScheduleTick(); } catch(e){}
    // امتحان ما حان موعده: السيرفر بعتلنا بدون أسئلة، بنعيد الجلب لما يفتح
    clearTimeout(cxTimer);
    var next = Infinity;
    items.forEach(function(it){ if (it.questions === null && it.opens){ var t = Date.parse(it.opens); if (!isNaN(t)) next = Math.min(next, t); } });
    if (next < Infinity){
      var wait = next - Date.now();
      if (wait > 0) { cxRetries = 0; cxTimer = setTimeout(cxRefresh, Math.min(wait + 1500, 2147000000)); }
      else if (cxRetries < 8) { cxRetries++; cxTimer = setTimeout(cxRefresh, 6000); }
    }
    // رابط مباشر لامتحان #exams/2010/c123…
    try {
      var hm = /^#exams\/(\d{4})\/(c[a-f0-9]{10})$/.exec(location.hash || '');
      if (hm && EXAMS[hm[2]] && document.getElementById('ex-' + hm[2]).hidden && typeof routeFromHash === 'function') routeFromHash();
    } catch(e){}
  }
  function cxRefresh(){
    fetch(API + '/api/site/content?_=' + Date.now()).then(function(r){ return r.json(); }).then(function(c){
      if (!c || !c.ok) return;
      try { localStorage.setItem(CACHE, JSON.stringify(c)); } catch(e){}
      apply(c);
    }).catch(function(){});
  }

  var lastCms = null;

  function apply(c){
    if (!c) return;
    lastCms = c;
    try { applyBanner(c.banner); } catch(e){ console.warn('cms banner', e); }
    try { applyTiles(c.tiles); } catch(e){ console.warn('cms tiles', e); }
    try { applySocial(c.social); } catch(e){ console.warn('cms social', e); }
    try { applyWhatsapp(c.settings); } catch(e){ console.warn('cms wa', e); }
    try { applySchedule(c.schedule); } catch(e){ console.warn('cms schedule', e); }
    try { applyGroups(c.groups); } catch(e){ console.warn('cms groups', e); }
    try { applyResources(c.resources); } catch(e){ console.warn('cms resources', e); }
    try { applyExams(c.exams); } catch(e){ console.warn('cms exams', e); }
    try { applyGallery(c.gallery); } catch(e){ console.warn('cms gallery', e); }
    try { applyTestimonials(c.testimonials); } catch(e){ console.warn('cms testimonials', e); }
    try { applyCustomExams(c.examlist); } catch(e){ console.warn('cms custom exams', e); }
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
