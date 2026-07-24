(function(NS){
  NS.charts = {
    async miniBookings(canvasId, bizId, fk){
      const el = document.getElementById(canvasId); if(!el || !window.Chart) return;
      const since = new Date(); since.setMonth(since.getMonth()-5); since.setDate(1);
      const { data } = await window.sb.from('bookings').select('created_at, total').eq(fk, bizId).gte('created_at', since.toISOString());
      const buckets = {}; for(let i=0;i<6;i++){ const d=new Date(since); d.setMonth(since.getMonth()+i); buckets[key(d)]={c:0,r:0}; }
      (data||[]).forEach(b=>{ const k=key(new Date(b.created_at)); if(buckets[k]){ buckets[k].c++; buckets[k].r+=Number(b.total||0);} });
      const labels = Object.keys(buckets);
      new Chart(el,{type:'line',data:{labels,datasets:[{label:'حجوزات',data:labels.map(k=>buckets[k].c),borderColor:'#ffb400',backgroundColor:'rgba(255,180,0,.15)',tension:.4,fill:true}]},options:opts()});
    },
    async render(c){
      const biz = NS.state.currentBusiness; const cfg = window.SUNGET_BIZ_CONFIG[NS.state.businessType]; const fk = cfg.foreignKey;
      if(!biz){ NS.showEmptyBusinessState(); return; }
      c.innerHTML = `<div class="page-title"><h1>الإحصائيات</h1></div>
        <div class="grid-2">
          <div class="card"><h3>الحجوزات شهريًا</h3><canvas id="c-bk"></canvas></div>
          <div class="card"><h3>الإيرادات</h3><canvas id="c-rev"></canvas></div>
        </div>
        <div class="grid-2">
          <div class="card"><h3>الزوار</h3><canvas id="c-vis"></canvas></div>
          <div class="card"><h3>التقييمات</h3><canvas id="c-rev2"></canvas></div>
        </div>`;
      const since = new Date(); since.setMonth(since.getMonth()-11); since.setDate(1);
      const safe = p => p.then(r=>r).catch(()=>({data:[]}));
      const [bk, vis, revs] = await Promise.all([
        safe(window.sb.from('bookings').select('created_at,total').eq(fk,biz.id).gte('created_at',since.toISOString())),
        safe(window.sb.from('visits').select('created_at').eq(fk,biz.id).gte('created_at',since.toISOString())),
        safe(window.sb.from('reviews').select('created_at,rating').eq(fk,biz.id).gte('created_at',since.toISOString())),
      ]);
      const buckets={}; for(let i=0;i<12;i++){const d=new Date(since);d.setMonth(since.getMonth()+i);buckets[key(d)]={bk:0,rev:0,vis:0,rt:0,rc:0};}
      (bk.data||[]).forEach(b=>{const k=key(new Date(b.created_at));if(buckets[k]){buckets[k].bk++;buckets[k].rev+=Number(b.total||0);}});
      (vis.data||[]).forEach(v=>{const k=key(new Date(v.created_at));if(buckets[k])buckets[k].vis++;});
      (revs.data||[]).forEach(r=>{const k=key(new Date(r.created_at));if(buckets[k]){buckets[k].rt+=Number(r.rating||0);buckets[k].rc++;}});
      const labels = Object.keys(buckets);
      new Chart(c.querySelector('#c-bk'),{type:'bar',data:{labels,datasets:[{label:'حجوزات',data:labels.map(k=>buckets[k].bk),backgroundColor:'#ffb400'}]},options:opts()});
      new Chart(c.querySelector('#c-rev'),{type:'line',data:{labels,datasets:[{label:'إيرادات',data:labels.map(k=>buckets[k].rev),borderColor:'#00e57a',backgroundColor:'rgba(0,229,122,.15)',tension:.4,fill:true}]},options:opts()});
      new Chart(c.querySelector('#c-vis'),{type:'line',data:{labels,datasets:[{label:'زوار',data:labels.map(k=>buckets[k].vis),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.15)',tension:.4,fill:true}]},options:opts()});
      new Chart(c.querySelector('#c-rev2'),{type:'bar',data:{labels,datasets:[{label:'متوسط تقييم',data:labels.map(k=>buckets[k].rc?(buckets[k].rt/buckets[k].rc).toFixed(2):0),backgroundColor:'#ff6a00'}]},options:opts()});
    }
  };
  function key(d){ return d.toLocaleString('ar-EG',{month:'short',year:'2-digit'}); }
  function opts(){ return {responsive:true,plugins:{legend:{labels:{color:'#8888aa'}}},scales:{x:{ticks:{color:'#8888aa'},grid:{color:'rgba(255,255,255,.05)'}},y:{ticks:{color:'#8888aa'},grid:{color:'rgba(255,255,255,.05)'}}}}; }
})(window.SUNGET);
