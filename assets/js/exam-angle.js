  // ===== امتحان قياس الزاوية بالراديان (10 أسئلة × علامة = 10) =====
  const ANGLE_KEY = ['c','b','d','b','b','a','a','d','b','c'];
  let angleAns = [];
  (function(){
    document.querySelectorAll('#qxQuestions .qx-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        const q = +btn.dataset.q;
        angleAns[q] = btn.dataset.o;
        document.querySelectorAll('#qxQuestions .qx-opt[data-q="' + q + '"]').forEach(function(b){ b.classList.toggle('sel', b === btn); });
        document.getElementById('qxMsg').textContent = '';
      });
    });
  })();
  function openAngleExam(){
    try { history.replaceState(history.state, '', '#exams/2010/angle'); } catch(e){}
    angleAns = [];
    document.querySelectorAll('#qxQuestions .qx-opt').forEach(function(b){ b.classList.remove('sel'); });
    document.getElementById('qxMsg').textContent = '';
    document.getElementById('qxBody').hidden = false;
    document.getElementById('qxResult').hidden = true;
    const ex = document.getElementById('angleExam');
    ex.hidden = false; ex.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    const sv = examGetSaved('angle'); if (sv){ angleAns = sv.a; submitAngleExam(true); }
  }
  function closeAngleExam(){
    if (location.hash === '#exams/2010/angle') { try { history.replaceState(history.state, '', '#exams/2010'); } catch(e){} }
    document.getElementById('angleExam').hidden = true;
    document.body.style.overflow = '';
  }
  function submitAngleExam(replay){
    if (!replay && examGetSaved('angle')) return;
    let left = 0;
    for (let i = 0; i < ANGLE_KEY.length; i++) if (!angleAns[i]) left++;
    if (!replay && left && !confirm('بقي ' + left + ' سؤال بلا إجابة. هل تريد إنهاء الامتحان؟')) {
      document.getElementById('qxMsg').textContent = 'أجب عن جميع الأسئلة قبل الإنهاء.';
      return;
    }
    let score = 0;
    for (let i = 0; i < ANGLE_KEY.length; i++) if (angleAns[i] === ANGLE_KEY[i]) score += 1;
    // تسجيل العلامة بالشيت جنب اسم الطالب (نفس أعمدة الشيت الحالية)
    if (!replay) try {
      examSetSaved('angle', angleAns, ANGLE_KEY.length);
      const u = getSessionUser() || {};
      sendToSheet({
        المصدر: 'امتحان إلكتروني',
        الاسم: u.name || '',
        الجوال: u.phone || '',
        'الجيل/الفرع': u.track || '',
        الحالة: 'أنهى الامتحان',
        الرسالة: 'امتحان قياس الزاوية بالراديان (الوحدة الثانية 2010)',
        العلامة: score + ' / 10',
        التاريخ: new Date().toLocaleString('ar-JO')
      }).catch(function(err){ console.warn('تعذر إرسال العلامة للشيت:', err); });
    } catch(err){ console.warn(err); }
    document.getElementById('qxScore').textContent = score;
    document.getElementById('qxNote').textContent = score >= 8 ? 'ممتاز، أحسنت!' : score >= 5 ? 'جيد، راجع الأسئلة التي أخطأت فيها.' : 'راجع الدرس وإجاباتك أدناه.';
    // مراجعة الإجابات: الصح والغلط والجواب الصحيح
    (function(){
      const rv = document.getElementById('qxReview');
      rv.innerHTML = '<h3>مراجعة إجاباتك</h3><p style="margin:6px 0 14px;opacity:.85">تم تسليم هذا الامتحان — محاولة واحدة فقط، ولا يمكن إعادته.</p>';
      const clone = document.getElementById('qxQuestions').cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('.qx-opt').forEach(function(b){ b.classList.remove('sel'); b.disabled = true; });
      clone.querySelectorAll('.qx-q').forEach(function(qEl, i){
        const key = ANGLE_KEY[i], mine = angleAns[i];
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
    document.getElementById('qxBody').hidden = true;
    document.getElementById('qxResult').hidden = false;
    document.getElementById('angleExam').scrollTop = 0;
  }
