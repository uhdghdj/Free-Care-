window.openModal = function(title, bodyHtml, saveLabel, onSave){
  let bd = document.getElementById('modal-bd');
  if(!bd){ bd = document.createElement('div'); bd.id='modal-bd'; bd.className='modal-backdrop'; document.body.appendChild(bd); }
  bd.innerHTML = `<div class="modal"><h2>${title}<span class="close" id="m-close">×</span></h2><div id="m-body">${bodyHtml}</div><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" id="m-cancel">إلغاء</button><button class="btn primary" id="m-save">${saveLabel}</button></div></div>`;
  bd.classList.add('open');
  bd.querySelector('#m-close').onclick = window.closeModal;
  bd.querySelector('#m-cancel').onclick = window.closeModal;
  bd.querySelector('#m-save').onclick = onSave;
  bd.onclick = e => { if(e.target===bd) window.closeModal(); };
  return bd.querySelector('.modal');
};
window.closeModal = function(){ const bd=document.getElementById('modal-bd'); if(bd) bd.classList.remove('open'); };
