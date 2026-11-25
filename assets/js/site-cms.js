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

  // ---------- الإعلانات (نص / صورة / فيديو، شريط أو نافذة منبثقة، قابل للضغط أو لا، لفئة محددة) ----------
  var adsData = null, adsLegacy = null, popTimer = null, popOpen = false;
  var AD_CSS = '' +
    '#cmsAds{position:relative;z-index:9999}' +
    '.cmsad-bar{position:relative;background:#16213E;color:#F3EFE3;border-bottom:2px solid #FDBA21;text-align:center;font-size:.95rem;line-height:1.7;font-weight:600}' +
    '.cmsad-bar .cmsad-in{padding:10px 46px 10px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}' +
    '.cmsad-bar .cmsad-txt{white-space:pre-line}' +
    '.cmsad-bar img{max-width:100%;max-height:150px;border-radius:8px;display:block}' +
    '.cmsad-pill{display:inline-block;background:#FDBA21;color:#0B1220;border-radius:8px;padding:3px 14px;font-weight:800;text-decoration:none;white-space:nowrap}' +
    '.cmsad-x{position:absolute;inset-inline-end:10px;top:10px;width:32px;height:32px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:1rem;cursor:pointer;line-height:1;z-index:2}' +
    '.cmsad-bar a.cmsad-wrap,.cmsad-box a.cmsad-wrap{display:contents;color:inherit;text-decoration:none}' +
    '.cmsad-pop{position:fixed;inset:0;z-index:950;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.72);backdrop-filter:blur(3px)}' +
    '.cmsad-box{position:relative;background:#0F1B33;color:#F3EFE3;border-top:5px solid #FDBA21;border-radius:10px;width:100%;max-width:520px;max-height:92vh;overflow:auto;box-shadow:0 30px 60px -20px rgba(0,0,0,.6);text-align:center;animation:cmsadIn .3s ease}' +
    '.cmsad-box.img-only{background:transparent;border:0;box-shadow:none;max-width:560px}' +
    '@keyframes cmsadIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}' +
    '.cmsad-box img{width:100%;display:block;border-radius:8px}' +
    '.cmsad-body{padding:22px 22px 24px;display:flex;flex-direction:column;gap:14px;align-items:center}' +
    '.cmsad-body.has-media{padding-top:16px}' +
    '.cmsad-box .cmsad-txt{font-size:1.08rem;font-weight:700;line-height:1.8;white-space:pre-line}' +
    '.cmsad-media{width:100%;aspect-ratio:16/9;border:0;border-radius:8px;background:#000;display:block}' +
    'video.cmsad-media{aspect-ratio:auto;max-height:70vh}';
  function adSig(a){ return [a.type, a.style, a.text, a.img, a.video, a.link, a.clickable ? 1 : 0, a.linkText].join('|'); }
  function adMemKey(a){ return 'cms_ad_' + a.id; }
  function adSeen(a, bar){
    var mode = bar ? 'once' : (a.repeat || 'once');
    try {
      if (mode === 'always') return sessionStorage.getItem(adMemKey(a)) === adSig(a);
      var raw = localStorage.getItem(adMemKey(a)); if (!raw) return false;
      var o = JSON.parse(raw); if (!o || o.sig !== adSig(a)) return false;
      if (mode === 'daily') return Date.now() - (o.t || 0) < 86400000;
      return true;
    } catch(e){ return false; }
  }
  function adMark(a, bar){
    var mode = bar ? 'once' : (a.repeat || 'once');
    try {
      if (mode === 'always') sessionStorage.setItem(adMemKey(a), adSig(a));
      else localStorage.setItem(adMemKey(a), JSON.stringify({ sig: adSig(a), t: Date.now() }));
    } catch(e){}
  }
  function curUser(){
    try { var A = window.StudentAccount; return (A && typeof A.getUser === 'function') ? A.getUser() : null; } catch(e){ return null; }
  }
  var GRADE_YEAR = { 10: '2011', 11: '2010', 12: '2009' };
  function userYear(u){
    var t = String((u && u.track) || '').slice(0, 4);
    return /^\d{4}$/.test(t) ? t : (GRADE_YEAR[u && u.grade] || '');
  }
  function audienceOk(au, u){
    au = au || {};
    if (au.login === 'in' && !u) return false;
    if (au.login === 'out' && u) return false;
    if (au.gens && au.gens.length && (!u || au.gens.indexOf(userYear(u)) < 0)) return false;
    if (au.card && au.card.length){
      var st = (u && u.card) || 'none'; if (!u) return false;
      if (au.card.indexOf(st) < 0) return false;
    }
    if (au.phones && au.phones.length){
      var ph = String((u && u.phone) || '').replace(/\D/g, '').slice(-9);
      if (!ph || !au.phones.some(function(p){ return String(p).slice(-9) === ph; })) return false;
    }
    return true;
  }
  function adLive(a, now){
    if (!a || a.on === false) return false;
    if (a.start && now < a.start) return false;
    if (a.end && now > a.end) return false;
    return true;
  }
  function videoNode(url){
    var u = String(url || ''), m;
    var frame = function(src){
      var f = el('iframe', 'cmsad-media'); f.src = src; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.loading = 'lazy'; f.referrerPolicy = 'strict-origin-when-cross-origin'; f.title = 'فيديو'; return f;
    };
    if ((m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(u))) return frame('https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0');
    if ((m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(u))) return frame('https://player.vimeo.com/video/' + m[1]);
    if (/^https?:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\//i.test(u)) return frame('https://www.facebook.com/plugins/video.php?show_text=false&href=' + encodeURIComponent(u));
    var direct = safeUrl(u);
    if (direct && (/\/files\/[A-Za-z0-9._-]+\.(mp4|webm)$/i.test(direct) || /\.(mp4|webm|ogg)(\?.*)?$/i.test(direct))){
      var v = el('video', 'cmsad-media'); v.controls = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'metadata'; v.src = direct; return v;
    }
    return null;
  }
  function adContent(a, box, isBar){
    var link = a.clickable ? safeUrl(a.link) : '';
    var media = null;
    if (a.type === 'image' && a.img){
      var src = /^assets\//.test(a.img) ? a.img : safeUrl(a.img);
      if (src){ media = el('img'); media.src = src; media.alt = a.text || a.name || 'إعلان'; media.loading = 'lazy'; }
    } else if (a.type === 'video' && a.video){
      media = videoNode(a.video);
    }
    var holder = box;
    // الصورة/النص قابلة للضغط كاملة. الفيديو ما بينلفّ برابط (عشان ما يتعطل التشغيل)، فالرابط بيطلع كزر تحته.
    var wrapAll = link && a.type !== 'video';
    if (wrapAll){
      holder = el('a', 'cmsad-wrap'); holder.href = link; holder.target = '_blank'; holder.rel = 'noopener noreferrer'; box.appendChild(holder);
    }
    if (isBar){
      if (a.text){ holder.appendChild(el('div', 'cmsad-txt', a.text)); }
      if (media) holder.appendChild(media);
    } else {
      if (media) holder.appendChild(media);
      if (a.text){
        var body = el('div', 'cmsad-body' + (media ? ' has-media' : ''));
        body.appendChild(el('div', 'cmsad-txt', a.text));
        holder.appendChild(body);
      }
    }
    if (link){
      var needBtn = a.type === 'video' || !!a.linkText;
      if (needBtn){
        var btn = el(wrapAll ? 'span' : 'a', 'cmsad-pill', a.linkText || 'التفاصيل');
        if (!wrapAll){ btn.href = link; btn.target = '_blank'; btn.rel = 'noopener noreferrer'; }
        if (isBar) holder.appendChild(btn);
        else { var d = holder.querySelector('.cmsad-body'); if (!d){ d = el('div', 'cmsad-body'); holder.appendChild(d); } d.appendChild(btn); }
      }
    }
    return media;
  }
  function closeAdPopup(){
    var p = document.getElementById('cmsAdPop'); if (p) p.remove();
    popOpen = false;
  }
  function openAdPopup(a){
    closeAdPopup();
    popOpen = true;
    var wrap = el('div', 'cmsad-pop'); wrap.id = 'cmsAdPop'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
    var box = el('div', 'cmsad-box' + (a.type === 'image' && !a.text ? ' img-only' : ''));
    var dismiss = function(){ adMark(a, false); closeAdPopup(); };
    adContent(a, box, false);
    if (a.dismissible !== false){
      var x = el('button', 'cmsad-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'إغلاق'); x.onclick = function(e){ e.stopPropagation(); dismiss(); };
      box.appendChild(x);
      wrap.addEventListener('click', function(e){ if (e.target === wrap) dismiss(); });
    } else {
      // إعلان إجباري: بيضل لحد ما ينتهي وقته. بنسجّل الظهور بس عشان ما يتكرر بنفس الجلسة لو الأستاذ اختار «مرة وحدة».
      adMark(a, false);
    }
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  }
  // بنفحص كل ثانية ونص: الموقع مفتوح (بعد الدخول)، سؤال البطاقة مش ظاهر، وما في نافذة إعلان ثانية
  function popupTick(){
    if (popOpen || !adsData) return;
    var sc = document.getElementById('siteContent');
    if (sc && !sc.classList.contains('unlocked')) return;
    var cp = document.getElementById('cardPop'); if (cp && !cp.hidden) return;
    var now = Date.now(), u = curUser();
    var next = null;
    for (var i = 0; i < adsData.length; i++){
      var a = adsData[i];
      if (a.style !== 'popup' && a.type !== 'video') continue;
      if (!adLive(a, now) || !audienceOk(a.audience, u) || adSeen(a, false)) continue;
      var due = a._t0 + (a.delay || 0) * 1000;
      if (now < due) continue;
      next = a; break;
    }
    if (next) openAdPopup(next);
  }
  function applyAds(c){
    if (!document.getElementById('cmsAdsCss')){
      var st = document.createElement('style'); st.id = 'cmsAdsCss'; st.textContent = AD_CSS; document.head.appendChild(st);
    }
    var old = document.getElementById('cmsAds'); if (old) old.remove();
    var items = (c && c.ads && Array.isArray(c.ads.items)) ? c.ads.items.slice() : [];
    // الإعلان القديم (شريط النص): بيظل شغّال لحد ما تحفظ إعلانات من الداشبورد
    var b = c && c.banner;
    if (!items.length && b && b.on && b.text){
      items.push({ id: 'legacy', type: 'text', style: 'bar', text: b.text, link: b.link || '', clickable: !!b.link, linkText: b.linkText || (b.link ? 'التفاصيل' : ''), on: true, dismissible: true, audience: {} });
    }
    var now = Date.now(), u = curUser();
    var prev = {}; (adsData || []).forEach(function(x){ prev[x.id + adSig(x)] = x._t0; });
    adsData = items.map(function(a){ a._t0 = prev[a.id + adSig(a)] || now; return a; });
    // الأشرطة
    var holder = el('div'); holder.id = 'cmsAds';
    adsData.forEach(function(a){
      if (a.style === 'popup' || a.type === 'video') return;
      if (!adLive(a, now) || !audienceOk(a.audience, u) || adSeen(a, true)) return;
      var bar = el('div', 'cmsad-bar'); bar.setAttribute('data-ad', a.id);
      var inn = el('div', 'cmsad-in'); bar.appendChild(inn);
      adContent(a, inn, true);
      if (a.dismissible !== false){
        var x = el('button', 'cmsad-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'إغلاق');
        x.style.top = '50%'; x.style.transform = 'translateY(-50%)'; x.style.width = '28px'; x.style.height = '28px';
        x.onclick = function(){ bar.remove(); adMark(a, true); };
        bar.appendChild(x);
      }
      holder.appendChild(bar);
    });
    if (holder.childNodes.length) document.body.insertBefore(holder, document.body.firstChild);
    // النوافذ المنبثقة
    var cur = document.getElementById('cmsAdPop');
    if (cur){ var stillThere = adsData.some(function(a){ return (a.style === 'popup' || a.type === 'video') && adLive(a, now) && audienceOk(a.audience, u); }); if (!stillThere) closeAdPopup(); }
    clearInterval(popTimer);
    if (adsData.some(function(a){ return a.style === 'popup' || a.type === 'video'; })){ popTimer = setInterval(popupTick, 1500); setTimeout(popupTick, 400); }
  }
  ['student:login', 'student:logout', 'student:restore', 'student:update'].forEach(function(ev){
    window.addEventListener(ev, function(){ setTimeout(function(){ if (lastCms) applyAds(lastCms); }, 50); });
  });

  // ---------- سؤال بطاقة الأستاذ: الإعدادات من الداشبورد (core.js بيقراها وقت العرض) ----------
  function applyCardPopup(cfg){
    if (!cfg || typeof cfg !== 'object') return;
    window.CardPopupConfig = cfg;
    var set = function(sel, txt){ var n = document.querySelector(sel); if (n && txt != null) n.textContent = txt; };
    set('#cardPopTitle', cfg.title);
    set('#cardPopMain .sub', cfg.sub);
    set('#cardPopMain [data-answer="yes"]', cfg.yes);
    set('#cardPopMain [data-answer="no"]', cfg.no);
    set('#cardPopWant h3', cfg.wantTitle);
    set('#cardPopWant .sub', cfg.wantSub);
    set('#cardPopWant [data-answer="want-yes"]', cfg.wantYes);
    set('#cardPopWant [data-answer="want-no"]', cfg.wantNo);
    var ic = document.querySelector('#cardPopMain .card-pop-ic');
    if (ic){
      var im = ic.querySelector('img');
      var src = cfg.img ? (/^assets\//.test(cfg.img) ? cfg.img : safeUrl(cfg.img)) : '';
      if (src){
        if (!im){ im = document.createElement('img'); im.alt = ''; im.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%'; ic.textContent = ''; ic.appendChild(im); }
        im.src = src;
      }
    }
    if (typeof window.cardPopupConfigChanged === 'function') window.cardPopupConfigChanged();
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
    sp.setAttribute('data-tex', tex); if (display) sp.setAttribute('data-display', '1');
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
  window.cxImgSrc = imgSrc;
  function cxBuild(it){
    var id = it.id, qs = it.questions || [], n = qs.length || it.n || 0;
    window.CX_ITEMS = window.CX_ITEMS || {}; window.CX_ITEMS[id] = it;
    // كرت الامتحان
    var list = document.querySelector('#view-exams .gen-panel[data-gen="' + it.gen + '"] .item-card-list');
    if (list){
      var card = el('div', 'item-card'); card.setAttribute('data-exam', id); card.setAttribute('data-cx', '1');
      if (it.opens) card.setAttribute('data-opens', it.opens);
      var body = el('div', 'item-card-body');
      body.appendChild(el('span', 'item-card-badge', it.badge || 'امتحان إلكتروني'));
      body.appendChild(el('h3', '', it.title));
      body.appendChild(el('p', '', it.desc || (n + ' ' + (n === 1 ? 'سؤال' : n <= 10 ? 'أسئلة' : 'سؤال') + ' اختيار من متعدد — العلامة من ' + n + (it.duration ? ' — المدة ' + it.duration + ' دقيقة' : ''))));
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
    // الواجهة الجديدة: النافذة فاضية وبتنبني لما الطالب يفتح الامتحان (ExamRunner)
    if (window.ExamRunner){
      document.body.appendChild(d);
      EXAMS[id] = { srv: 1, n: n, key: [], notes: [], sheet: it.title, title: it.title, gen: it.gen, cx: 1, ans: [] };
      return;
    }
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
    try { applyAds(c); } catch(e){ console.warn('cms ads', e); }
    try { applyCardPopup(c.cardpopup); } catch(e){ console.warn('cms cardpopup', e); }
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
