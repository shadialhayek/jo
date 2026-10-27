  // ===== البث المباشر (لايف فيسبوك) =====
  // api: رابط Apps Script الخاص بالبث (انظر live-apps-script.gs) | manualUrl: للتجربة فقط
  const LIVE_CONFIG = { api: "", manualUrl: "" };
  (function(){
    const sid = Math.random().toString(36).slice(2), $ = id => document.getElementById(id) || document.createElement('div');
    let current = '';
    function render(st){
      const on = !!(st && st.live && st.url);
      $('liveNav').classList.toggle('on', on); $('mLiveNav').classList.toggle('on', on);
      $('livePill').hidden = !on;
      $('liveBadge').classList.toggle('on', on);
      $('liveBadge').textContent = on ? '● مباشر الآن' : '○ غير مباشر';
      $('liveOff').hidden = on; $('liveFrame').hidden = !on;
      $('liveTitle').textContent = (st && st.title) || 'البث المباشر';
      $('liveCount').hidden = !(on && typeof st.count === 'number');
      if (on && typeof st.count === 'number') $('liveNum').textContent = st.count;
      if (on && st.url !== current){
        current = st.url;
        $('liveFrame').innerHTML = '<iframe src="https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(st.url) + '&show_text=false&autoplay=true" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
      }
      if (!on && current){ current = ''; $('liveFrame').innerHTML = ''; }
    }
    async function tick(){
      try{
        if (LIVE_CONFIG.api){
          const watching = !!document.getElementById('view-live') && !$('view-live').hidden && !document.hidden;
          const r = await fetch(LIVE_CONFIG.api + '?sid=' + sid + (watching ? '&watch=1' : ''));
          render(await r.json());
        } else render(LIVE_CONFIG.manualUrl ? { live:true, url:LIVE_CONFIG.manualUrl } : null);
      } catch(e){ console.warn('live status error', e); }
    }
    tick(); setInterval(tick, 30000);
  })();
