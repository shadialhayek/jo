  // ===== تنزيل نتيجة الامتحان PDF (ملف حقيقي) — بعد التسليم فقط، من داخل الامتحان ومن بطاقة الامتحان =====
  (function(){
    // مكتبة الرسم (html2canvas) — بنجرّب أكثر من مصدر. الرسم بصير سؤال سؤال (مش لوحة وحدة ضخمة) عشان الايفون ما يعلق.
    var H2C_SRCS = [
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    ];
    var libP = null, hiddenEls = [], oldTitle = null;
    var PG_W = 1654, PG_H = 2339;                       // صفحة A4 بدقة ~200dpi
    var RENDER_W = 520;                                 // عرض الرسم بالبكسل: أضيق = خط وأشكال أكبر وأوضح بالصفحة
    var MX = Math.round(8 * PG_W / 210), MY = Math.round(10 * PG_H / 297);
    var CONTENT_W = PG_W - 2 * MX;
    var SCALE = CONTENT_W / RENDER_W;

    function loadScript(src, ms){
      return new Promise(function(res, rej){
        var s = document.createElement('script'), t = setTimeout(function(){ s.onload = s.onerror = null; rej(new Error('timeout')); }, ms);
        s.onload = function(){ clearTimeout(t); res(); };
        s.onerror = function(){ clearTimeout(t); rej(new Error('load')); };
        s.src = src; document.head.appendChild(s);
      });
    }
    function loadLib(){
      if (window.html2canvas) return Promise.resolve();
      if (libP) return libP;
      libP = H2C_SRCS.reduce(function(p, src){
        return p.catch(function(){ return window.html2canvas ? null : loadScript(src, 20000); });
      }, Promise.reject(new Error('start'))).then(function(){
        if (!window.html2canvas) throw new Error('تعذر تحميل مكتبة الرسم');
      }).catch(function(e){ libP = null; throw e; });
      return libP;
    }
    function titleOf(d){ var h = d.querySelector('.qx-top h2'); return h ? h.textContent.trim() : 'امتحان إلكتروني'; }
    function userName(){ try { var u = (typeof getSessionUser === 'function') ? getSessionUser() : null; return (u && u.name) ? u.name : ''; } catch(e){ return ''; } }
    function makeHead(d){
      var head = document.createElement('div'); head.className = 'pdf-head';
      var h1 = document.createElement('h1'); h1.textContent = titleOf(d); head.appendChild(h1);
      function line(t){ var p = document.createElement('p'); p.textContent = t; head.appendChild(p); }
      line('الأستاذ شادي الحايك');
      if (userName()) line('اسم الطالب: ' + userName());
      var sc = d.querySelector('.qx-result .qx-score');
      if (sc) line('العلامة: ' + sc.textContent.replace(/\s+/g, ' ').trim());
      line('التاريخ: ' + new Date().toLocaleDateString('ar-JO'));
      return head;
    }

    // ---- بناء ملف PDF يدويًا من صور JPEG (بدون مكتبة، وخفيف على الذاكرة) ----
    function ascii(str){ var a = new Uint8Array(str.length); for (var i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 255; return a; }
    function hex16(str){ var h = 'FEFF'; for (var i = 0; i < str.length; i++) h += ('0000' + str.charCodeAt(i).toString(16)).slice(-4); return '<' + h + '>'; }
    function makePdf(jpegs, title){
      var parts = [], pos = 0, offs = [], N = jpegs.length, i;
      function put(x){ var u = (typeof x === 'string') ? ascii(x) : x; parts.push(u); pos += u.length; }
      function obj(n, head, stream){
        offs[n] = pos; put(n + ' 0 obj\n' + head);
        if (stream){ put('\nstream\n'); put(stream); put('\nendstream'); }
        put('\nendobj\n');
      }
      var kids = []; for (i = 0; i < N; i++) kids.push((3 + i * 3) + ' 0 R');
      var infoN = 3 + N * 3;
      put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
      obj(1, '<</Type/Catalog/Pages 2 0 R>>');
      obj(2, '<</Type/Pages/Kids[' + kids.join(' ') + ']/Count ' + N + '>>');
      for (i = 0; i < N; i++){
        var p = 3 + i * 3, c = p + 1, im = p + 2, cs = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
        obj(p, '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595.28 841.89]/Resources<</XObject<</Im0 ' + im + ' 0 R>>>>/Contents ' + c + ' 0 R>>');
        obj(c, '<</Length ' + cs.length + '>>', ascii(cs));
        obj(im, '<</Type/XObject/Subtype/Image/Width ' + PG_W + '/Height ' + PG_H + '/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ' + jpegs[i].length + '>>', jpegs[i]);
      }
      obj(infoN, '<</Title ' + hex16(title || '') + '>>');
      var xo = pos, size = infoN + 1, x = 'xref\n0 ' + size + '\n0000000000 65535 f \n';
      for (i = 1; i < size; i++) x += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
      x += 'trailer\n<</Size ' + size + '/Root 1 0 R/Info ' + infoN + ' 0 R>>\nstartxref\n' + xo + '\n%%EOF';
      put(x);
      var out = new Uint8Array(pos), at = 0;
      parts.forEach(function(u){ out.set(u, at); at += u.length; });
      return out;
    }

    function withTimeout(p, ms){
      return new Promise(function(res, rej){
        var t = setTimeout(function(){ rej(new Error('timeout')); }, ms);
        p.then(function(v){ clearTimeout(t); res(v); }, function(e){ clearTimeout(t); rej(e); });
      });
    }
    function pause(){ return new Promise(function(r){ setTimeout(r, 30); }); }   // فرصة للمتصفح يفرّغ الذاكرة بين كل سؤال

    // ترويسة جميلة للـPDF: اسم الامتحان + الطالب + العلامة + ملخص
    function mk(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function makePrettyHead(d){
      var ttl = titleOf(d), parts = ttl.split(/\s*[—–-]\s*/), kick = parts.length > 1 ? parts[0] : 'اختبار إلكتروني', main = parts.length > 1 ? parts.slice(1).join(' — ') : ttl;
      var who = userName(), sc = d.querySelector('.qx-result .qx-score'), scTxt = sc ? sc.textContent.replace(/\s+/g, ' ').trim() : '';
      var m = /(\d+(?:\.\d+)?)\s*\/\s*(\d+)/.exec(scTxt), pct = m && +m[2] ? Math.round(100 * (+m[1]) / (+m[2])) : null;
      var col = pct == null ? '#6b7280' : pct >= 80 ? '#1f9d4d' : pct >= 50 ? '#e09a00' : '#d63a3a';
      var note = pct == null ? '' : pct >= 80 ? 'ممتاز، أحسنت!' : pct >= 50 ? 'جيد، راجع الأسئلة التي أخطأت فيها' : 'راجع الدرس وإجاباتك أدناه';
      var date = ''; try { date = new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' }); } catch(e){ date = new Date().toLocaleDateString(); }
      var rv = d.querySelector('.qx-review');
      var nOk = rv ? rv.querySelectorAll('.qx-fb.ok').length : 0, nBad = 0, nNo = 0;
      if (rv) rv.querySelectorAll('.qx-fb.bad').forEach(function(f){ if (/لم تجب/.test(f.textContent)) nNo++; else nBad++; });

      var head = mk('div', 'pdfx-head');
      var ban = mk('div', 'pdfx-banner');
      ban.appendChild(mk('div', 'pdfx-kick', kick));
      ban.appendChild(mk('h1', '', main));
      ban.appendChild(mk('div', 'pdfx-teacher', 'الأستاذ شادي الحايك'));
      head.appendChild(ban);

      var info = mk('div', 'pdfx-info');
      if (who){ var c1 = mk('div', 'pdfx-cell'); c1.appendChild(mk('span', '', 'اسم الطالب')); c1.appendChild(mk('b', '', who)); info.appendChild(c1); }
      var c2 = mk('div', 'pdfx-cell pdfx-sc'); c2.appendChild(mk('span', '', 'العلامة'));
      var sb = mk('b', '', scTxt || '—'); sb.style.color = col; sb.setAttribute('dir', 'ltr'); c2.appendChild(sb); info.appendChild(c2);
      var c3 = mk('div', 'pdfx-cell'); c3.appendChild(mk('span', '', 'التاريخ')); c3.appendChild(mk('b', '', date)); info.appendChild(c3);
      head.appendChild(info);

      if (pct != null){
        var bar = mk('div', 'pdfx-bar'), fill = mk('i'); fill.style.width = Math.max(pct, 2) + '%'; fill.style.background = col; bar.appendChild(fill); head.appendChild(bar);
        head.appendChild(mk('div', 'pdfx-note', note + ' — ' + pct + '%'));
      }
      var chips = mk('div', 'pdfx-chips');
      [['✓ صحيحة', nOk, 'ok'], ['✗ خاطئة', nBad, 'bad'], ['— بلا إجابة', nNo, 'no']].forEach(function(x){ chips.appendChild(mk('span', 'pdfx-chip ' + x[2], x[0] + ': ' + x[1])); });
      head.appendChild(chips);
      head.appendChild(mk('div', 'pdfx-sec', 'مراجعة الإجابات'));
      return head;
    }
    // نقسم النتيجة لقطع: الترويسة + كل سؤال لحاله
    function buildBlocks(d){
      var rv = d.querySelector('.qx-review');
      if (!rv || !rv.querySelector('.qx-q')) return null;
      var blocks = [{ el: makePrettyHead(d), review: false }];
      var clone = rv.cloneNode(true);
      Array.prototype.slice.call(clone.children).forEach(function(c){
        if (c.tagName === 'H3' || c.tagName === 'P') return;
        if (c.classList.contains('qx-q') || c.classList.contains('qx-ctx') || !c.children.length) blocks.push({ el: c, review: true });
        else Array.prototype.slice.call(c.children).forEach(function(k){ blocks.push({ el: k, review: true }); });   // حاوية الأسئلة → كل سؤال لحاله
      });
      return blocks;
    }
    // ===== رسم المعادلات يدويًا على canvas =====
    // html2canvas بيزحزح مواضع النص ويرسم حدود (borders) الكسر والجذر غلط (خط فوق π و − والأرقام).
    // فبنحوّل كل معادلة (كسور، جذور، أسس، اقترانات متشعبة) لصورة مرسومة بحسابات دقيقة، وبنحطها مكان المعادلة قبل التصوير.
    var MFAM = "'Noto Sans','Segoe UI','Helvetica Neue',Arial,sans-serif";
    var MPX = 4;                       // دقة صورة المعادلة (الصورة بتنصغّر عند التركيب، فبتطلع حادة)
    var MAXIS = 0.3;                   // ارتفاع محور الرياضيات (وسط علامة − وخط الكسر) فوق خط الأساس، بوحدة حجم الخط
    var mctx = document.createElement('canvas').getContext('2d');

    function mFont(st){ return (st.it ? 'italic ' : '') + (st.bold ? '700 ' : '400 ') + st.size + 'px ' + MFAM; }
    function mCopy(st, o){ var r = {}, k; for (k in st) r[k] = st[k]; for (k in o) r[k] = o[k]; return r; }

    function mText(str, st){
      mctx.font = mFont(st);
      var s = st.size, w = mctx.measureText(str).width + (st.it ? 0.05 * s : 0);
      return { w: w, a: 0.8 * s, d: 0.22 * s, draw: function(c, x, y){
        c.font = mFont(st); c.fillStyle = st.color; c.textBaseline = 'alphabetic'; c.fillText(str, x, y);
      } };
    }
    function mRow(list){
      var w = 0, a = 0, d = 0, i;
      for (i = 0; i < list.length; i++){ w += list[i].w; if (list[i].a > a) a = list[i].a; if (list[i].d > d) d = list[i].d; }
      return { w: w, a: a, d: d, draw: function(c, x, y){
        var cx = x; for (var j = 0; j < list.length; j++){ list[j].draw(c, cx, y); cx += list[j].w; }
      } };
    }
    function mKids(node, st){
      var list = [], k = node.firstChild, b;
      while (k){ b = mBuild(k, st); if (b) list.push(b); k = k.nextSibling; }
      return mRow(list);
    }
    function mShift(box, dy){                     // انزلاق عمودي (dy موجب = لتحت)
      return { w: box.w, a: box.a - dy, d: box.d + dy, draw: function(c, x, y){ box.draw(c, x, y + dy); } };
    }

    function mFrac(node, st){
      var kids = [], k = node.firstChild;
      while (k){ if (k.nodeType === 1) kids.push(k); k = k.nextSibling; }
      if (kids.length !== 2) throw new Error('frac');
      var s = st.size, num = mKids(kids[0], st), den = mKids(kids[1], st);
      var t = Math.max(1, 0.065 * s), g = 0.16 * s, ax = MAXIS * s, pad = 0.14 * s;
      var w = Math.max(num.w, den.w) + 2 * pad;
      var numY = -(ax + t / 2 + g + num.d);       // خط أساس البسط
      var denY = -ax + t / 2 + g + den.a;         // خط أساس المقام
      return { w: w, a: ax + t / 2 + g + num.d + num.a, d: Math.max(0.22 * s, denY + den.d), draw: function(c, x, y){
        num.draw(c, x + (w - num.w) / 2, y + numY);
        den.draw(c, x + (w - den.w) / 2, y + denY);
        c.fillStyle = st.color; c.fillRect(x + pad * 0.4, y - ax - t / 2, w - pad * 0.8, t);
      } };
    }

    function mSqrt(node, st){
      var rad = null, k = node.firstChild;
      while (k){ if (k.nodeType === 1 && k.classList.contains('qx-rad')) rad = k; k = k.nextSibling; }
      if (!rad) throw new Error('sqrt');
      var s = st.size, r = mKids(rad, st), t = Math.max(1, 0.07 * s), sw = 0.62 * s, gap = 0.16 * s, pad = 0.07 * s;
      var top = -(r.a + gap), bot = r.d + 0.06 * s, H = bot - top;
      return { w: sw + pad + r.w + pad, a: -top + t / 2, d: bot, draw: function(c, x, y){
        function X(v){ return x + v / 10 * sw; }
        function Y(v){ return y + top + v / 20 * H; }
        c.strokeStyle = st.color; c.lineWidth = t; c.lineJoin = 'miter'; c.lineCap = 'butt';
        c.beginPath(); c.moveTo(X(0), Y(12.5)); c.lineTo(X(2.2), Y(11)); c.lineTo(X(5), Y(19)); c.lineTo(X(10), Y(0));
        c.lineTo(x + sw + pad + r.w + pad, y + top); c.stroke();
        r.draw(c, x + sw + pad, y);
      } };
    }

    // اقتران متشعب: f(x) = { ... }
    function mPiece(node, st){
      var pre = null, rows = null, k = node.firstChild;
      while (k){
        if (k.nodeType === 1){ if (k.classList.contains('qx-pre')) pre = k; else if (k.classList.contains('qx-rows')) rows = k; }
        k = k.nextSibling;
      }
      if (!rows) throw new Error('pw');
      var s = st.size, cells = [], c2 = rows.firstChild;
      while (c2){ if (c2.nodeType === 1) cells.push(mKids(c2, st)); c2 = c2.nextSibling; }
      var rs = [], i, colA = 0, colB = 0;
      for (i = 0; i < cells.length; i += 2){
        var e = cells[i], cd = cells[i + 1] || mRow([]);
        rs.push({ e: e, c: cd, a: Math.max(e.a, cd.a), d: Math.max(e.d, cd.d) });
        if (e.w > colA) colA = e.w; if (cd.w > colB) colB = cd.w;
      }
      var gapR = 0.18 * s, gapC = 0.6 * s, padV = 0.12 * s, bw = 0.62 * s, gapB = 0.35 * s;
      var rowsH = 0; rs.forEach(function(r){ rowsH += r.a + r.d; }); rowsH += gapR * (rs.length - 1);
      var H = rowsH + 2 * padV;
      var preBox = pre ? mKids(pre, st) : mRow([]);
      var wRows = colA + gapC + colB;
      var w = preBox.w + (pre ? gapB : 0) + bw + gapB + wRows;
      var yc = -MAXIS * s;                             // مركز الكتلة على محور الرياضيات
      return { w: w, a: H / 2 - yc, d: Math.max(0, H / 2 + yc), draw: function(c, x, y){
        var cx = x, top = y + yc - H / 2;
        if (pre){ preBox.draw(c, cx, y + yc + (preBox.a - preBox.d) / 2); cx += preBox.w + gapB; }
        // القوس المعقوف
        function X(v){ return cx + v / 10 * bw; }
        function Y(v){ return top + 0.5 + v / 40 * (H - 1); }
        c.strokeStyle = st.color; c.lineWidth = Math.max(1.2, 0.075 * s); c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(X(9), Y(1)); c.quadraticCurveTo(X(4.5), Y(1), X(4.5), Y(6)); c.lineTo(X(4.5), Y(16));
        c.quadraticCurveTo(X(4.5), Y(20), X(1), Y(20)); c.quadraticCurveTo(X(4.5), Y(20), X(4.5), Y(24));
        c.lineTo(X(4.5), Y(34)); c.quadraticCurveTo(X(4.5), Y(39), X(9), Y(39)); c.stroke();
        cx += bw + gapB;
        var ry = top + padV;
        rs.forEach(function(r){
          r.e.draw(c, cx, ry + r.a); r.c.draw(c, cx + colA + gapC, ry + r.a);
          ry += r.a + r.d + gapR;
        });
      } };
    }

    function mBuild(node, st){
      if (node.nodeType === 3){
        var t = node.nodeValue.replace(/\s+/g, ' ');
        return t ? mText(t, st) : null;
      }
      if (node.nodeType !== 1) return null;
      var tag = node.tagName.toLowerCase(), cl = node.classList;
      if (tag === 'svg' || tag === 'path') return null;
      if (tag === 'i' || tag === 'em') return mKids(node, mCopy(st, { it: true }));
      if (tag === 'b' || tag === 'strong') return mKids(node, mCopy(st, { bold: true }));
      if (tag === 'sup'){
        var rise = 0.4 * st.size, inner = mKids(node, mCopy(st, { size: st.size * 0.7 }));
        return { w: inner.w, a: inner.a + rise, d: Math.max(0, inner.d - rise), draw: function(c, x, y){ inner.draw(c, x, y - rise); } };
      }
      if (tag === 'sub'){
        var low = 0.2 * st.size, inn = mKids(node, mCopy(st, { size: st.size * 0.7 }));
        return { w: inn.w, a: Math.max(0, inn.a - low), d: inn.d + low, draw: function(c, x, y){ inn.draw(c, x, y + low); } };
      }
      if (cl.contains('qx-frac')) return mFrac(node, st);
      if (cl.contains('qx-sqrt')) return mSqrt(node, st);
      if (cl.contains('qx-pw')) return mPiece(node, st);
      if (cl.contains('qx-par')){                  // قوس كبير: متوسّط على محور الرياضيات
        var big = mKids(node, mCopy(st, { size: st.size * 1.5 }));
        return mShift(big, -MAXIS * st.size + (big.a - big.d) / 2);
      }
      if (tag === 'span' || tag === 'bdi') return mKids(node, st);
      throw new Error('unsupported ' + tag);
    }

    // معادلة (bdi) → صورة
    function mathToImg(bdi){
      var cs = window.getComputedStyle(bdi), fw = parseInt(cs.fontWeight, 10);
      var st = { size: parseFloat(cs.fontSize) || 17, bold: !isNaN(fw) ? fw >= 600 : cs.fontWeight === 'bold', it: false, color: cs.color || '#000' };
      var box = bdi.classList.contains('qx-pw') ? mPiece(bdi, st) : ((bdi.classList.contains('qx-frac') || bdi.classList.contains('qx-sqrt')) ? mBuild(bdi, st) : mKids(bdi, st)), P = 2;
      var W = Math.ceil(box.w + 2 * P), Hh = Math.ceil(box.a + box.d + 2 * P);
      var cv = document.createElement('canvas'); cv.width = W * MPX; cv.height = Hh * MPX;
      var x = cv.getContext('2d'); x.scale(MPX, MPX);
      box.draw(x, P, P + box.a);
      var img = document.createElement('img'); img.alt = ''; img.src = cv.toDataURL('image/png');
      img.setAttribute('style', 'display:inline-block;width:' + W + 'px;height:' + Hh + 'px;vertical-align:' + (-(Hh - P - box.a)) + 'px;');
      cv.width = cv.height = 0;
      return img;
    }
    function mathToImages(root){
      var SEL = 'bdi, .qx-frac, .qx-sqrt, .qx-pw', MATH = '.qx-frac, .qx-sqrt, .qx-pw, .qx-par, sup, sub';
      var list = root.querySelectorAll(SEL), n = 0;
      Array.prototype.forEach.call(list, function(b){
        if (!b.parentNode || !root.contains(b)) return;                 // اتشال مع أبوه
        if (b.tagName.toLowerCase() === 'bdi' && !b.querySelector(MATH)) return;   // نص عادي (120° ، (2 rad)) بنخليه نص ولا نحوله لصورة
        if (b.tagName.toLowerCase() === 'bdi' && b.querySelector('bdi')) return;
        try {
          var img = mathToImg(b), w = document.createElement('bdi');
          w.setAttribute('dir', 'ltr'); w.setAttribute('style', 'white-space:nowrap;');
          w.appendChild(img); b.parentNode.replaceChild(w, b); n++;
        } catch(e){ try { console.warn('math fallback', e); } catch(_){} }
      });
      return n;
    }
    function ensureMathFonts(){
      try {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        var T = 'πθ−×∘≤≥∈∞0123456789abcxyzsin';
        return Promise.race([
          Promise.all(['400 20px "Noto Sans"', '700 20px "Noto Sans"', 'italic 400 20px "Noto Sans"', 'italic 700 20px "Noto Sans"'].map(function(f){ return document.fonts.load(f, T); })),
          new Promise(function(r){ setTimeout(r, 4000); })
        ]).catch(function(){});
      } catch(e){ return Promise.resolve(); }
    }

    // رسم قطعة وحدة على canvas صغير (بدون ما نستنسخ باقي الصفحة الثقيلة)
    function renderBlock(b){
      var host = document.createElement('div'); host.className = 'pdfx-overlay';
      host.setAttribute('style', 'position:fixed;left:0;top:0;right:0;bottom:0;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;');
      var box = document.createElement('div');
      box.setAttribute('style', 'position:absolute;left:0;top:0;width:' + RENDER_W + 'px;height:auto;background:#fff;font-size:17px;');
      var doc = document.createElement('div'); doc.className = 'pdfx'; doc.setAttribute('dir', 'rtl');
      doc.appendChild(b.el);
      box.appendChild(doc); host.appendChild(box); document.body.appendChild(host);
      try { mathToImages(doc); } catch(e){ try { console.warn(e); } catch(_){} }   // معادلات مرسومة بدقة بدل ما html2canvas يخربط الكسور والجذور
      function done(){ if (host.parentNode) host.parentNode.removeChild(host); }
      return window.html2canvas(box, {
        scale: SCALE, useCORS: true, backgroundColor: '#ffffff', logging: false,
        scrollX: 0, scrollY: 0, windowWidth: 1000, windowHeight: 1400, imageTimeout: 8000,
        ignoreElements: function(el){ return el.parentNode === document.body && !(el.classList && el.classList.contains('pdfx-overlay')) && el.tagName !== 'STYLE' && el.tagName !== 'LINK'; }
      }).then(function(c){ done(); return c; }, function(e){ done(); throw e; });
    }
    function newPage(){
      var c = document.createElement('canvas'); c.width = PG_W; c.height = PG_H;
      var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, PG_W, PG_H);
      return { c: c, x: x, y: MY };
    }
    function pageToJpeg(pg){
      var url = pg.c.toDataURL('image/jpeg', 0.95);
      pg.c.width = pg.c.height = 0;                       // نفرّغ الذاكرة (مهم للايفون)
      var bin = atob(url.slice(url.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8;
    }
    // نرسم كل قطعة ونركّبها على صفحات A4
    function buildPages(d, onProgress){
      var blocks = buildBlocks(d);
      if (!blocks) return Promise.reject(new Error('لا توجد نتيجة'));
      var jpegs = [], pg = newPage(), i = 0, n = blocks.length, availH = PG_H - 2 * MY;
      function step(){
        if (i >= n){ jpegs.push(pageToJpeg(pg)); return jpegs; }
        if (onProgress) onProgress(i + 1, n);
        var b = blocks[i++];
        return withTimeout(renderBlock(b), 30000).then(function(c){
          if (c.width && c.height){
            var w = CONTENT_W, h = Math.round(c.height * (w / c.width));
            if (h > availH){ w = Math.round(w * availH / h); h = availH; }
            if (pg.y > MY && pg.y + h > PG_H - MY){ jpegs.push(pageToJpeg(pg)); pg = newPage(); }
            pg.x.drawImage(c, 0, 0, c.width, c.height, MX + Math.round((CONTENT_W - w) / 2), pg.y, w, h);
            pg.y += h;
          }
          c.width = c.height = 0;
          return pause().then(step);
        });
      }
      return Promise.resolve().then(step);
    }

    // ---- تنزيل PDF: آيفون/آيباد → معاينة صفحات + زر تنزيل مباشر ، باقي الأجهزة → تنزيل مباشر ----
    function downloadPdf(d, onProgress){
      var ttl = titleOf(d), who = userName();
      var fname = (ttl + (who ? ' - ' + who : '')).replace(/[\\\/:*?"<>|]/g, '').trim() + '.pdf';
      return loadLib().then(ensureMathFonts).then(function(){ return buildPages(d, onProgress); }).then(function(jpegs){
        var bytes = makePdf(jpegs, ttl);
        if (window.isIOSDevice && window.isIOSDevice() && window.wsShowExam){
          var urls = jpegs.map(function(u8){ return URL.createObjectURL(new Blob([u8], { type: 'image/jpeg' })); });
          window.wsShowExam(ttl + (who ? ' — ' + who : ''), urls, bytes, fname);
        } else {
          window.saveFileToDevice(bytes, fname);
        }
      });
    }

    // ---- خطة احتياطية: نافذة الطباعة (حفظ كـ PDF) ----
    function cleanup(){
      hiddenEls.forEach(function(el){ el.classList.remove('pp-hide'); }); hiddenEls = [];
      document.querySelectorAll('.print-target').forEach(function(el){ el.classList.remove('print-target'); });
      document.querySelectorAll('.qx-wrap > .pdf-head').forEach(function(el){ el.remove(); });
      if (oldTitle !== null){ document.title = oldTitle; oldTitle = null; }
    }
    function printFallback(d){
      cleanup();
      var wrap = d.querySelector('.qx-wrap') || d; wrap.insertBefore(makeHead(d), wrap.firstChild);
      d.classList.add('print-target');
      var n = d;
      while (n && n !== document.body && n.parentNode){
        Array.prototype.forEach.call(n.parentNode.children, function(s){
          if (s !== n && !s.classList.contains('pp-hide')){ s.classList.add('pp-hide'); hiddenEls.push(s); }
        });
        n = n.parentNode;
      }
      oldTitle = document.title; document.title = titleOf(d) + (userName() ? ' - ' + userName() : '');
      setTimeout(function(){ try { window.print(); } catch(e){ cleanup(); } }, 80);
    }
    window.addEventListener('afterprint', cleanup);

    function busy(btn, on, txt){ btn.disabled = on; if (on){ if (!btn._busy){ btn._t = btn.textContent; btn._busy = true; } btn.textContent = txt || '⏳ جاري تجهيز الملف…'; } else { btn._busy = false; if (btn._t) btn.textContent = btn._t; } }
    function prog(btn){ return function(i, n){ busy(btn, true, '⏳ جاري التجهيز ' + i + '/' + n); }; }

    // ---- زر داخل صفحة النتيجة ----
    function ensureBtn(res){
      if (res.hidden || res.querySelector('.qx-pdf-btn')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn btn-outline qx-pdf-btn'; b.textContent = '📄 تنزيل PDF';
      b.addEventListener('click', function(){
        var d = res.closest('.qx'); busy(b, true);
        downloadPdf(d, prog(b)).then(function(){ busy(b, false); }, function(err){ try { console.warn(err); } catch(e){} busy(b, false); printFallback(d); });
      });
      var last = null;
      Array.prototype.forEach.call(res.children, function(c){ if (c.tagName === 'BUTTON') last = c; });
      if (last) res.insertBefore(b, last); else res.appendChild(b);
    }

    // ---- زر على بطاقة الامتحان من برا (يظهر فقط للي أنهى الامتحان) ----
    function descFromCode(code){
      code = code || '';
      var m = /exOpen\('([\w-]+)'\)/.exec(code);
      if (m) return { dialog: 'ex-' + m[1], save: m[1], prep: function(sv){ EXAMS[m[1]].ans = sv.a; exSubmit(m[1], true); }, open: function(){ exOpen(m[1]); } };
      if (/openAngleExam/.test(code)) return { dialog: 'angleExam', save: 'angle', prep: function(sv){ angleAns = sv.a; submitAngleExam(true); }, open: function(){ openAngleExam(); } };
      if (/openPwExam/.test(code)) return { dialog: 'pwExam', save: 'piecewise', prep: function(sv){ pwAns = sv.a; submitPwExam(true); }, open: function(){ openPwExam(); } };
      return null;
    }
    var cardBtns = [];
    function refreshCards(){
      cardBtns.forEach(function(o){
        var sv = null; try { sv = examGetSaved(o.desc.save); } catch(e){}
        o.btn.hidden = !sv;
      });
    }
    function setupCards(){
      var view = document.getElementById('view-exams'); if (!view) return;
      view.querySelectorAll('.item-card').forEach(function(card){
        if (card.querySelector('.pdf-card-btn')) return;
        var a = card.querySelector('a.item-card-btn'); if (!a) return;
        var desc = descFromCode(a.getAttribute('onclick')); if (!desc) return;
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'item-card-btn pdf-card-btn'; btn.textContent = '📄 تنزيل PDF'; btn.hidden = true;
        btn.addEventListener('click', function(e){
          e.preventDefault(); e.stopPropagation();
          var sv = null; try { sv = examGetSaved(desc.save); } catch(err){}
          if (!sv){ refreshCards(); return; }
          busy(btn, true);
          try { desc.prep(sv); } catch(err){ busy(btn, false); return; }
          downloadPdf(document.getElementById(desc.dialog), prog(btn)).then(function(){ busy(btn, false); }, function(err){
            try { console.warn(err); } catch(e){}
            busy(btn, false);
            alert('تعذّر تنزيل الملف تلقائياً. بنفتحلك الامتحان، اضغط تنزيل PDF من داخله.');
            desc.open();
          });
        });
        var wrap = document.createElement('div'); wrap.className = 'item-card-btns';
        a.parentNode.insertBefore(wrap, a); wrap.appendChild(a); wrap.appendChild(btn);
        cardBtns.push({ btn: btn, desc: desc });
      });
      refreshCards();
    }

    var mo = new MutationObserver(function(list){
      list.forEach(function(m){ if (m.target.classList && m.target.classList.contains('qx-result')) ensureBtn(m.target); });
      refreshCards();
    });
    document.querySelectorAll('.qx .qx-result').forEach(function(r){
      mo.observe(r, { attributes: true, attributeFilter: ['hidden'] });
      ensureBtn(r);
    });
    setupCards();
    document.addEventListener('click', function(){ setTimeout(refreshCards, 60); }, true);
    window.addEventListener('hashchange', refreshCards);
    window.addEventListener('popstate', refreshCards);
  })();
