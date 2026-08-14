
const $ = id => document.getElementById(id);
const saved = JSON.parse(localStorage.getItem('florenceShiftPrefs') || '{}');

if(saved.manager) $('manager').value = saved.manager;

const dayIndex = new Date().getDay();
const dayMap = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
$('day').value = dayMap[dayIndex];

function addFromTemplate(templateId, targetId){
  const fragment = $(templateId).content.cloneNode(true);
  const entry = fragment.querySelector('.entry');
  entry.querySelector('.remove').addEventListener('click', () => {
    entry.remove();
    generate();
  });
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
      obj[el.dataset.field] = (el.value || '').trim();
    });
    return obj;
  });
}

function plural(count, one, many){
  return Number(count) === 1 ? one : many;
}

function generate(){
  const lines = [];
  const day = text('day');
  const start = text('shiftStart');
  const end = text('shiftEnd');

  lines.push(`${day}${start || end ? ` ${start || '?'}-${end || '?'}` : ''}`);

  const rooms = num('games');
  const escapes = num('escapes');
  if(rooms || escapes) lines.push(`${escapes}/${rooms} escapes`);

  const checklists = num('checklists');
  if(checklists) lines.push(`${checklists} checklists`);

  const walkins = entries('walkinRows').filter(x => x.employee || x.count);
  if(walkins.length){
    lines.push('');
    lines.push('Walk-Ins:');
    walkins.forEach(x => {
      const count = Number(x.count || 0);
      lines.push(`${count || '?'} WI via ${x.employee || 'Unknown'}`);
    });
  }

  const rebookings = entries('rebookingRows').filter(x => x.employee || x.count);
  if(rebookings.length){
    lines.push('');
    lines.push('Rebookings:');
    rebookings.forEach(x => {
      const count = Number(x.count || 0);
      lines.push(`${count || '?'} ${plural(count,'rebooking','rebookings')} via ${x.employee || 'Unknown'}`);
    });
  }

  const cashPlayers = num('cashPlayers');
  const squarePlayers = num('squarePlayers');
  const cashTotal = text('cashTotal');
  const squareTotal = text('squareTotal');

  if(cashPlayers || squarePlayers || cashTotal || squareTotal){
    lines.push('');
    lines.push('Payments:');
    if(cashPlayers || cashTotal){
      let s = `Cash: ${cashPlayers || 0} ${plural(cashPlayers,'player','players')}`;
      if(cashTotal) s += ` - ${cashTotal}`;
      lines.push(s);
    }
    if(squarePlayers || squareTotal){
      let s = `Square: ${squarePlayers || 0} ${plural(squarePlayers,'player','players')}`;
      if(squareTotal) s += ` - ${squareTotal}`;
      lines.push(s);
    }
  }

  if($('weeklyCompleted').checked || $('weeklyWorked').checked){
    lines.push('');
    if($('weeklyCompleted').checked){
      lines.push('Weekly Checklist: Completed');
    } else if($('weeklyWorked').checked){
      lines.push('Weekly Checklist: Worked on');
    }
  }

  const deepCleans = [...document.querySelectorAll('.deepClean:checked')].map(x => x.value);
  if(deepCleans.length){
    lines.push('');
    lines.push(`Deep Cleans: ${deepCleans.join(', ')}`);
  }

  const late = entries('lateRows').filter(x => x.time || x.reason || x.minutes);
  if(late.length){
    lines.push('');
    lines.push('Late Starts:');
    late.forEach(x => {
      lines.push(`${x.time || '?'} ${x.room || '?'} - ${x.minutes || '?'} mins late - ${x.reason || 'No reason listed'}`);
    });
  }

  const exclusions = entries('exclusionRows').filter(x => x.time || x.reason);
  if(exclusions.length){
    lines.push('');
    lines.push('Exclusions:');
    exclusions.forEach(x => {
      lines.push(`${x.time || '?'} ${x.room || '?'} excluded - ${x.reason || 'No reason listed'}`);
    });
  }

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

  localStorage.setItem('florenceShiftPrefs', JSON.stringify({
    manager: text('manager')
  }));
}

$('addWalkin').addEventListener('click', () => addFromTemplate('walkinTemplate','walkinRows'));
$('addRebooking').addEventListener('click', () => addFromTemplate('rebookingTemplate','rebookingRows'));
$('addLate').addEventListener('click', () => addFromTemplate('lateTemplate','lateRows'));
$('addExclusion').addEventListener('click', () => addFromTemplate('exclusionTemplate','exclusionRows'));
$('generate').addEventListener('click', generate);

document.querySelectorAll('input,select,textarea').forEach(el => {
  el.addEventListener('input', generate);
  el.addEventListener('change', generate);
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
    $('status').textContent = 'Copied ✓';
    setTimeout(() => $('status').textContent = 'Ready', 1600);
  }catch{
    $('status').textContent = 'Select + copy';
  }
});

$('clear').addEventListener('click', () => {
  if(!confirm('Clear this shift?')) return;

  [
    'shiftStart','shiftEnd','escapes','games','checklists',
    'cashPlayers','squarePlayers','cashTotal','squareTotal',
    'merch','training','shoutouts','notes'
  ].forEach(id => $(id).value = '');

  $('walkinRows').innerHTML = '';
  $('rebookingRows').innerHTML = '';
  $('lateRows').innerHTML = '';
  $('exclusionRows').innerHTML = '';

  $('weeklyWorked').checked = false;
  $('weeklyCompleted').checked = false;
  document.querySelectorAll('.deepClean').forEach(x => x.checked = false);

  generate();
});

generate();

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
