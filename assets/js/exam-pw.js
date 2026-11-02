  // ===== اختبار الدرس الأول — الاقترانات المتشعبة (12 سؤال × علامة = 12) =====
  const PW_KEY = ['c','d','d','c','d','c','c','a','d','a','b','b'];
  let pwAns = [];
  (function(){
    document.querySelectorAll('#pwQuestions .qx-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        const q = +btn.dataset.q;
        pwAns[q] = btn.dataset.o;
        document.querySelectorAll('#pwQuestions .qx-opt[data-q="' + q + '"]').forEach(function(b){ b.classList.toggle('sel', b === btn); });
        document.getElementById('pwMsg').textContent = '';
      });
    });
  })();
  function openPwExam(){
    try { history.replaceState(history.state, '', '#exams/2010/piecewise'); } catch(e){}
    pwAns = [];
    document.querySelectorAll('#pwQuestions .qx-opt').forEach(function(b){ b.classList.remove('sel'); });
    document.getElementById('pwMsg').textContent = '';
    document.getElementById('pwBody').hidden = false;
    document.getElementById('pwResult').hidden = true;
    const ex = document.getElementById('pwExam');
    ex.hidden = false; ex.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    const sv = examGetSaved('piecewise'); if (sv){ pwAns = sv.a; submitPwExam(true); }
  }
  function closePwExam(){
    if (location.hash === '#exams/2010/piecewise') { try { history.replaceState(history.state, '', '#exams/2010'); } catch(e){} }
    document.getElementById('pwExam').hidden = true;
    document.body.style.overflow = '';
  }
  function submitPwExam(replay){
    if (!replay && examGetSaved('piecewise')) return;
    let left = 0;
    for (let i = 0; i < PW_KEY.length; i++) if (!pwAns[i]) left++;
    if (!replay && left && !confirm('بقي ' + left + ' سؤال بلا إجابة. هل تريد إنهاء الاختبار؟')) {
      document.getElementById('pwMsg').textContent = 'أجب عن جميع الأسئلة قبل الإنهاء.';
      return;
    }
    let score = 0;
    for (let i = 0; i < PW_KEY.length; i++) if (pwAns[i] === PW_KEY[i]) score += 1;
    if (!replay) try {
      examSetSaved('piecewise', pwAns, PW_KEY.length);
      const u = getSessionUser() || {};
      sendToSheet({
        المصدر: 'امتحان إلكتروني',
        الاسم: u.name || '',
        الجوال: u.phone || '',
        'الجيل/الفرع': u.track || '',
        الحالة: 'أنهى الامتحان',
        الرسالة: 'اختبار الدرس الأول — الاقترانات المتشعبة (الوحدة الأولى 2010)',
        العلامة: score + ' / 12',
        التاريخ: new Date().toLocaleString('ar-JO')
      }).catch(function(err){ console.warn('تعذر إرسال العلامة للشيت:', err); });
    } catch(err){ console.warn(err); }
    document.getElementById('pwScore').textContent = score;
    const pct = score / PW_KEY.length;
    document.getElementById('pwNote').textContent = pct >= 0.8 ? 'ممتاز، أحسنت!' : pct >= 0.5 ? 'جيد، راجع الأسئلة التي أخطأت فيها.' : 'راجع الدرس وإجاباتك أدناه.';
    // مراجعة الإجابات: الصح والغلط والجواب الصحيح
    (function(){
      const rv = document.getElementById('pwReview');
      rv.innerHTML = '<h3>مراجعة إجاباتك</h3><p style="margin:6px 0 14px;opacity:.85">تم تسليم هذا الامتحان — محاولة واحدة فقط، ولا يمكن إعادته.</p>';
      const clone = document.getElementById('pwQuestions').cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('.qx-opt').forEach(function(b){ b.classList.remove('sel'); b.disabled = true; });
      clone.querySelectorAll('.qx-q').forEach(function(qEl, i){
        const key = PW_KEY[i], mine = pwAns[i];
        qEl.querySelectorAll('.qx-opt').forEach(function(b){
          if (b.dataset.o === key) b.classList.add('ok');
          else if (b.dataset.o === mine) b.classList.add('bad');
        });
        const fb = document.createElement('div');
        if (mine === key){
          fb.className = 'qx-fb ok';
          fb.textContent = '✓ إجابتك صحيحة (' + key + ')';
        } else {
          fb.className = 'qx-fb bad';
          fb.innerHTML = (mine ? '✗ إجابتك خاطئة (<bdi dir="ltr">' + mine + '</bdi>)' : '✗ لم تجب عن هذا السؤال') + ' — الإجابة الصحيحة: <bdi dir="ltr">' + key + '</bdi>';
        }
        qEl.appendChild(fb);
      });
      rv.appendChild(clone);
    })();
    document.getElementById('pwBody').hidden = true;
    document.getElementById('pwResult').hidden = false;
    document.getElementById('pwExam').scrollTop = 0;
  }
