  // ===== علامة "تم الفتح": أي حصة / ملف / امتحان بيفتحه الطالب بيتغيّر شكل كبسته (محفوظة لكل طالب برقم جواله) =====
  (function(){
    function h(str){ let x = 5381; for (let i = 0; i < str.length; i++) x = ((x << 5) + x + str.charCodeAt(i)) | 0; return (x >>> 0).toString(36); }
    function cardKey(card){
      const view = card.closest('.view'), panel = card.closest('.gen-panel');
      const t = card.querySelector('h3');
      return (view ? view.id.replace('view-','') : '') + '|' + (panel ? panel.dataset.gen : '') + '|' + h(qnorm(t ? t.textContent : card.textContent));
    }
    function storeKey(){ const u = getSessionUser(); return u && u.phone ? 'ao_seen_' + u.phone : null; }
    function getSeen(){
      const k = storeKey(); if (!k) return {};
      try { return JSON.parse(getRemembered(k) || '{}') || {}; } catch(e){ return {}; }
    }
    function saveSeen(o){
      const k = storeKey(); if (!k) return;
      const v = JSON.stringify(o);
      safeStorageSet(k, v);
      if (v.length < 3500) setCookie(k, v, 730);
    }
    window.applyVisited = function(){
      const seen = getSeen();
      document.querySelectorAll('.item-card').forEach(function(c){ c.classList.toggle('visited', !!seen[cardKey(c)]); });
    };
    // لون كرت الامتحان بيتبع الشيت: أخضر = الامتحان مسجّل للطالب بالشيت، وإذا انحذف صفه بيرجع لونه الأصلي
    window.setVisitedExam = function(examId, on){
      const needle = examId === 'piecewise' ? 'openPwExam(' : examId === 'angle' ? 'openAngleExam(' : "exOpen('" + examId + "'";
      const seen = getSeen(); let changed = false;
      document.querySelectorAll('.item-card').forEach(function(card){
        const b = card.querySelector('.item-card-btn');
        if (!b || (b.getAttribute('onclick') || '').indexOf(needle) === -1) return;
        const k = cardKey(card);
        if (on && !seen[k]){ seen[k] = 1; changed = true; }
        if (!on && seen[k]){ delete seen[k]; changed = true; }
        card.classList.toggle('visited', !!on);
      });
      if (changed) saveSeen(seen);
    };
    // أي ضغطة على كبسة داخل كرت (حصة، ملف، امتحان) = الطالب فتحه
    document.addEventListener('click', function(e){
      const btn = e.target.closest('.item-card .item-card-btn');
      if (!btn) return;
      const card = btn.closest('.item-card');
      const seen = getSeen(); seen[cardKey(card)] = 1; saveSeen(seen);
      card.classList.add('visited');
    }, true);
    // نحدّث الألوان لما الطالب يتنقل بين الصفحات أو يختار جيل
    document.addEventListener('click', function(){ setTimeout(window.applyVisited, 0); });
    window.addEventListener('hashchange', window.applyVisited);
    window.applyVisited();
  })();
