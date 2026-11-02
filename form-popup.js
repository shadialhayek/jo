  // ===== بوب أب فورم اللقاء مع الأستاذ شادي الحايك =====
  // يظهر بعد 3 ثواني من دخول الطالب للموقع، ويختفي لحاله بعد تاريخ الانتهاء بدون أي تعديل.
  // لتغيير المدة: عدّل التاريخ بالسطر التالي فقط (بتوقيت الأردن +03:00).
  (function(){
    var FORM_POPUP_END   = '2026-10-23T00:00:00+03:00';
    var FORM_POPUP_DELAY = 3000;
    var pop = document.getElementById('formPop');
    var site = document.getElementById('siteContent');
    if (!pop || !site) return;
    var test = false;
    try { test = new URLSearchParams(location.search).has('testform'); } catch(e){}   // للمعاينة: ?testform=1
    var timer = null, shown = false;

    function userKey(){
      var u = null; try { u = (typeof getSessionUser === 'function') ? getSessionUser() : null; } catch(e){}
      return 'ao_form_done_' + ((u && u.phone) || 'anon');
    }
    function expired(){ return !test && Date.now() >= new Date(FORM_POPUP_END).getTime(); }
    function isDone(){ try { return !test && getRemembered(userKey()) === '1'; } catch(e){ return false; } }
    function markDone(){ try { safeStorageSet(userKey(), '1'); setCookie(userKey(), '1', 30); } catch(e){} }
    function hide(){ pop.hidden = true; }
    function examOpen(){ return !!document.querySelector('.qx:not([hidden])'); }

    function tryShow(){
      if (shown || expired() || isDone()) return;
      if (!site.classList.contains('unlocked')) return;
      if (examOpen()){ timer = setTimeout(tryShow, 5000); return; }   // ما نقاطع طالب وهو بالامتحان
      shown = true; pop.hidden = false;
      var go = document.getElementById('formPopGo'); if (go) go.focus();
    }
    function schedule(){
      clearTimeout(timer); shown = false;
      if (expired() || isDone()) return;
      timer = setTimeout(tryShow, FORM_POPUP_DELAY);
    }

    document.getElementById('formPopClose').addEventListener('click', hide);          // ✕ : يسكّره (بيرجع بالزيارة الجاية)
    pop.addEventListener('click', function(e){ if (e.target === pop) hide(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !pop.hidden) hide(); });
    document.getElementById('formPopGo').addEventListener('click', function(){ markDone(); hide(); });  // عبّى الفورم: ما بيظهر ثاني

    var wasUnlocked = site.classList.contains('unlocked');
    if (wasUnlocked) schedule();
    new MutationObserver(function(){
      var now = site.classList.contains('unlocked');
      if (now && !wasUnlocked) schedule();
      if (!now){ clearTimeout(timer); hide(); }
      wasUnlocked = now;
    }).observe(site, { attributes: true, attributeFilter: ['class'] });
  })();
