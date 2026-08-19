
const $ = id => document.getElementById(id);

const PREFS_KEY = 'florenceShiftPrefs';
const DRAFT_KEY = 'florenceShiftDraft.v200';
const OLD_DRAFT_KEY = 'florenceShiftDraft.v133';
const UNDO_KEY = 'florenceShiftUndo.v200';
const dayMap = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

let saveTimer = null;
let startupMessage = '';

function localISO(date = new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function todayISO(){ return localISO(new Date()); }

function dayNameFromISO(iso){
  if(!iso) return dayMap[new Date().getDay()];
  const [y,m,d] = iso.split('-').map(Number);
  const date = new Date(y,m-1,d,12,0,0);
  return dayMap[date.getDay()];
}

function niceDate(iso){
  if(!iso) return '';
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y,m-1,d,12).toLocaleDateString([], {weekday:'long',month:'short',day:'numeric'});
}

function updateTodayLabel(){
  $('todayLabel').textContent = niceDate(todayISO());
}

function setSaveState(message, kind=''){
  $('saveIndicator').textContent = message;
  $('saveIndicator').className = `save-indicator ${kind}`.trim();
}

function setStatus(message){
  $('status').textContent = message;
}

function addFromTemplate(templateId, targetId, values = null){
  const fragment = $(templateId).content.cloneNode(true);
  const entry = fragment.querySelector('.entry');

  if(values){
    entry.querySelectorAll('[data-field]').forEach(el => {
      const value = values[el.dataset.field];
      if(el.type === 'checkbox'){
        el.checked = Boolean(value);
      } else if(value !== undefined && value !== null){
        el.value = value;
      }
    });
  }

  entry.querySelector('.remove').addEventListener('click', () => {
    entry.remove();
    generate();
  });

  const at5 = entry.querySelector('[data-field="at5"]');
  const at10 = entry.querySelector('[data-field="at10"]');

  if(at5 && at10){
    at10.addEventListener('change', () => {
      if(at10.checked) at5.checked = true;
      generate();
    });
    at5.addEventListener('change', () => {
      if(!at5.checked) at10.checked = false;
      generate();
    });
  }

  entry.querySelectorAll('input,select').forEach(el => {
    el.addEventListener('input', generate);
    el.addEventListener('change', generate);
  });

  $(targetId).appendChild(fragment);
}

function text(id){ return ($(id).value || '').trim(); }
function num(id){ return Number($(id).value || 0); }

function entries(targetId){
  return [...$(targetId).querySelectorAll('.entry')].map(entry => {
    const obj = {};
    entry.querySelectorAll('[data-field]').forEach(el => {
      if(el.type === 'checkbox'){
        obj[el.dataset.field] = el.checked;
      } else {
        obj[el.dataset.field] = (el.value || '').trim();
      }
    });
    return obj;
  });
}

function hasMeaningfulDraft(draft){
  if(!draft) return false;
  const scalars = ['shiftStart','shiftEnd','escapes','games','checklists','merch','training','shoutouts','notes'];
  if(scalars.some(k => String(draft[k] ?? '').trim())) return true;
  if(['exclusions','lateStarts','walkins','rebookings','payments','cash','square'].some(k => (draft[k] || []).length)) return true;
  if(draft.weeklyWorked || draft.weeklyCompleted) return true;
  return (draft.deepCleans || []).length > 0;
}

function collectCurrentShift(){
  return {
    savedAt: new Date().toISOString(),
    shiftDate: text('shiftDate'),
    day: text('day'),
    shiftStart: text('shiftStart'),
    shiftEnd: text('shiftEnd'),
    escapes: $('escapes').value,
    games: $('games').value,
    checklists: $('checklists').value,

    exclusions: entries('exclusionRows'),
    lateStarts: entries('lateRows'),
    walkins: entries('walkinRows'),
    rebookings: entries('rebookingRows'),
    payments: entries('paymentRows'),

    weeklyWorked: $('weeklyWorked').checked,
    weeklyCompleted: $('weeklyCompleted').checked,
    deepCleans: [...document.querySelectorAll('.deepClean:checked')].map(x => x.value),

    merch: $('merch').value,
    training: $('training').value,
    shoutouts: $('shoutouts').value,
    notes: $('notes').value
  };
}

