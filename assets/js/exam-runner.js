/* واجهة الامتحان الجديدة: عدّاد، لوحة أسئلة، علامة مراجعة، وضع «كل الأسئلة / سؤال واحد».
   بتشتغل لامتحانات الداشبورد (cx). التصحيح والوقت عند السيرفر. */
(function () {
  'use strict';
  var LET = ['a', 'b', 'c', 'd', 'e', 'f'];
  var ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون'];
  var ST = {};

  var css = '.qx2{position:fixed;inset:0;z-index:9999;background:#F3F5FA;overflow:auto;direction:rtl;color:#1B2A4E;font-family:Cairo,Tajawal,system-ui,sans-serif;line-height:1.7}' +
    '.qx2 *{box-sizing:border-box}' +
    '.x2-top{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #E3E8F2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px;flex-wrap:wrap}' +
    '.x2-top h2{margin:0;font-size:18px;font-weight:800;color:#0F1E3F}' +
    '.x2-tools{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}' +
    '.x2-pill{display:flex;flex-direction:column;gap:2px;font-size:11px;color:#5B6783}' +
    '.x2-pill b{display:inline-flex;gap:6px;align-items:center;justify-content:center;border-radius:10px;padding:5px 12px;font-size:13px;font-weight:800;direction:ltr}' +
    '.x2-t b{background:#FDE9EA;color:#D4343A}.x2-d b{background:#E5ECFB;color:#26478F}.x2-n b{background:#F0E8FD;color:#7B3FD0}' +
    '.x2-t.low b{background:#D4343A;color:#fff}' +
    '.x2-leave{border:1px solid #D9DFEC;background:#fff;border-radius:12px;padding:8px 16px;font:inherit;font-size:13px;cursor:pointer;color:#1B2A4E}' +
    '.x2-main{max-width:1240px;margin:0 auto;padding:18px;display:grid;grid-template-columns:340px minmax(0,1fr);gap:20px;align-items:start}' +
    '.x2-side{position:sticky;top:78px;display:flex;flex-direction:column;gap:14px}' +
    '.x2-card{background:#fff;border:1px solid #E3E8F2;border-radius:18px;padding:18px 20px;box-shadow:0 1px 3px rgba(20,40,90,.05)}' +
    '.x2-modes{display:flex;gap:8px;align-items:center;font-size:14px;font-weight:700}' +
    '.x2-modes button{flex:1;border:0;border-radius:12px;padding:10px 8px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;background:#fff;color:#4A5878}' +
    '.x2-modes button.on{background:#1E3F8F;color:#fff}' +
    '.x2-card h3{margin:0 0 12px;font-size:14px;color:#1E3F8F}' +
    '.x2-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}' +
    '.x2-grid button{height:42px;border:0;border-radius:10px;background:#EEF1F6;color:#4A5878;font:inherit;font-size:13px;font-weight:700;cursor:pointer;position:relative}' +
    '.x2-grid button.done{background:#E3EAFB;color:#1E3F8F}' +
    '.x2-grid button.cur{background:#1E3F8F;color:#fff}' +
    '.x2-grid button.flag::after{content:"";position:absolute;top:3px;right:3px;width:9px;height:9px;border-radius:50%;background:#F5A524}' +
    '.x2-leg{display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;font-size:11px;color:#6A768F}' +
    '.x2-leg i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-left:5px;vertical-align:-1px}' +
    '.x2-qs{display:flex;flex-direction:column;gap:18px;min-width:0}' +
    '.x2-q{background:#fff;border:1px solid #E3E8F2;border-radius:18px;padding:22px 26px;box-shadow:0 1px 3px rgba(20,40,90,.05)}' +
    '.x2-qh{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}' +
    '.x2-qh h3{margin:0;font-size:22px;font-weight:800;color:#1E3F8F}' +
    '.x2-flag{border:1px solid #D9DFEC;background:#fff;border-radius:10px;padding:5px 12px;font:inherit;font-size:12px;cursor:pointer;color:#5B6783}' +
    '.x2-flag.on{background:#FFF4DC;border-color:#F5A524;color:#9A6200}' +
    '.x2-qt{font-size:18px;margin-bottom:14px;overflow-wrap:anywhere}' +
    '.x2-qt img,.x2-img{display:block;max-width:100%;max-height:360px;margin:12px auto;border-radius:10px;background:#fff}' +
    '.x2-opts{display:flex;flex-direction:column;gap:10px}' +
    '.x2-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:right;border:1px solid #DDE3EF;background:#fff;border-radius:12px;padding:15px 18px;font:inherit;font-size:16px;cursor:pointer;color:#1B2A4E}' +
    '.x2-opt:hover{border-color:#9DB2E6}' +
    '.x2-opt.sel{border-color:#1E3F8F;background:#F4F7FE}' +
    '.x2-r{flex:0 0 24px;width:24px;height:24px;border-radius:50%;border:2px solid #1B2A4E;display:inline-flex;align-items:center;justify-content:center}' +
    '.x2-opt.sel .x2-r::after{content:"";width:12px;height:12px;border-radius:50%;background:#1B2A4E}' +
    '.x2-opt.ok{border-color:#1E9E5A;background:#EAF8F0}.x2-opt.ok .x2-r{border-color:#1E9E5A}.x2-opt.ok .x2-r::after{background:#1E9E5A}' +
    '.x2-opt.bad{border-color:#D4343A;background:#FDEEEE}.x2-opt.bad .x2-r{border-color:#D4343A}.x2-opt.bad .x2-r::after{background:#D4343A}' +
    '.x2-opt[disabled]{cursor:default}' +
    '.x2-nav{display:flex;justify-content:space-between;gap:10px;margin-top:16px}' +
    '.x2-btn{border:0;border-radius:12px;padding:12px 22px;font:inherit;font-size:15px;font-weight:800;cursor:pointer;background:#1E3F8F;color:#fff}' +
    '.x2-btn.ghost{background:#fff;color:#1E3F8F;border:1px solid #C9D3EC}.x2-btn[disabled]{opacity:.5;cursor:default}' +
    '.x2-msg{min-height:22px;margin-top:8px;font-size:13px;color:#D4343A;font-weight:700}' +
    '.x2-res{max-width:860px;margin:30px auto;padding:0 16px}' +
    '.x2-score{text-align:center;font-size:56px;font-weight:900;color:#1E3F8F;direction:ltr}.x2-score small{font-size:24px;color:#6A768F}' +
    '.x2-fb{margin-top:10px;font-size:14px;padding:8px 12px;border-radius:10px}.x2-fb.ok{background:#EAF8F0;color:#157A44}.x2-fb.bad{background:#FDEEEE;color:#B02A2F}.x2-fb.note{background:#F3F5FA;color:#3B4A6B}' +
    '@media(max-width:900px){.x2-main{grid-template-columns:1fr;padding:12px}.x2-side{position:static}.x2-q{padding:16px}.x2-qh h3{font-size:19px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function math(p, t) { if (window.cxMathNodes) window.cxMathNodes(p, t); else p.appendChild(document.createTextNode(t || '')); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + ' : ' + pad(m) : pad(m)) + ' : ' + pad(s % 60);
  }
  function durText(m) { return m % 60 === 0 && m >= 60 ? (m / 60 === 1 ? 'ساعة 1' : m / 60 + ' ساعات') : m + ' دقيقة'; }
  function draftKey(id) { var u = (window.getSessionUser && getSessionUser()) || {}; return 'ao_exdraft_' + (u.phone || 'x') + '_' + id; }
  function saveDraft(s) { try { localStorage.setItem(draftKey(s.id), JSON.stringify({ s: s.startedAt, a: s.ans, f: s.flag })); } catch (e) {} }
  function loadDraft(id, startedAt) { try { var d = JSON.parse(localStorage.getItem(draftKey(id)) || 'null'); return d && d.s === startedAt ? d : null; } catch (e) { return null; } }
  function dropDraft(id) { try { localStorage.removeItem(draftKey(id)); } catch (e) {} }

  function header(d, it, s) {
    var top = el('div', 'x2-top'); top.appendChild(el('h2', '', it.title));
    var tools = el('div', 'x2-tools');
    function pill(cls, label, val) { var p = el('div', 'x2-pill ' + cls); p.appendChild(el('span', '', label)); var b = el('b', '', val); p.appendChild(b); return p; }
    if (s) {
      if (s.deadline) { var tp = pill('x2-t', 'الوقت المتبقي', '--'); s.timeEl = tp.querySelector('b'); s.timePill = tp; tools.appendChild(tp); }
      if (it.duration) tools.appendChild(pill('x2-d', 'مدة الاختبار', durText(it.duration)));
      tools.appendChild(pill('x2-n', 'عدد الأسئلة', String(it.questions.length)));
    }
    var lv = el('button', 'x2-leave', s ? 'مغادرة الاختبار' : 'إغلاق'); lv.type = 'button';
    lv.onclick = function () {
      if (s && !confirm('بتقدر ترجع وتكمّل إجاباتك' + (s.deadline ? '، بس الوقت بيضل شغّال' : '') + '. تغادر الآن؟')) return;
      close(it.id);
    };
    tools.appendChild(lv); top.appendChild(tools); return top;
  }

  function qBody(it, q, qi, mode, s) {
    var card = el('div', 'x2-q'); card.setAttribute('data-q', String(qi));
    var h = el('div', 'x2-qh');
    h.appendChild(el('h3', '', 'السؤال ' + (ORD[qi] || (qi + 1))));
    if (mode === 'exam') {
      var f = el('button', 'x2-flag', '⚑ علامة للمراجعة'); f.type = 'button';
      f.onclick = function () { s.flag[qi] = !s.flag[qi]; f.classList.toggle('on', !!s.flag[qi]); saveDraft(s); paintNav(s); };
      if (s.flag[qi]) f.classList.add('on'); h.appendChild(f);
    }
    card.appendChild(h);
    var t = el('div', 'x2-qt'); math(t, q.text); card.appendChild(t);
    var src = window.cxImgSrc && q.img ? cxImgSrc(q.img) : '';
    if (src) { var im = el('img', 'x2-img'); im.src = src; im.alt = 'صورة السؤال ' + (qi + 1); im.loading = 'lazy'; card.appendChild(im); }
    return card;
  }

  function paintNav(s) {
    if (!s.navBtns) return;
    s.navBtns.forEach(function (b, i) {
      b.className = (s.ans[i] ? 'done' : '') + (s.flag[i] ? ' flag' : '') + (i === s.cur && s.mode === 'one' ? ' cur' : '');
    });
  }
  function show(s) {
    s.cards.forEach(function (c, i) { c.hidden = s.mode === 'one' && i !== s.cur; });
    s.modeBtns.all.classList.toggle('on', s.mode === 'all'); s.modeBtns.one.classList.toggle('on', s.mode === 'one');
    s.prev.hidden = s.next.hidden = s.mode !== 'one';
    s.prev.disabled = s.cur === 0; s.next.disabled = s.cur === s.cards.length - 1;
    paintNav(s);
  }
  function goto(s, i) {
    s.cur = i;
    if (s.mode === 'one') { show(s); s.root.scrollTop = 0; }
    else { s.cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); paintNav(s); }
  }

  function start(id, d, it, r) {
    var n = it.questions.length;
    var s = ST[id] = { id: id, it: it, root: d, ans: [], flag: [], cur: 0, mode: 'all', startedAt: r.startedAt, deadline: r.deadline || 0, off: (r.now || Date.now()) - Date.now(), cards: [], navBtns: [] };
    var dr = loadDraft(id, r.startedAt); if (dr) { s.ans = dr.a || []; s.flag = dr.f || []; }
    d.innerHTML = ''; d.appendChild(header(d, it, s));
    var main = el('div', 'x2-main');
    var side = el('div', 'x2-side');
    var mc = el('div', 'x2-card x2-modes'); mc.appendChild(el('span', '', 'العرض:'));
    var bAll = el('button', 'on', '☰ كل الأسئلة'), bOne = el('button', '', '▢ سؤال واحد'); bAll.type = bOne.type = 'button';
    s.modeBtns = { all: bAll, one: bOne };
    bAll.onclick = function () { s.mode = 'all'; show(s); }; bOne.onclick = function () { s.mode = 'one'; show(s); s.root.scrollTop = 0; };
    mc.appendChild(bAll); mc.appendChild(bOne); side.appendChild(mc);
    var nc = el('div', 'x2-card'); nc.appendChild(el('h3', '', 'أسئلة الاختبار'));
    var grid = el('div', 'x2-grid');
    for (var i = 0; i < n; i++) (function (i) {
      var b = el('button', '', String(i + 1)); b.type = 'button'; b.onclick = function () { goto(s, i); }; grid.appendChild(b); s.navBtns.push(b);
    })(i);
    nc.appendChild(grid);
    var lg = el('div', 'x2-leg');
    [['#E3EAFB', 'تمت الإجابة'], ['#EEF1F6', 'لم تتم الإجابة'], ['#F5A524', 'مراجعة قبل التسليم']].forEach(function (x) { var sp = el('span'); var ic = el('i'); ic.style.background = x[0]; sp.appendChild(ic); sp.appendChild(document.createTextNode(x[1])); lg.appendChild(sp); });
    nc.appendChild(lg); side.appendChild(nc);
    var fin = el('button', 'x2-btn', 'إنهاء الاختبار وعرض النتيجة'); fin.type = 'button'; fin.onclick = function () { submit(id, false); };
    side.appendChild(fin); s.msg = el('div', 'x2-msg'); side.appendChild(s.msg);
    var qs = el('div', 'x2-qs');
    it.questions.forEach(function (q, qi) {
      var card = qBody(it, q, qi, 'exam', s);
      var os = el('div', 'x2-opts');
      q.opts.forEach(function (o, oi) {
        var b = el('button', 'x2-opt'); b.type = 'button'; b.appendChild(el('span', 'x2-r'));
        var t = el('span', 'x2-t2'); math(t, o); b.appendChild(t);
        if (s.ans[qi] === LET[oi]) b.classList.add('sel');
        b.onclick = function () {
          s.ans[qi] = LET[oi];
          os.querySelectorAll('.x2-opt').forEach(function (x, k) { x.classList.toggle('sel', k === oi); });
          saveDraft(s); paintNav(s); s.msg.textContent = '';
        };
        os.appendChild(b);
      });
      card.appendChild(os); qs.appendChild(card); s.cards.push(card);
    });
    var nav = el('div', 'x2-nav');
    s.next = el('button', 'x2-btn ghost', 'التالي ‹'); s.prev = el('button', 'x2-btn ghost', '› السابق'); s.next.type = s.prev.type = 'button';
    s.next.onclick = function () { goto(s, Math.min(n - 1, s.cur + 1)); }; s.prev.onclick = function () { goto(s, Math.max(0, s.cur - 1)); };
    nav.appendChild(s.next); nav.appendChild(s.prev); qs.appendChild(nav);
    main.appendChild(side); main.appendChild(qs); d.appendChild(main);
    show(s);
    if (s.deadline) {
      var tick = function () {
        var left = s.deadline - (Date.now() + s.off);
        s.timeEl.textContent = fmt(left); s.timePill.classList.toggle('low', left <= 300000);
        if (left <= 0) { clearInterval(s.timer); submit(id, true); }
      };
      tick(); s.timer = setInterval(tick, 1000);
    }
  }

  function result(id, d, it, r, mine) {
    var n = r.key.length, ST_ = ST[id]; if (ST_ && ST_.timer) clearInterval(ST_.timer);
    d.innerHTML = ''; d.appendChild(header(d, it, null)); d.scrollTop = 0;
    var box = el('div', 'x2-res'), top = el('div', 'x2-card');
    top.appendChild(el('h3', '', 'انتهى الاختبار'));
    var sc = el('div', 'x2-score', String(r.score)); sc.appendChild(el('small', '', ' / ' + (r.max || n))); top.appendChild(sc);
    var pct = r.score / (r.max || n);
    var note = el('p', '', r.late ? 'انتهى وقت الامتحان قبل ما تسلّم، فما انحسبت إجاباتك.' : pct >= 0.8 ? 'ممتاز، أحسنت!' : pct >= 0.5 ? 'جيد، راجع الأسئلة التي أخطأت فيها.' : 'راجع الدرس وإجاباتك أدناه.');
    note.style.cssText = 'text-align:center;font-weight:700'; top.appendChild(note);
    top.appendChild(el('p', '', 'تم تسليم هذا الامتحان — محاولة واحدة فقط.' + (mine ? '' : ' (إجاباتك ما انحفظت على هذا الجهاز، بنعرض لك علامتك والإجابات الصحيحة.)'))).style.cssText = 'text-align:center;font-size:13px;color:#6A768F';
    box.appendChild(top);
    var list = el('div', 'x2-qs'); list.style.marginTop = '18px';
    it.questions.forEach(function (q, qi) {
      var card = qBody(it, q, qi, 'review', null), key = r.key[qi], my = mine ? mine[qi] : '';
      var os = el('div', 'x2-opts');
      q.opts.forEach(function (o, oi) {
        var b = el('button', 'x2-opt'); b.type = 'button'; b.disabled = true; b.appendChild(el('span', 'x2-r'));
        var t = el('span'); math(t, o); b.appendChild(t);
        if (LET[oi] === key) b.classList.add('ok'); else if (mine && LET[oi] === my) b.classList.add('bad');
        os.appendChild(b);
      });
      card.appendChild(os);
      var fb = el('div', 'x2-fb');
      if (!mine) { fb.className += ' ok'; fb.textContent = 'الإجابة الصحيحة: ' + key; }
      else if (my === key) { fb.className += ' ok'; fb.textContent = '✓ إجابتك صحيحة (' + key + ')'; }
      else { fb.className += ' bad'; fb.textContent = (my ? '✗ إجابتك خاطئة (' + my + ')' : '✗ لم تجب عن هذا السؤال') + ' — الإجابة الصحيحة: ' + key; }
      card.appendChild(fb);
      if (r.notes && r.notes[qi]) { var nt = el('div', 'x2-fb note'); nt.appendChild(document.createTextNode('💡 ')); math(nt, r.notes[qi]); card.appendChild(nt); }
      list.appendChild(card);
    });
    box.appendChild(list);
    var cl = el('button', 'x2-btn', 'إغلاق'); cl.type = 'button'; cl.style.marginTop = '18px'; cl.onclick = function () { close(id); };
    box.appendChild(cl); d.appendChild(box);
  }

  function submit(id, auto) {
    var s = ST[id]; if (!s || s.busy) return;
    var it = s.it, n = it.questions.length, left = 0, answers = [];
    for (var i = 0; i < n; i++) { answers.push(s.ans[i] || ''); if (!s.ans[i]) left++; }
    if (!auto && left && !confirm('بقي ' + left + ' سؤال بلا إجابة. هل تريد إنهاء الاختبار؟')) { s.msg.textContent = 'أجب عن جميع الأسئلة قبل الإنهاء.'; return; }
    var A = window.StudentAccount;
    if (!A || typeof A.call !== 'function') { s.msg.textContent = 'تعذّر الاتصال بالسيرفر، حدّث الصفحة وجرّب مرة ثانية.'; return; }
    s.busy = true; s.msg.textContent = auto ? '⏰ انتهى الوقت، جاري تسليم إجاباتك…' : '⏳ جاري تسليم الامتحان…';
    A.call('POST', '/api/me/exam-submit', { id: id, answers: answers }).then(function (r) {
      if (!r || !r.ok || !Array.isArray(r.key)) throw new Error('bad');
      finish(id, r, answers);
    }).catch(function (e) {
      s.busy = false;
      s.msg.textContent = (e && e.status && e.message) ? e.message : 'تعذّر الاتصال بالسيرفر. إجاباتك محفوظة، جرّب مرة ثانية.';
      if (auto && s.deadline) setTimeout(function () { if (ST[id] === s) submit(id, true); }, 5000);
    });
  }
  function finish(id, r, answers) {
    var it = (window.CX_ITEMS || {})[id], d = document.getElementById('ex-' + id);
    var E = window.EXAMS && EXAMS[id]; if (E) { E.key = r.key; E.notes = r.notes || []; E.srvReady = true; }
    var mine = r.answers || null;
    try { if (mine) examSetSaved(id, mine, r.key.length); else examMirrorServer(id, { score: r.score, max: r.max }); examSyncSaved(true); } catch (e) {}
    dropDraft(id); result(id, d, it, r, mine); if (ST[id]) ST[id].busy = false;
  }

  function review(id, d, it) {
    var A = window.StudentAccount;
    if (!A || typeof A.call !== 'function') { err(d, it, 'تعذّر الاتصال بالسيرفر، حدّث الصفحة.'); return; }
    A.call('POST', '/api/me/exam-submit', { id: id }).then(function (r) {
      if (!r || !r.ok || !Array.isArray(r.key)) throw new Error('bad');
      finish(id, r, null);
    }).catch(function (e) {
      if (e && e.status === 400) { try { var k = examSaveKey(id); safeStorageRemove(k); deleteCookie(k); } catch (x) {} open(id, true); return; }
      err(d, it, (e && e.status && e.message) ? e.message : 'تعذّر الاتصال بالسيرفر. تأكد من الإنترنت وجرّب مرة ثانية.');
    });
  }
  function err(d, it, m) {
    d.innerHTML = ''; d.appendChild(header(d, it, null));
    var b = el('div', 'x2-res'), c = el('div', 'x2-card', m); c.style.textAlign = 'center'; b.appendChild(c); d.appendChild(b);
  }

  function open(id, again) {
    if (!again && typeof examNeedLogin === 'function' && examNeedLogin(function () { open(id); })) return;
    if (typeof examIsLocked === 'function' && examIsLocked(id)) return;
    var it = (window.CX_ITEMS || {})[id], d = document.getElementById('ex-' + id);
    if (!it || !d || !it.questions) return;
    try { history.replaceState(history.state, '', '#exams/' + (it.gen || '2010') + '/' + id); } catch (e) {}
    d.className = 'qx qx2'; d.innerHTML = ''; d.hidden = false; document.body.style.overflow = 'hidden';
    d.appendChild(header(d, it, null)); d.appendChild(el('div', 'x2-res')).appendChild(el('div', 'x2-card', 'جاري التحضير…')).style.textAlign = 'center';
    if (typeof examGetSaved === 'function' && examGetSaved(id)) return review(id, d, it);
    var A = window.StudentAccount;
    if (!A || typeof A.call !== 'function') return err(d, it, 'تعذّر الاتصال بالسيرفر، حدّث الصفحة وجرّب مرة ثانية.');
    A.call('POST', '/api/me/exam-start', { id: id }).then(function (r) {
      if (!r || !r.ok) throw new Error('bad');
      if (r.taken) return review(id, d, it);
      start(id, d, it, r);
    }).catch(function (e) { err(d, it, (e && e.status && e.message) ? e.message : 'تعذّر الاتصال بالسيرفر. تأكد من الإنترنت وجرّب مرة ثانية.'); });
  }
  function close(id) {
    var s = ST[id]; if (s && s.timer) clearInterval(s.timer); delete ST[id];
    var it = (window.CX_ITEMS || {})[id], g = (it && it.gen) || '2010', d = document.getElementById('ex-' + id);
    if (location.hash === '#exams/' + g + '/' + id) { try { history.replaceState(history.state, '', '#exams/' + g); } catch (e) {} }
    if (d) { d.hidden = true; d.innerHTML = ''; }
    document.body.style.overflow = '';
  }
  window.ExamRunner = { open: open, close: close };
})();
