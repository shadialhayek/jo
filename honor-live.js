// ===== لوحة الشرف الحية =====
// بتجيب من السيرفر (لوحة الأدمن) الطلاب اللي معدلهم العام (متوسط كل امتحاناتهم) 75% فأكثر،
// وبتستبدل القائمة تلقائياً. إذا فشل الاتصال بتضل القائمة القديمة ظاهرة.
(function(){
  var API = (window.StudentAccountConfig && window.StudentAccountConfig.api) || 'https://162-35-38-7.sslip.io';
  var body = document.getElementById('rankingBody');
  if (!body) return;

  function fmt(n){ n = Math.round(Number(n) * 10) / 10; return String(n).replace(/\.0$/, ''); }

  function render(list){
    var frag = document.createDocumentFragment();
    list.forEach(function(s){
      var tr = document.createElement('tr');
      tr.setAttribute('data-name', s.name);
      var a = document.createElement('td'); a.textContent = s.name;
      var b = document.createElement('td'); b.textContent = fmt(s.avg) + '/100';
      tr.appendChild(a); tr.appendChild(b); frag.appendChild(tr);
    });
    body.innerHTML = '';
    body.appendChild(frag);
    var input = document.getElementById('rankingSearch');
    if (input) input.dispatchEvent(new Event('input'));     // يحدّث العدّاد والفلترة
  }

  var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = setTimeout(function(){ if (ctrl) ctrl.abort(); }, 12000);
  fetch(API + '/api/honor', ctrl ? { signal: ctrl.signal } : {})
    .then(function(r){ return r.json(); })
    .then(function(d){
      clearTimeout(timer);
      if (d && d.ok && Array.isArray(d.students) && d.students.length) render(d.students);
    })
    .catch(function(){ clearTimeout(timer); });
})();