function saveCurrentShift(){
  setSaveState('Saving…','saving');
  localStorage.setItem(DRAFT_KEY, JSON.stringify(collectCurrentShift()));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => setSaveState('Saved','saved'), 220);
}

function setValue(id, value){
  if($(id)) $(id).value = value ?? '';
}

function clearDynamicRows(){
  ['walkinRows','rebookingRows','paymentRows','lateRows','exclusionRows'].forEach(id => $(id).innerHTML = '');
}

function applyDraft(draft){
  clearDynamicRows();

  const date = draft.shiftDate || todayISO();
  setValue('shiftDate', date);
  setValue('day', dayNameFromISO(date));
  setValue('shiftStart', draft.shiftStart);
  setValue('shiftEnd', draft.shiftEnd);
  setValue('escapes', draft.escapes);
  setValue('games', draft.games);
  setValue('checklists', draft.checklists);

  (draft.exclusions || []).forEach(x => addFromTemplate('exclusionTemplate','exclusionRows',x));
  (draft.lateStarts || []).forEach(x => addFromTemplate('lateTemplate','lateRows',x));
  (draft.walkins || []).forEach(x => addFromTemplate('walkinTemplate','walkinRows',x));
  (draft.rebookings || []).forEach(x => addFromTemplate('rebookingTemplate','rebookingRows',x));

  if(Array.isArray(draft.payments)){
    draft.payments.forEach(x => addFromTemplate('paymentTemplate','paymentRows',x));
  } else {
    // v1.3.3 migration: Cash and Square used to live in separate arrays.
    (draft.cash || []).forEach(x => addFromTemplate('paymentTemplate','paymentRows',{...x,type:'Cash'}));
    (draft.square || []).forEach(x => addFromTemplate('paymentTemplate','paymentRows',{...x,type:'Square'}));
  }

  $('weeklyWorked').checked = Boolean(draft.weeklyWorked);
  $('weeklyCompleted').checked = Boolean(draft.weeklyCompleted);

  const deepCleans = new Set(draft.deepCleans || []);
  document.querySelectorAll('.deepClean').forEach(x => x.checked = deepCleans.has(x.value));

  setValue('merch', draft.merch);
  setValue('training', draft.training);
  setValue('shoutouts', draft.shoutouts);
  setValue('notes', draft.notes);
}

