
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
  if(rooms === 0 && escapes === 0){
    lines.push('No rooms');
  } else {
    lines.push(`${escapes}/${rooms} escapes`);
  }

  const checklists = num('checklists');
  if(checklists) lines.push(`${checklists} checklists`);

  const walkins = entries('walkinRows').filter(x => x.employee || x.count);
  if(walkins.length){
    lines.push('');
    lines.push('Walk-Ins:');
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
  }

  const rebookings = entries('rebookingRows').filter(x => x.employee || x.count);
  if(rebookings.length){
    lines.push('');
    lines.push('Rebookings:');
    rebookings.forEach(x => {
      const count = Number(x.count || 0);
      const employee = x.employee || 'Unknown';
      let line = `${count || '?'} ${plural(count,'rebooking','rebookings')} via ${employee}`;
      if(x.at10){
        line += ` - ${employee} is at 10`;
      } else if(x.at5){
        line += ` - ${employee} is at 5`;
      }
      lines.push(line);
    });
  }

  const cash = entries('cashRows').filter(x => x.time || x.purchase);
  if(cash.length){
    lines.push('');
    lines.push('Cash:');
    cash.forEach(x => {
      lines.push(`${x.time || '?'} ${x.room || '?'} - ${x.purchase || 'Purchase not listed'}`);
    });
  }

  const square = entries('squareRows').filter(x => x.time || x.purchase);
  if(square.length){
    lines.push('');
    lines.push('Square:');
    square.forEach(x => {
      lines.push(`${x.time || '?'} ${x.room || '?'} - ${x.purchase || 'Purchase not listed'}`);
    });
  }

  if($('weeklyCompleted').checked || $('weeklyWorked').checked){
    lines.push('');
    if($('weeklyCompleted').checked){
      lines.push('Finished weekly checklist');
    } else if($('weeklyWorked').checked){
      lines.push('Worked on weekly checklist');
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

$('addCash').addEventListener('click', () => addFromTemplate('cashTemplate','cashRows'));
$('addSquare').addEventListener('click', () => addFromTemplate('squareTemplate','squareRows'));
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
    'merch','training','shoutouts','notes'
  ].forEach(id => $(id).value = '');

  $('walkinRows').innerHTML = '';
  $('rebookingRows').innerHTML = '';
  $('cashRows').innerHTML = '';
  $('squareRows').innerHTML = '';
  $('lateRows').innerHTML = '';
  $('exclusionRows').innerHTML = '';

  $('weeklyWorked').checked = false;
  $('weeklyCompleted').checked = false;
  document.querySelectorAll('.deepClean').forEach(x => x.checked = false);

  generate();
});

generate();

