  // ===== روابط مباشرة لكل صفحة ولكل امتحان =====
  // #exams  |  #exams/2010  |  #exams/2010/angle  |  #lessons/2010 ... إلخ
  function copyPageLink(){
    const url = location.href;
    const done = function(){
      const t = document.getElementById('linkToast');
      t.classList.add('show');
      setTimeout(function(){ t.classList.remove('show'); }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done, function(){ window.prompt('انسخ الرابط:', url); });
    } else {
      window.prompt('انسخ الرابط:', url);
    }
  }
  function routeFromHash(){
    const h = (location.hash || '').replace(/^#/, '');
    if (!h) return;
    const parts = h.split('/');
    if (!document.getElementById('view-' + parts[0])) return;
    showView(parts[0], false);
    if (parts[0] === 'home' && parts[1]){
      if (parts[2]){ const ts = document.getElementById('trackSelect'); if (ts) { try { ts.value = decodeURIComponent(parts[2]); } catch(e){} } }
      requestAnimationFrame(function(){ const t = document.getElementById(parts[1]); if (t) t.scrollIntoView({ behavior:'smooth', block:'center' }); });
    }
    if (parts[1]){
      const card = document.querySelector('#view-' + parts[0] + ' .gen-card[data-gen="' + parts[1] + '"]');
      if (card) card.click();
    }
    if (typeof EXAMS !== 'undefined'){   // محرك الامتحانات موجود فقط بصفحة الامتحانات
    if (parts[0] === 'exams' && parts[1] === '2010' && parts[2] === 'angle') openAngleExam();
    else if (!document.getElementById('angleExam').hidden) closeAngleExam();
    if (parts[0] === 'exams' && parts[1] === '2010' && parts[2] === 'piecewise') openPwExam();
    else if (!document.getElementById('pwExam').hidden) closePwExam();
    const exId = (parts[0] === 'exams' && parts[2] && EXAMS[parts[2]] && (EXAMS[parts[2]].gen || '2010') === parts[1]) ? parts[2] : null;
    Object.keys(EXAMS).forEach(function(id){ if (id !== exId && !document.getElementById('ex-' + id).hidden) exClose(id); });
    if (exId && EXAMS[exId]) exOpen(exId);
    }
  }
  // نحدّث الرابط عند اختيار الجيل أو الرجوع منه
  document.querySelectorAll('.gen-card').forEach(function(btn){
    btn.addEventListener('click', function(){
      const view = btn.closest('.view');
      if (!view) return;
      try { history.replaceState(history.state, '', '#' + view.id.replace('view-', '') + '/' + btn.dataset.gen); } catch(e){}
    });
  });
  document.querySelectorAll('.gen-back').forEach(function(btn){
    btn.addEventListener('click', function(){
      const view = btn.closest('.view');
      if (!view) return;
      try { history.replaceState(history.state, '', '#' + view.id.replace('view-', '')); } catch(e){}
    });
  });
  window.addEventListener('popstate', routeFromHash);
  window.addEventListener('hashchange', routeFromHash);
  if (document.getElementById('siteContent').classList.contains('unlocked')) routeFromHash();
