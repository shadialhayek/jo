  // ===== محرك الاختبارات الإلكترونية (علامة لكل سؤال) =====
  const EXAMS = {"unit2": {"key": ["c", "b", "c", "b", "c", "b", "d", "c", "a", "b", "c", "d", "b", "b", "d"], "sheet": "امتحان الوحدة الثانية — الاقترانات المثلثية (2010)", "title": "امتحان الوحدة الثانية — الاقترانات المثلثية"}, "trig3": {"key": ["a", "c", "b", "b", "a", "c", "a", "d", "b", "c", "b"], "sheet": "امتحان الدرس الثالث — تمثيل الاقترانات المثلثية بيانيًا (الوحدة الثانية 2010)", "title": "امتحان الدرس الثالث — تمثيل الاقترانات المثلثية بيانيًا"}, "g10-mid": {"key": ["a", "c", "a", "d", "b", "b", "b", "d", "c", "d", "c", "c", "d", "c", "b", "c"], "sheet": "امتحان نصف الفصل — المعادلات والدائرة (الصف العاشر 2011)", "title": "امتحان نصف الفصل — وحدتا المعادلات والدائرة", "gen": "2011"}, "g10-u2": {"key": ["d", "d", "c", "a", "b", "c", "c", "a", "b", "a", "a", "b", "c", "d", "c", "b", "c"], "sheet": "امتحان الوحدة الثانية — الدائرة (الصف العاشر 2011)", "title": "امتحان الوحدة الثانية — الدائرة", "gen": "2011"}, "g10-u1": {"key": ["c", "a", "d", "a", "b", "d", "a", "c", "c", "a"], "sheet": "امتحان الوحدة الأولى — المعادلات (الصف العاشر 2011)", "title": "امتحان الوحدة الأولى — المعادلات", "gen": "2011"}, "unit2-2009": {"key": ["c", "d", "a", "a", "c", "c", "b", "a", "c", "c", "b"], "sheet": "امتحان الوحدة الثانية — المتطابقات المثلثية (2009)", "title": "اختبار الوحدة الثانية — المتطابقات المثلثية", "gen": "2009"}, "remainder-2009": {"key": ["d", "b", "c", "a", "c", "d", "a", "b"], "sheet": "اختبار الدرس الأول — نظريتا الباقي والعوامل (الوحدة الأولى 2009)", "title": "اختبار الدرس الأول — نظريتا الباقي والعوامل", "gen": "2009"}, "partial-2009": {"key": ["a", "c", "b", "c", "b", "d", "a"], "sheet": "اختبار الدرس الثاني — الكسور الجزئية (الوحدة الأولى 2009)", "title": "اختبار الدرس الثاني — الكسور الجزئية", "gen": "2009"}, "trig2": {"key": ["b", "b", "d", "c", "a", "b", "d", "d", "a"], "sheet": "اختبار الدرس الثاني — الاقترانات المثلثية (الوحدة الثانية 2010)", "title": "اختبار الدرس الثاني — الاقترانات المثلثية"}, "unit1-2009": {"key": ["c", "d", "a", "b", "b", "d", "c", "a", "b", "b", "c", "a", "d", "c", "a", "a"], "sheet": "امتحان الوحدة الأولى — الاقترانات والمقادير الجبرية (2009)", "title": "امتحان الوحدة الأولى — الاقترانات والمقادير الجبرية", "gen": "2009"}, "abs": {"key": ["c", "a", "d", "a", "d", "b", "c", "d", "b", "d", "a", "b"], "sheet": "اختبار الدرس الثاني — القيمة المطلقة (الوحدة الأولى 2010)", "title": "اختبار الدرس الثاني — حل معادلات القيمة المطلقة ومتبايناتها"}, "remainder": {"key": ["d", "b", "c", "a", "c", "d", "a", "b"], "sheet": "اختبار الدرس الثالث — نظريتا الباقي والعوامل (الوحدة الأولى 2010)", "title": "اختبار الدرس الثالث — نظريتا الباقي والعوامل"}, "partial": {"key": ["a", "c", "b", "c", "b", "d", "a"], "sheet": "اختبار الدرس الرابع — الكسور الجزئية (الوحدة الأولى 2010)", "title": "اختبار الدرس الرابع — الكسور الجزئية"}, "unit1": {"key": ["c", "a", "d", "a", "a", "b", "d", "a", "c", "b", "a", "c", "c", "b", "b", "a", "c", "a", "b", "c", "b", "a", "b", "a"], "sheet": "امتحان الوحدة الأولى — الاقترانات والمقادير الجبرية (2010)", "title": "امتحان الوحدة الأولى — الاقترانات والمقادير الجبرية"}};
  Object.keys(EXAMS).forEach(function(id){
    const ex = EXAMS[id]; ex.ans = [];
    const d = document.getElementById('ex-' + id);
    d.querySelectorAll('.ex-questions .qx-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        const q = +btn.dataset.q;
        ex.ans[q] = btn.dataset.o;
        d.querySelectorAll('.ex-questions .qx-opt[data-q="' + q + '"]').forEach(function(b){ b.classList.toggle('sel', b === btn); });
        d.querySelector('.ex-msg').textContent = '';
      });
    });
  });
  function exOpen(id){
    if (examNeedLogin(function(){ exOpen(id); })) return;
    if (typeof examIsLocked === 'function' && examIsLocked(id)) return;   // لسه ما حان موعده
    // امتحان من الداشبورد انبنى وهو مقفول (السيرفر بعته بدون أسئلة): نجلب الأسئلة أول، وبعدين نفتحه
    if (EXAMS[id] && EXAMS[id].cx && !EXAMS[id].key.length){
      if (typeof window.cxRefreshNow === 'function'){
        window.cxRefreshNow().then(function(){
          if (EXAMS[id] && EXAMS[id].key.length) exOpen(id);
          else alert('تعذّر تحميل أسئلة الامتحان. تأكد من الإنترنت وجرّب مرة ثانية.');
        });
      } else alert('الأسئلة لسا ما نزلت. حدّث الصفحة وجرّب مرة ثانية.');
      return;
    }
    const ex = EXAMS[id], d = document.getElementById('ex-' + id);
    try { history.replaceState(history.state, '', '#exams/' + (ex.gen||'2010') + '/' + id); } catch(e){}
    ex.ans = [];
    d.querySelectorAll('.ex-questions .qx-opt').forEach(function(b){ b.classList.remove('sel'); });
    d.querySelector('.ex-msg').textContent = '';
    d.querySelector('.ex-review').innerHTML = '';
    d.querySelector('.ex-body').hidden = false;
    d.querySelector('.ex-result').hidden = true;
    d.hidden = false; d.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    const sv = examGetSaved(id); if (sv){ ex.ans = sv.a; exSubmit(id, true); }
  }
  function exClose(id){
    const g = EXAMS[id].gen || '2010';
    if (location.hash === '#exams/' + g + '/' + id) { try { history.replaceState(history.state, '', '#exams/' + g); } catch(e){} }
    document.getElementById('ex-' + id).hidden = true;
    document.body.style.overflow = '';
  }
  function exSubmit(id, replay){
    const ex = EXAMS[id], d = document.getElementById('ex-' + id), n = ex.key.length;
    if (!replay && examGetSaved(id)) return;
    if (!replay && examNeedLogin()) return;
    let left = 0;
    for (let i = 0; i < n; i++) if (!ex.ans[i]) left++;
    if (!replay && left && !confirm('بقي ' + left + ' سؤال بلا إجابة. هل تريد إنهاء الاختبار؟')) {
      d.querySelector('.ex-msg').textContent = 'أجب عن جميع الأسئلة قبل الإنهاء.';
      return;
    }
    let score = 0;
    for (let i = 0; i < n; i++) if (ex.ans[i] === ex.key[i]) score += 1;
    const ns = replay ? examGetSaved(id) : null, noAns = !!(ns && ns.ns);   // تسليم مسجّل عند السيرفر بدون إجابات
    if (noAns) score = ns.sc;
    if (!replay) try {
      examSetSaved(id, ex.ans, n);
      const u = getSessionUser() || {};
      sendToSheet({
        المصدر: 'امتحان إلكتروني',
        الاسم: u.name || '',
        الجوال: u.phone || '',
        'الجيل/الفرع': u.track || '',
        الحالة: 'أنهى الامتحان',
        الرسالة: ex.sheet,
        العلامة: score + ' / ' + n,
        التاريخ: new Date().toLocaleString('ar-JO')
      }).catch(function(err){ console.warn('تعذر إرسال العلامة للشيت:', err); });
    } catch(err){ console.warn(err); }
    d.querySelector('.ex-score').textContent = score;
    const pct = score / n;
    d.querySelector('.ex-note').textContent = pct >= 0.8 ? 'ممتاز، أحسنت!' : pct >= 0.5 ? 'جيد، راجع الأسئلة التي أخطأت فيها.' : 'راجع الدرس وإجاباتك أدناه.';
    const rv = d.querySelector('.ex-review');
    rv.innerHTML = '<h3>مراجعة إجاباتك</h3><p style="margin:6px 0 14px;opacity:.85">تم تسليم هذا الامتحان — محاولة واحدة فقط، ولا يمكن إعادته.' + (noAns ? ' (إجاباتك ما انحفظت على هذا الجهاز، بنعرض لك علامتك والإجابات الصحيحة.)' : '') + '</p>';
    const clone = d.querySelector('.ex-questions').cloneNode(true);
    clone.classList.remove('ex-questions');
    clone.querySelectorAll('.qx-opt').forEach(function(b){ b.classList.remove('sel'); b.disabled = true; });
    clone.querySelectorAll('.qx-q').forEach(function(qEl, i){
      const key = ex.key[i], mine = ex.ans[i];
      qEl.querySelectorAll('.qx-opt').forEach(function(b){
        if (b.dataset.o === key) b.classList.add('ok');
        else if (!noAns && b.dataset.o === mine) b.classList.add('bad');
      });
      const fb = document.createElement('div');
      if (noAns){
        fb.className = 'qx-fb ok';
        fb.innerHTML = 'الإجابة الصحيحة: <bdi dir="ltr">' + key + '</bdi>';
      } else if (mine === key){
        fb.className = 'qx-fb ok';
        fb.textContent = '✓ إجابتك صحيحة (' + key + ')';
      } else {
        fb.className = 'qx-fb bad';
        fb.innerHTML = (mine ? '✗ إجابتك خاطئة (<bdi dir="ltr">' + mine + '</bdi>)' : '✗ لم تجب عن هذا السؤال') + ' — الإجابة الصحيحة: <bdi dir="ltr">' + key + '</bdi>';
      }
      qEl.appendChild(fb);
      if (ex.notes && ex.notes[i]){ const nt = document.createElement('div'); nt.className = 'qx-fb'; nt.style.cssText = 'opacity:.92;margin-top:6px'; nt.textContent = '💡 ' + ex.notes[i]; qEl.appendChild(nt); }
    });
    rv.appendChild(clone);
    d.querySelector('.ex-body').hidden = true;
    d.querySelector('.ex-result').hidden = false;
    d.scrollTop = 0;
  }