function loadJSON(key){
  try{ return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch{ return null; }
}

function saveUndoSnapshot(draft = collectCurrentShift()){
  if(!hasMeaningfulDraft(draft)) return false;
  localStorage.setItem(UNDO_KEY, JSON.stringify(draft));
  updateUndoButton();
  return true;
}

function updateUndoButton(){
  const available = Boolean(loadJSON(UNDO_KEY));
  $('undoClear').disabled = !available;
  if(available && startupMessage){
    setStatus(startupMessage);
  }
}

function initializeDraft(){
  const today = todayISO();
  let draft = loadJSON(DRAFT_KEY);

  // Migrate the previous app's draft once.
  if(!draft){
    const old = loadJSON(OLD_DRAFT_KEY);
    if(old){
      if(old.day === dayNameFromISO(today)){
        draft = {...old, shiftDate: today};
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        startupMessage = 'Today’s draft restored';
      } else if(hasMeaningfulDraft(old)){
        localStorage.setItem(UNDO_KEY, JSON.stringify(old));
        startupMessage = 'Previous draft available';
      }
      localStorage.removeItem(OLD_DRAFT_KEY);
    }
  }

  if(draft){
    const draftDate = draft.shiftDate || '';
    if(draftDate === today){
      applyDraft(draft);
      startupMessage = startupMessage || 'Today’s draft restored';
      return;
    }

    if(hasMeaningfulDraft(draft)){
      localStorage.setItem(UNDO_KEY, JSON.stringify(draft));
      startupMessage = 'Previous draft available';
    }
    localStorage.removeItem(DRAFT_KEY);
  }

  setValue('shiftDate', today);
  setValue('day', dayNameFromISO(today));
}

function resetFields({date = text('shiftDate') || todayISO(), saveBlank = true} = {}){
  [
    'shiftStart','shiftEnd','escapes','games','checklists',
    'merch','training','shoutouts','notes'
  ].forEach(id => $(id).value = '');

  clearDynamicRows();

  $('weeklyWorked').checked = false;
  $('weeklyCompleted').checked = false;
  document.querySelectorAll('.deepClean').forEach(x => x.checked = false);

  setValue('shiftDate', date);
  setValue('day', dayNameFromISO(date));

  generate({save:saveBlank});
}

function parseClock(value){
  const raw = String(value || '').trim().toLowerCase().replace(/\./g,'');
  if(!raw) return null;

  const twelve = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if(twelve){
    let hour = Number(twelve[1]);
    const min = Number(twelve[2] || 0);
    if(hour < 1 || hour > 12 || min > 59) return null;
    hour %= 12;
    if(twelve[3] === 'pm') hour += 12;
    return {minutes:hour*60+min, meridiem:twelve[3]};
  }

  const twentyFour = raw.match(/^(\d{1,2})(?::(\d{2}))$/);
  if(twentyFour){
    const hour = Number(twentyFour[1]), min = Number(twentyFour[2]);
    if(hour > 23 || min > 59) return null;
    return {minutes:hour*60+min, meridiem:null};
  }

  return null;
}

function buildWarnings(){
  const warnings = [];
  const rooms = num('games');
  const escapes = num('escapes');

  if(escapes > rooms){
    warnings.push(`Escapes (${escapes}) are higher than Rooms Ran (${rooms}).`);
  }

  const start = parseClock(text('shiftStart'));
  const end = parseClock(text('shiftEnd'));
  if(start && end && end.minutes < start.minutes){
    const obviousOvernight =
      (start.meridiem === 'pm' && end.meridiem === 'am') ||
      (start.minutes >= 18*60 && end.minutes <= 3*60);
    if(!obviousOvernight){
      warnings.push('Shift End is earlier than Shift Start.');
    }
  }

  entries('lateRows').forEach((x,index) => {
    const label = `Late Start ${index+1}`;
    if((x.time || x.minutes || x.reason) && !x.reason){
      warnings.push(`${label} is missing a reason.`);
    }
    const mins = Number(x.minutes || 0);
    if(mins > 0 && mins <= 10){
      warnings.push(`${label} is only ${mins} minutes late. Exactly 10 minutes or less does not count as a late start.`);
    }
  });

  entries('paymentRows').forEach((x,index) => {
    if(!(x.type || x.time || x.room || x.purchase)) return;
    const label = `Payment ${index+1}`;
    if(!x.type) warnings.push(`${label} is missing Cash/Square.`);
    if(!x.room) warnings.push(`${label} is missing a room.`);
    if(!x.purchase) warnings.push(`${label} is missing what they bought.`);
  });

  return warnings;
}

function renderWarnings(){
  const warnings = buildWarnings();
  $('warningCount').textContent = `${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}`;
  $('warningCard').classList.toggle('has-warnings', warnings.length > 0);
  $('warnings').innerHTML = warnings.length
    ? warnings.map(x => `<div class="warning-item">${escapeHTML(x)}</div>`).join('')
    : '<div class="all-good">No warnings. Miracles do happen.</div>';
}

function escapeHTML(value){
  return String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

function generate(options = {}){
  const lines = [];
  const day = text('day') || dayNameFromISO(text('shiftDate'));
  const start = text('shiftStart');
  const end = text('shiftEnd');

  // 1. Day and time of shift
  lines.push(`${day}${start || end ? ` ${start || '?'}-${end || '?'}` : ''}`);

  // 2. Escape rate and checklists
  const rooms = num('games');
  const escapes = num('escapes');
  if(rooms === 0 && escapes === 0){
    lines.push('No rooms');
  } else {
    lines.push(`${escapes}/${rooms} escapes`);
  }

  const checklists = num('checklists');
  if(checklists) lines.push(`${checklists} checklists`);

  // 3. Exclusions
  const exclusions = entries('exclusionRows').filter(x => x.time || x.reason);
  if(exclusions.length){
    lines.push('');
    lines.push('Exclusions:');
    exclusions.forEach(x => {
      lines.push(`${x.time || '?'} ${x.room || '?'} excluded - ${x.reason || 'No reason listed'}`);
    });
  }

  // 4. Late Starts
  const late = entries('lateRows').filter(x => x.time || x.reason || x.minutes);
  if(late.length){
    lines.push('');
    lines.push('Late Starts:');
    late.forEach(x => {
      lines.push(`${x.time || '?'} ${x.room || '?'} - ${x.minutes || '?'} mins late - ${x.reason || 'No reason listed'}`);
    });
  }

  // 5. Walk-Ins / Rebookings
  const walkins = entries('walkinRows').filter(x => x.employee || x.count);
  const rebookings = entries('rebookingRows').filter(x => x.employee || x.count);

  if(walkins.length || rebookings.length){
    lines.push('');
    lines.push('Walk-Ins / Rebookings:');

    walkins.forEach(x => {
      const count = Number(x.count || 0);
      const employee = x.employee || 'Unknown';
      let line = `${count || '?'} WI via ${employee}`;
      if(x.at10){
        line += ` - ${employee} is at 10`;
      } else if(x.at5){
        line += ` - ${employee} is at 5`;
      }
      lines.push(line);
    });

    rebookings.forEach(x => {
      const count = Number(x.count || 0);
      const employee = x.employee || 'Unknown';
      let line = `${count || '?'} RB via ${employee}`;
      if(x.at10){
        line += ` - ${employee} is at 10`;
      } else if(x.at5){
        line += ` - ${employee} is at 5`;
      }
      lines.push(line);
    });
  }

  // 6. Payments
  const payments = entries('paymentRows').filter(x => x.type || x.time || x.room || x.purchase);
  const cash = payments.filter(x => x.type === 'Cash');
  const square = payments.filter(x => x.type === 'Square');
  const unknown = payments.filter(x => !x.type);

  if(payments.length){
    lines.push('');
    lines.push('Payments:');

    if(cash.length){
      lines.push('Cash:');
      cash.forEach(x => lines.push(`${x.time || '?'} ${x.room || '?'} - ${x.purchase || 'Purchase not listed'}`));
    }

    if(square.length){
      lines.push('Square:');
      square.forEach(x => lines.push(`${x.time || '?'} ${x.room || '?'} - ${x.purchase || 'Purchase not listed'}`));
    }

    unknown.forEach(x => lines.push(`Unspecified: ${x.time || '?'} ${x.room || '?'} - ${x.purchase || 'Purchase not listed'}`));
  }

  // 7. Weekly cleaning
  if($('weeklyCompleted').checked || $('weeklyWorked').checked){
    lines.push('');
    if($('weeklyCompleted').checked){
      lines.push('Finished weekly checklist');
    } else if($('weeklyWorked').checked){
      lines.push('Worked on weekly checklist');
    }
  }

  // 8. Deep Cleans
  const deepCleans = [...document.querySelectorAll('.deepClean:checked')].map(x => x.value);
  if(deepCleans.length){
    lines.push('');
    lines.push(`Deep Cleans: ${deepCleans.join(', ')}`);
  }

  // 9. Other Stuff
  const merch = text('merch');
  if(merch){
    lines.push('');
    lines.push(`Merch: ${merch}`);
  }

  const training = text('training');
  if(training){
    lines.push('');
    lines.push(`Training: ${training}`);
  }

  const shoutouts = text('shoutouts');
  if(shoutouts){
    lines.push('');
    lines.push(`Shoutouts: ${shoutouts}`);
  }

  const notes = text('notes');
  if(notes){
    lines.push('');
    lines.push(`Notes: ${notes}`);
  }

  $('output').textContent = lines.join('\n');
  renderWarnings();

  localStorage.setItem(PREFS_KEY, JSON.stringify({
    manager: text('manager')
  }));

  if(options.save !== false){
    saveCurrentShift();
  }
}

function startToday(){
  const current = collectCurrentShift();
  if(hasMeaningfulDraft(current) && !confirm('Start a new shift for today? Your current draft will be saved for Undo Clear.')) return;
  saveUndoSnapshot(current);
  resetFields({date:todayISO(), saveBlank:true});
  setStatus('New shift started for today');
  updateUndoButton();
}

function clearShift(){
  if(!confirm('Clear this shift? You can undo it afterward.')) return;
  const current = collectCurrentShift();
  saveUndoSnapshot(current);
  const keepDate = text('shiftDate') || todayISO();
  resetFields({date:keepDate, saveBlank:true});
  setStatus('Shift cleared');
  updateUndoButton();
}

function undoClear(){
  const undo = loadJSON(UNDO_KEY);
  if(!undo) return;
  const current = collectCurrentShift();
  if(hasMeaningfulDraft(current)){
    localStorage.setItem(UNDO_KEY, JSON.stringify(current));
  } else {
    localStorage.removeItem(UNDO_KEY);
  }
  applyDraft(undo);
  generate();
  setStatus('Previous draft restored');
  updateUndoButton();
}

const saved = loadJSON(PREFS_KEY) || {};
if(saved.manager) $('manager').value = saved.manager;

updateTodayLabel();
initializeDraft();
updateUndoButton();

$('addPayment').addEventListener('click', () => addFromTemplate('paymentTemplate','paymentRows'));
$('addWalkin').addEventListener('click', () => addFromTemplate('walkinTemplate','walkinRows'));
$('addRebooking').addEventListener('click', () => addFromTemplate('rebookingTemplate','rebookingRows'));
$('addLate').addEventListener('click', () => addFromTemplate('lateTemplate','lateRows'));
$('addExclusion').addEventListener('click', () => addFromTemplate('exclusionTemplate','exclusionRows'));
$('generate').addEventListener('click', generate);

document.querySelectorAll('input,select,textarea').forEach(el => {
  el.addEventListener('input', generate);
  el.addEventListener('change', generate);
});

$('shiftDate').addEventListener('change', () => {
  $('day').value = dayNameFromISO(text('shiftDate'));
  generate();
});

$('weeklyCompleted').addEventListener('change', () => {
  if($('weeklyCompleted').checked) $('weeklyWorked').checked = false;
  generate();
});
$('weeklyWorked').addEventListener('change', () => {
  if($('weeklyWorked').checked) $('weeklyCompleted').checked = false;
  generate();
});

$('copy').addEventListener('click', async () => {
  generate();
  try{
    await navigator.clipboard.writeText($('output').textContent);
    setStatus('Copied ✓');
    setTimeout(() => setStatus('Ready'), 1600);
  }catch{
    setStatus('Select + copy');
  }
});

$('clear').addEventListener('click', clearShift);
$('newShift').addEventListener('click', startToday);
$('undoClear').addEventListener('click', undoClear);

generate({save:false});

if(startupMessage){
  setStatus(startupMessage);
} else {
  setStatus('Ready');
}
