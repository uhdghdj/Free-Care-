// SUNGET — Dashboard core (shared across all business types)
window.SUNGET = window.SUNGET || {};
(function(NS){
  const sb = () => window.sb;
  const state = NS.state = { user:null, businessType:null, businesses:[], currentBusiness:null, page:'dashboard' };

  // ===== Utilities =====
  NS.toast = function(msg, type='info'){
    let wrap = document.querySelector('.toast-wrap');
    if(!wrap){ wrap = document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div'); t.className='toast '+type; t.textContent = msg;
    wrap.appendChild(t); setTimeout(()=>t.remove(), 3500);
  };
  NS.fmt = {
    money: v => (Number(v||0)).toLocaleString('ar-EG',{style:'currency',currency:'SAR'}),
    num:   v => (Number(v||0)).toLocaleString('ar-EG'),
    date:  v => v ? new Date(v).toLocaleDateString('ar-EG') : '—',
    time:  v => v ? new Date(v).toLocaleString('ar-EG') : '—',
  };
  NS.qs = (s,r=document)=>r.querySelector(s);
  NS.qsa = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // ===== Auth + business bootstrap =====
  NS.init = async function(businessType){
    state.businessType = businessType;
    const client = sb();
    if(!client){ NS.toast('Supabase غير مهيأ','error'); return; }

    const { data:{ user } } = await client.auth.getUser();
    if(!user){ location.href = 'signup.html'; return; }
    state.user = user;

    await NS.loadBusinesses();
    NS.renderSidebar();
    NS.renderTopbar();
    NS.bindNav();
    NS.bindTheme();
    NS.bindProfile();

    if(!state.currentBusiness){
      NS.showEmptyBusinessState();
      return;
    }
    NS.showPage('dashboard');
    NS.notifications && NS.notifications.init && NS.notifications.init();
  };

  // Load all businesses for current user with matching business type
  NS.loadBusinesses = async function(){
    const client = sb();
    const { data, error } = await client.from('providers')
      .select('*').eq('user_id', state.user.id).eq('business_type', state.businessType)
      .order('created_at',{ascending:true});
    if(error){ console.error(error); NS.toast('تعذر جلب المنشآت','error'); return; }
    state.businesses = data || [];
    const savedId = localStorage.getItem('sunget_current_biz_'+state.businessType);
    state.currentBusiness = state.businesses.find(b=>b.id===savedId) || state.businesses[0] || null;
  };

  NS.setCurrentBusiness = function(id){
    const b = state.businesses.find(x=>x.id===id);
    if(!b) return;
    state.currentBusiness = b;
    localStorage.setItem('sunget_current_biz_'+state.businessType, id);
    NS.renderTopbar();
    NS.showPage(state.page);
  };

  // ===== Sidebar =====
  NS.renderSidebar = function(){
    const cfg = window.SUNGET_BIZ_CONFIG[state.businessType];
    const menuHtml = [
      `<div class="logo"><div class="logo-badge">S</div><div class="logo-name">SUNGET</div></div>`,
      `<div class="nav-group-title">الرئيسية</div>`,
      ...window.SUNGET_CORE_MENU_TOP.map(item),
      cfg?`<div class="nav-group-title">${cfg.label}</div>`:'',
      ...(cfg?.extraMenu||[]).map(item),
      `<div class="nav-group-title">إدارة</div>`,
      ...window.SUNGET_CORE_MENU_BOTTOM.map(item),
      `<div class="nav-item" data-page="logout"><i class="fas fa-sign-out-alt"></i><span>تسجيل الخروج</span></div>`,
    ].join('');
    NS.qs('#sidebar').innerHTML = menuHtml;
    function item(m){ return `<div class="nav-item" data-page="${m.key}"><i class="fas ${m.icon}"></i><span>${m.label}</span></div>`; }
  };

  NS.renderTopbar = function(){
    const sel = NS.qs('#hotel-switcher-select');
    if(sel){
      sel.innerHTML = state.businesses.map(b=>`<option value="${b.id}" ${b.id===state.currentBusiness?.id?'selected':''}>${escapeHtml(b.name||'منشأة')}</option>`).join('')
        + `<option value="__add__">＋ إضافة منشأة جديدة</option>`;
      sel.onchange = e => {
        if(e.target.value==='__add__'){ location.href='my-businesses.html#add'; }
        else NS.setCurrentBusiness(e.target.value);
      };
    }
    const nameEl = NS.qs('#current-biz-name'); if(nameEl) nameEl.textContent = state.currentBusiness?.name || '—';
  };

  NS.bindNav = function(){
    NS.qs('#sidebar').addEventListener('click', e=>{
      const el = e.target.closest('.nav-item'); if(!el) return;
      const p = el.dataset.page;
      if(p==='logout'){ sb().auth.signOut().then(()=>location.href='signup.html'); return; }
      if(p==='businesses'){ location.href='my-businesses.html'; return; }
      NS.showPage(p);
      NS.qsa('.nav-item').forEach(n=>n.classList.toggle('active', n===el));
      // close mobile sidebar
      NS.qs('#sidebar').classList.remove('open');
    });
    const ham = NS.qs('#hamburger'); if(ham) ham.onclick = ()=>NS.qs('#sidebar').classList.toggle('open');
  };

  NS.bindTheme = function(){
    const saved = localStorage.getItem('sunget_theme');
    if(saved) document.documentElement.setAttribute('data-theme', saved);
    const btn = NS.qs('#theme-toggle'); if(!btn) return;
    btn.onclick = ()=>{
      const cur = document.documentElement.getAttribute('data-theme');
      const nx = cur==='light'?'':'light';
      if(nx) document.documentElement.setAttribute('data-theme',nx);
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('sunget_theme', nx);
    };
  };

  NS.bindProfile = function(){
    const drop = NS.qs('#profile-drop'); if(!drop) return;
    drop.addEventListener('click', ()=>drop.classList.toggle('open'));
    document.addEventListener('click', e=>{ if(!drop.contains(e.target)) drop.classList.remove('open'); });
    const em = NS.qs('#profile-email'); if(em) em.textContent = state.user?.email || '';
  };

  // ===== Page routing =====
  NS.showPage = function(page){
    state.page = page;
    NS.qsa('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.page===page));
    const container = NS.qs('#page-content');
    container.innerHTML = `<div class="skeleton" style="height:120px"></div>`;
    switch(page){
      case 'dashboard':   return renderDashboard(container);
      case 'bookings':    return NS.bookings.render(container);
      case 'messages':    return NS.messages.render(container);
      case 'reviews':     return NS.reviews.render(container);
      case 'offers':      return NS.offers.render(container);
      case 'coupons':     return NS.coupons.render(container);
      case 'wallet':      return NS.wallet.render(container);
      case 'statistics':  return NS.charts.render(container);
      case 'settings':    return NS.settings.render(container);
      default:            return renderPlaceholder(container, page);
    }
  };

  NS.showEmptyBusinessState = function(){
    const c = NS.qs('#page-content');
    c.innerHTML = `<div class="card empty">
      <i class="fas fa-briefcase"></i>
      <h3>لا توجد منشأة مسجلة بعد</h3>
      <p style="margin:10px 0 18px">أضف منشأتك الأولى للبدء في إدارة الحجوزات والعروض والإحصائيات.</p>
      <a class="btn primary" href="my-businesses.html#add"><i class="fas fa-plus"></i> إضافة منشأة</a>
    </div>`;
  };

  async function renderDashboard(c){
    const biz = state.currentBusiness; if(!biz){ NS.showEmptyBusinessState(); return; }
    const cfg = window.SUNGET_BIZ_CONFIG[state.businessType];
    const fk = cfg.foreignKey;
    const client = sb();

    // Parallel counts (queries may fail silently if tables not yet present)
    const safe = p => p.then(r=>r).catch(()=>({count:0,data:[]}));
    const [bk, cust, msgs, revs, offers, wallet] = await Promise.all([
      safe(client.from('bookings').select('id, total, status, created_at, customer_name',{count:'exact'}).eq(fk, biz.id).order('created_at',{ascending:false}).limit(5)),
      safe(client.from('bookings').select('customer_id',{count:'exact',head:true}).eq(fk, biz.id)),
      safe(client.from('messages').select('id',{count:'exact',head:true}).eq(fk, biz.id).eq('is_read', false)),
      safe(client.from('reviews').select('rating, comment, created_at, customer_name',{count:'exact'}).eq(fk, biz.id).order('created_at',{ascending:false}).limit(5)),
      safe(client.from('offers').select('id',{count:'exact',head:true}).eq(fk, biz.id).eq('active', true)),
      safe(client.from('wallets').select('balance').eq(fk, biz.id).maybeSingle()),
    ]);

    const revenue = (bk.data||[]).reduce((s,x)=>s+Number(x.total||0),0);
    const avgRating = (revs.data||[]).length ? ((revs.data.reduce((s,x)=>s+Number(x.rating||0),0)/revs.data.length).toFixed(1)) : '—';

    c.innerHTML = `
      <div class="page-title">
        <div><h1>لوحة تحكم ${cfg.label}</h1><div class="sub">${escapeHtml(biz.name||'')}</div></div>
        <div class="row"><button class="btn" onclick="SUNGET.showPage('bookings')"><i class="fas fa-list"></i> كل الحجوزات</button></div>
      </div>
      <div class="stats">
        ${stat('الحجوزات', NS.fmt.num(bk.count||0), 'fa-calendar-check')}
        ${stat('العملاء',   NS.fmt.num(cust.count||0), 'fa-users')}
        ${stat('الرسائل الجديدة', NS.fmt.num(msgs.count||0), 'fa-envelope')}
        ${stat('التقييم', avgRating, 'fa-star')}
        ${stat('الإيرادات', NS.fmt.money(revenue), 'fa-sack-dollar')}
        ${stat('الرصيد', NS.fmt.money(wallet.data?.balance||0), 'fa-wallet')}
      </div>
      <div class="grid-2">
        <div class="card">
          <h3>آخر الحجوزات <a href="#" onclick="SUNGET.showPage('bookings');return false;">عرض الكل</a></h3>
          <div class="table-wrap"><table><thead><tr><th>العميل</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead>
          <tbody>${(bk.data||[]).map(b=>`<tr><td>${escapeHtml(b.customer_name||'—')}</td><td>${NS.fmt.date(b.created_at)}</td><td>${NS.fmt.money(b.total)}</td><td>${statusBadge(b.status)}</td></tr>`).join('') || `<tr><td colspan="4" class="empty">لا توجد حجوزات</td></tr>`}</tbody></table></div>
        </div>
        <div class="card">
          <h3>آخر التقييمات</h3>
          ${(revs.data||[]).map(r=>`<div style="padding:10px 0;border-bottom:1px solid var(--border-dim)"><div class="row"><strong>${escapeHtml(r.customer_name||'ضيف')}</strong><span class="badge warn">${'★'.repeat(Math.round(r.rating||0))}</span></div><div style="color:var(--muted);font-size:13px;margin-top:4px">${escapeHtml(r.comment||'')}</div></div>`).join('') || `<div class="empty">لا توجد تقييمات</div>`}
        </div>
      </div>
      <div class="card"><h3>إحصائيات الحجوزات</h3><canvas id="chart-bookings" height="90"></canvas></div>
    `;
    NS.charts && NS.charts.miniBookings && NS.charts.miniBookings('chart-bookings', biz.id, fk);
  }

  function renderPlaceholder(c, page){
    c.innerHTML = `<div class="card empty"><i class="fas fa-hammer"></i><h3>${page}</h3><p>هذه الصفحة قيد الربط بقاعدة البيانات.</p></div>`;
  }

  function stat(label,value,icon){
    return `<div class="stat"><div class="icon"><i class="fas ${icon}"></i></div><div class="label">${label}</div><div class="value">${value}</div></div>`;
  }
  function statusBadge(s){
    const map = {pending:['warn','قيد الانتظار'],confirmed:['success','مؤكد'],completed:['info','مكتمل'],rejected:['danger','مرفوض'],cancelled:['danger','ملغي']};
    const [c,l] = map[s]||['info', s||'—']; return `<span class="badge ${c}">${l}</span>`;
  }
  window.escapeHtml = function(s){ return String(s??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); };
})(window.SUNGET);
