// Bookings module
(function(NS){
  NS.bookings = {
    state:{ page:1, pageSize:10, q:'', status:'', total:0 },
    async render(c){
      const biz = NS.state.currentBusiness; const cfg = window.SUNGET_BIZ_CONFIG[NS.state.businessType];
      if(!biz){ NS.showEmptyBusinessState(); return; }
      c.innerHTML = `
        <div class="page-title"><h1>الحجوزات</h1></div>
        <div class="card">
          <div class="row" style="margin-bottom:12px">
            <input id="bk-search" class="search" placeholder="بحث بالعميل..." style="max-width:260px;padding:8px 12px;background:var(--surface);border:1px solid var(--border-dim);border-radius:12px;color:var(--text)">
            <select id="bk-status" style="padding:9px 12px;background:var(--surface);border:1px solid var(--border-dim);border-radius:12px;color:var(--text)">
              <option value="">كل الحالات</option><option value="pending">قيد الانتظار</option>
              <option value="confirmed">مؤكد</option><option value="completed">مكتمل</option>
              <option value="rejected">مرفوض</option><option value="cancelled">ملغي</option>
            </select>
            <div class="spacer"></div>
            <button class="btn" id="bk-reload"><i class="fas fa-rotate"></i></button>
          </div>
          <div class="table-wrap"><table id="bk-table"><thead><tr>
            <th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الدفع</th><th>الحالة</th><th>إجراءات</th>
          </tr></thead><tbody><tr><td colspan="6"><div class="skeleton" style="height:60px"></div></td></tr></tbody></table></div>
          <div class="row" style="margin-top:12px;justify-content:center;gap:6px" id="bk-pager"></div>
        </div>`;
      const $ = s=>c.querySelector(s);
      const load = ()=> this.load(c);
      $('#bk-search').oninput = e => { this.state.q = e.target.value.trim(); this.state.page=1; load(); };
      $('#bk-status').onchange = e => { this.state.status = e.target.value; this.state.page=1; load(); };
      $('#bk-reload').onclick = load;
      this.load(c);
    },
    async load(c){
      const s = this.state;
      const biz = NS.state.currentBusiness; const cfg = window.SUNGET_BIZ_CONFIG[NS.state.businessType]; const fk = cfg.foreignKey;
      let q = window.sb.from('bookings').select('*',{count:'exact'}).eq(fk, biz.id);
      if(s.status) q = q.eq('status', s.status);
      if(s.q)      q = q.ilike('customer_name', `%${s.q}%`);
      q = q.order('created_at',{ascending:false}).range((s.page-1)*s.pageSize, s.page*s.pageSize -1);
      const { data, count, error } = await q;
      const tbody = c.querySelector('#bk-table tbody');
      if(error){ tbody.innerHTML = `<tr><td colspan="6" class="empty">تعذر التحميل</td></tr>`; return; }
      s.total = count||0;
      tbody.innerHTML = (data||[]).map(b=>row(b)).join('') || `<tr><td colspan="6" class="empty">لا توجد حجوزات</td></tr>`;
      c.querySelectorAll('[data-act]').forEach(btn => btn.onclick = ()=>this.action(btn.dataset.id, btn.dataset.act, c));
      c.querySelector('#bk-pager').innerHTML = pager(s);
      c.querySelectorAll('#bk-pager button').forEach(b=>b.onclick=()=>{ this.state.page = +b.dataset.p; this.load(c); });
    },
    async action(id, act, c){
      const map = {confirm:'confirmed',reject:'rejected',complete:'completed'};
      const { error } = await window.sb.from('bookings').update({status: map[act]}).eq('id', id);
      if(error) return NS.toast('فشل التحديث','error');
      NS.toast('تم التحديث','success'); this.load(c);
    }
  };
  function row(b){
    const st = b.status||'pending';
    const badgeMap = {pending:['warn','قيد الانتظار'],confirmed:['success','مؤكد'],completed:['info','مكتمل'],rejected:['danger','مرفوض'],cancelled:['danger','ملغي']};
    const [bc,bl] = badgeMap[st]||['info',st];
    return `<tr>
      <td>${escapeHtml(b.customer_name||'—')}</td>
      <td>${NS.fmt.date(b.check_in||b.date||b.created_at)}</td>
      <td>${NS.fmt.money(b.total)}</td>
      <td>${escapeHtml(b.payment_method||'—')}</td>
      <td><span class="badge ${bc}">${bl}</span></td>
      <td class="row">
        ${st==='pending' ? `<button class="btn sm primary" data-act="confirm" data-id="${b.id}">تأكيد</button><button class="btn sm danger" data-act="reject" data-id="${b.id}">رفض</button>` : ''}
        ${st==='confirmed' ? `<button class="btn sm" data-act="complete" data-id="${b.id}">إكمال</button>` : ''}
      </td>
    </tr>`;
  }
  function pager(s){
    const pages = Math.max(1, Math.ceil(s.total/s.pageSize));
    if(pages<=1) return '';
    let out='';
    for(let i=1;i<=pages;i++) out += `<button class="btn sm ${i===s.page?'primary':''}" data-p="${i}">${i}</button>`;
    return out;
  }
})(window.SUNGET);
