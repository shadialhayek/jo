  // ===== مواعيد فتح الامتحانات + عدّاد تنازلي =====
  // الامتحان بيظهر للطلاب دايماً بس بيضل مقفول ويطلع عدّاد لحد ما يحين وقته (بتوقيت الأردن).
  // لتغيير الموعد: عدّل data-opens على كرت الامتحان بـ exams.html (بصيغة 2026-10-28T11:00:00+03:00).
  (function(){
    // الوقت من سيرفر الموقع (مش من ساعة الجهاز) عشان ما يقدر الطالب يغيّر ساعة جهازه ويفتح الامتحان بدري
    var offset = 0;   // serverNow - deviceNow (ms)
    function syncClock(){
      try {
        var t0 = Date.now();
        fetch(location.pathname + (location.search || ''), { method: 'HEAD', cache: 'no-store' }).then(function(r){
          var d = r.headers.get('Date'); if (!d) return;
          var t1 = Date.now(), srv = new Date(d).getTime();
          if (isNaN(srv)) return;
          offset = srv - (t0 + t1) / 2; tick();
        }).catch(function(){});
      } catch(e){}
    }
    function now(){ return Date.now() + offset; }

    function cards(){ return document.querySelectorAll('.item-card[data-opens]'); }
    function openAt(card){ return new Date(card.getAttribute('data-opens')).getTime(); }
    function pad(n){ return (n < 10 ? '0' : '') + n; }

    // بيستخدمه exOpen() بمحرك الامتحانات
    window.examIsLocked = function(id){
      var el = document.querySelector('.item-card[data-exam="' + id + '"][data-opens]');
      return !!el && now() < openAt(el);
    };

    function tick(){
      cards().forEach(function(card){
        var left = openAt(card) - now();
        var cd = card.querySelector('.exam-cd'), btn = card.querySelector('a.item-card-btn');
        if (left > 0){
          var s = Math.floor(left / 1000);
          var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
          var v = { d: d, h: pad(h), m: pad(m), s: pad(sec) };
          Object.keys(v).forEach(function(k){ var el = cd.querySelector('[data-u="' + k + '"]'); if (el) el.textContent = v[k]; });
          if (!card.classList.contains('is-locked')){
            card.classList.add('is-locked'); cd.hidden = false;
            if (btn){ btn.textContent = '🔒 يفتح قريبًا'; btn.setAttribute('aria-disabled', 'true'); }
          }
        } else if (card.classList.contains('is-locked') || !card.classList.contains('is-open')){
          card.classList.remove('is-locked'); card.classList.add('is-open');
          var box = cd.querySelector('.exam-cd-boxes'); if (box) box.hidden = true;
          var w = cd.querySelector('.exam-cd-when'); if (w) w.textContent = '✓ الامتحان مفتوح الآن — بالتوفيق!';
          cd.hidden = false;
          if (btn){ btn.textContent = 'ابدأ الامتحان ›'; btn.removeAttribute('aria-disabled'); }
        }
      });
    }
    // قبل visited.js: ضغطة على امتحان مقفول ما بتنحسب "تم الفتح" وما بتفتح شي
    document.addEventListener('click', function(e){
      var btn = e.target.closest && e.target.closest('.item-card.is-locked .item-card-btn');
      if (btn){ e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    tick(); setInterval(tick, 1000);
    syncClock();
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) syncClock(); });
  })();
