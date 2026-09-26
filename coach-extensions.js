/* Incremental trainer tools. Keeps the v1 storage key, arrays and legacy fields. */
const shown = value => value === '' || value == null ? '—' : esc(value);
const num = value => value === '' || value == null ? null : Number(value);
const change = (previous,current,unit) => {
  const a=num(previous),b=num(current);
  if(a===null||b===null||!Number.isFinite(a)||!Number.isFinite(b))return '';
  const diff=Math.round((b-a)*10)/10;
  return `<span class="delta">${esc(previous)} → ${esc(current)} ${unit} <strong>(${diff>0?'+':''}${fmt(diff)} ${unit})</strong></span>`;
};
const measurements=[['weight','Peso','kg'],['waist','Cintura','cm'],['navel','Ombligo','cm'],['chest','Pecho','cm'],['hip','Cadera','cm'],['arm','Brazo','cm'],['thigh','Muslo','cm'],['bodyFat','Grasa corporal','%'],['muscleMass','Masa muscular','kg']];
const intensity = e => e.planned?.intensityType ? `${e.planned.intensityType} ${shown(e.planned.intensityValue)}` : e.rpe ? `RPE ${esc(e.rpe)}` : e.rir!==''&&e.rir!=null ? `RIR ${esc(e.rir)}` : '—';

studentForm=function(s){
  modal(s?'Editar ficha':'Nuevo alumno','Información útil para programar el entrenamiento. Los campos nuevos son opcionales.',`<div class="form-grid">
    ${f('name','Nombre completo *','text',s?.name,'required maxlength="100"')}${select('status','Estado',['Activo','Pausado'],s?.status||'Activo')}
    ${f('goal','Objetivo','text',s?.goal,'maxlength="120"')}${select('level','Nivel',['Principiante','Intermedio','Avanzado'],s?.level||'Principiante')}
    ${f('birthDate','Fecha de nacimiento','date',s?.birthDate)}${select('sex','Sexo',['','Mujer','Varón','Otro','Prefiere no informar'],s?.sex||'')}
    ${f('availability','Días disponibles por semana','number',s?.availability,'min="1" max="7"')}${f('sessionMinutes','Minutos disponibles por sesión','number',s?.sessionMinutes,'min="10" max="300" step="5"')}
    ${select('trainingPlace','Lugar de entrenamiento',['','Gimnasio','Casa','Otro'],s?.trainingPlace||'')}${f('start','Fecha de inicio','date',s?.start||date())}
    ${f('height','Altura (cm)','number',s?.height,'min="80" max="250" step="0.1"')}${f('initialWeight','Peso inicial (kg)','number',s?.initialWeight,'min="20" max="400" step="0.1"')}
    ${textarea('experience','Experiencia previa de entrenamiento',s?.experience)}${textarea('limitations','Lesiones o limitaciones relevantes',s?.limitations)}
    ${textarea('equipment','Equipamiento disponible',s?.equipment)}${textarea('notes','Contexto y observaciones',s?.notes)}
    ${textarea('trainerNotes','Observaciones del entrenador',s?.trainerNotes)}
  </div>`,d=>{
    const item={...d,name:d.name.trim(),id:s?.id||id(),createdAt:s?.createdAt||new Date().toISOString()};
    commit(v=>{if(s)Object.assign(v.students.find(x=>x.id===s.id),item);else v.students.push(item)});
    selectedId=item.id;detailTab='overview';render();
  });
};

function controlsFor(sid){
  const entries=recent(state.checkins.filter(c=>c.studentId===sid));
  if(!entries.length)return empty('Todavía no hay controles.');
  return `<div class="control-list">${entries.map((c,i)=>{
    const previous=entries[i+1];
    return `<article class="card control-card"><div class="plan-head"><div><h3>${niceDate(c.date)}</h3><p class="hint">${esc(c.notes||'Control de progreso')}</p></div><button class="ghost" data-action="checkin-edit" data-id="${c.id}">Editar</button></div>
      <div class="measurement-grid">${measurements.filter(([key])=>c[key]!==''&&c[key]!=null).map(([key,label,unit])=>`<div><small>${label}</small><strong>${esc(c[key])} ${unit}</strong>${previous?change(previous[key],c[key],unit):''}</div>`).join('')||'<p class="hint">Sin medidas numéricas.</p>'}</div>
      ${c.adherence!==''&&c.adherence!=null?`<p class="hint">Adherencia: ${esc(c.adherence)}%</p>`:''}
    </article>`;
  }).join('')}</div>`;
}

checkinForm=function(c,sid){
  modal(c?'Editar control':'Registrar progreso','Registrá solo las medidas disponibles. La fecha es obligatoria.',`<div class="form-grid">${f('date','Fecha *','date',c?.date||date(),'required')}${f('adherence','Adherencia estimada (%)','number',c?.adherence,'min="0" max="100" step="1"')}
    ${measurements.map(([key,label,unit])=>f(key,`${label} (${unit})`,'number',c?.[key],`min="0" max="500" step="0.1" inputmode="decimal"`)).join('')}
    ${textarea('notes','Observaciones',c?.notes)}</div>`,d=>{
      commit(v=>{const item={...d,id:c?.id||id(),studentId:c?.studentId||sid};if(c)Object.assign(v.checkins.find(x=>x.id===c.id),item);else v.checkins.push(item)});
    });
};

const legacyPlanned=e=>({sets:e.planned?.sets??e.sets??'3',reps:e.planned?.reps??e.reps??'8-12',intensityType:e.planned?.intensityType??(e.rpe?'RPE':'RIR'),intensityValue:e.planned?.intensityValue??e.rpe??e.rir??'',rest:e.planned?.rest??e.rest??'',load:e.planned?.load??e.load??'',notes:e.planned?.notes??e.notes??''});
const baseExercise=()=>({id:id(),name:'',planned:{sets:'3',reps:'8-12',intensityType:'RIR',intensityValue:'2',rest:'90 s',load:'',notes:''}});
const baseDay=n=>({id:id(),name:`Día ${n}`,exercises:[baseExercise()]});
const planOptions=(selected='')=>state.students.map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('');

planForm=function(p,sid){
  let days=structuredClone(p?.days||[baseDay(1)]).map((d,i)=>({...d,id:d.id||id(),exercises:(d.exercises||[]).map(e=>({...e,id:e.id||id(),planned:legacyPlanned(e)}))}));
  const target=p?.studentId||sid||state.students[0]?.id;
  modal(p?'Editar bloque':'Nuevo bloque','Programá días y ejercicios. Las cargas realizadas se registran aparte, por sesión.',`<div class="form-grid">
    <label class="field">Alumno *<select name="studentId" required>${planOptions(target)}</select></label>
    ${f('name','Nombre del bloque *','text',p?.name,'required maxlength="100"')}${f('start','Inicio','date',p?.start||date())}${f('end','Fin','date',p?.end)}${textarea('notes','Indicaciones del bloque',p?.notes)}
  </div><div class="section-head"><h3>Días y sesiones</h3><button type="button" class="secondary" id="add-day">+ Agregar día</button></div><div id="days-editor"></div>`,d=>{
    capture();
    if(!days.length||days.some(day=>!day.name||!day.exercises.length||day.exercises.some(ex=>!ex.name))){notice('Cada día necesita nombre y al menos un ejercicio con nombre.');return false}
    const normalized=days.map(day=>({...day,exercises:day.exercises.map(ex=>({...ex,
      sets:ex.planned.sets,reps:ex.planned.reps,rir:ex.planned.intensityType==='RIR'?ex.planned.intensityValue:'',rpe:ex.planned.intensityType==='RPE'?ex.planned.intensityValue:'',rest:ex.planned.rest,load:ex.planned.load,notes:ex.planned.notes
    }))}));
    commit(v=>{const item={id:p?.id||id(),studentId:d.studentId,name:d.name.trim(),start:d.start,end:d.end,notes:d.notes,days:normalized,createdAt:p?.createdAt||new Date().toISOString()};if(p)Object.assign(v.plans.find(x=>x.id===p.id),item);else v.plans.push(item)});
  });
  const draw=()=>{$('#days-editor').innerHTML=days.map((day,i)=>`<section class="plan-card day-editor" data-id="${esc(day.id)}">
    <div class="editor-heading"><label class="field">Nombre de la sesión<input data-day-name value="${esc(day.name)}" required></label><div class="move-actions"><button type="button" class="secondary" data-move-day="${i}:-1" aria-label="Subir día">↑</button><button type="button" class="secondary" data-move-day="${i}:1" aria-label="Bajar día">↓</button><button type="button" class="ghost" data-remove-day="${i}">Quitar</button></div></div>
    ${day.exercises.map((ex,j)=>{const a=legacyPlanned(ex);return `<div class="exercise-editor" data-id="${esc(ex.id)}"><div class="editor-heading"><strong>Ejercicio ${j+1}</strong><div class="move-actions"><button type="button" class="secondary" data-move-ex="${i}:${j}:-1" aria-label="Subir ejercicio">↑</button><button type="button" class="secondary" data-move-ex="${i}:${j}:1" aria-label="Bajar ejercicio">↓</button><button type="button" class="ghost" data-remove-ex="${i}:${j}">Quitar</button></div></div>
    <div class="form-grid">${f('exName','Nombre *','text',ex.name,'data-ex-name required maxlength="100"')}${f('sets','Series','number',a.sets,'data-ex-sets min="1" max="30"')}${f('reps','Repeticiones o rango','text',a.reps,'data-ex-reps maxlength="40"')}
      <label class="field">Escala<select data-ex-type><option ${a.intensityType==='RIR'?'selected':''}>RIR</option><option ${a.intensityType==='RPE'?'selected':''}>RPE</option></select></label>
      ${f('intensity','RPE / RIR objetivo','number',a.intensityValue,'data-ex-value min="0" max="10" step="0.5"')}${f('rest','Descanso','text',a.rest,'data-ex-rest maxlength="40"')}${f('load','Carga objetivo (kg)','number',a.load,'data-ex-load min="0" max="1000" step="0.5"')}${textarea('exNotes','Observaciones',a.notes).replace('<textarea ','<textarea data-ex-notes ')}</div></div>`}).join('')}
    <button type="button" class="secondary" data-add-ex="${i}">+ Ejercicio</button></section>`).join('')};
  const capture=()=>{days=[...$('#days-editor').querySelectorAll('.day-editor')].map(el=>({id:el.dataset.id,name:el.querySelector('[data-day-name]').value.trim(),exercises:[...el.querySelectorAll('.exercise-editor')].map(card=>({id:card.dataset.id,name:card.querySelector('[data-ex-name]').value.trim(),planned:{sets:card.querySelector('[data-ex-sets]').value,reps:card.querySelector('[data-ex-reps]').value.trim(),intensityType:card.querySelector('[data-ex-type]').value,intensityValue:card.querySelector('[data-ex-value]').value,rest:card.querySelector('[data-ex-rest]').value.trim(),load:card.querySelector('[data-ex-load]').value,notes:card.querySelector('[data-ex-notes]').value.trim()}}))}))};
  draw();
  $('#add-day').onclick=()=>{capture();days.push(baseDay(days.length+1));draw()};
  $('#days-editor').onclick=e=>{const control=e.target.closest('[data-add-ex],[data-remove-day],[data-remove-ex],[data-move-day],[data-move-ex]');if(!control)return;capture();const d=control.dataset;
    if(d.addEx!=null)days[+d.addEx].exercises.push(baseExercise());
    if(d.removeDay!=null)days.splice(+d.removeDay,1);
    if(d.removeEx!=null){const [i,j]=d.removeEx.split(':').map(Number);days[i].exercises.splice(j,1)}
    if(d.moveDay!=null){const [i,step]=d.moveDay.split(':').map(Number),to=i+step;if(to>=0&&to<days.length)[days[i],days[to]]=[days[to],days[i]]}
    if(d.moveEx!=null){const [i,j,step]=d.moveEx.split(':').map(Number),list=days[i].exercises,to=j+step;if(to>=0&&to<list.length)[list[j],list[to]]=[list[to],list[j]]}
    draw();
  };
};

planCard=function(p){return `<article class="card plan-display"><div class="plan-head"><div><h2>${esc(p.name)}</h2><small>${esc(studentName(p.studentId))} · ${niceDate(p.start)} ${p.end?'al '+niceDate(p.end):''}</small></div><div class="move-actions"><button class="ghost" data-action="plan-edit" data-id="${p.id}">Editar</button><button class="ghost" data-action="plan-delete" data-id="${p.id}">Eliminar</button></div></div><p class="hint">${esc(p.notes||'Sin indicaciones adicionales')}</p>
  ${(p.days||[]).map(day=>`<section class="plan-card"><h3>${esc(day.name)}</h3><div class="stack">${(day.exercises||[]).map((ex,i)=>{const a=legacyPlanned(ex);return `<div class="planned-ex"><strong>${i+1}. ${esc(ex.name)}</strong><span>${esc(a.sets)} × ${esc(a.reps)} · ${intensity(ex)} · ${shown(a.rest)} de descanso${a.load!==''?' · '+esc(a.load)+' kg objetivo':''}</span>${a.notes?`<small>${esc(a.notes)}</small>`:''}</div>`}).join('')}</div></section>`).join('')}</article>`};

sessionForm=function(s,sid){
  const studentId=s?.studentId||sid;
  const plans=state.plans.filter(p=>p.studentId===studentId);
  const plan=s?.planId&&plans.find(p=>p.id===s.planId)||plans[0];
  modal(s?'Editar sesión':'Registrar sesión realizada','El trabajo real queda separado de la rutina programada.',`<div class="form-grid">
    ${f('date','Fecha *','date',s?.date||date(),'required')}
    <label class="field">Rutina<select name="planId" id="session-plan"><option value="">Sin rutina vinculada</option>${plans.map(p=>`<option value="${p.id}" ${p.id===s?.planId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
    <label class="field">Día<select name="dayId" id="session-day"></select></label>
    <label class="field">Ejercicio planificado<select name="exerciseId" id="session-exercise"></select></label>
    ${f('day','Sesión *','text',s?.day,'required maxlength="80"')}${f('exercise','Ejercicio *','text',s?.exercise,'required maxlength="100"')}
    ${f('sets','Series realizadas *','number',s?.performed?.sets??s?.sets,'required min="1" max="30"')}${f('reps','Repeticiones realizadas *','text',s?.performed?.reps??s?.reps,'required maxlength="40"')}
    ${f('load','Carga utilizada (kg)','number',s?.performed?.load??s?.load,'min="0" max="1000" step="0.5"')}
    ${select('intensityType','Escala',['RIR','RPE'],s?.performed?.intensityType||'RIR')}${f('rir','RPE / RIR real','number',s?.performed?.intensityValue??s?.rir,'min="0" max="10" step="0.5"')}
    ${textarea('notes','Observaciones reales',s?.performed?.notes??s?.notes)}
  </div><p class="hint" id="planned-summary"></p>`,d=>{
    const item={...d,id:s?.id||id(),studentId,performed:{sets:d.sets,reps:d.reps,load:d.load,intensityType:d.intensityType,intensityValue:d.rir,notes:d.notes}};
    commit(v=>{if(s)Object.assign(v.sessions.find(x=>x.id===s.id),item);else v.sessions.push(item)});
  });
  const planSelect=$('#session-plan'),daySelect=$('#session-day'),exSelect=$('#session-exercise');
  const selectedPlan=()=>plans.find(p=>p.id===planSelect.value);
  const selectedDay=()=>selectedPlan()?.days?.find(d=>(d.id||`legacy-day-${selectedPlan().days.indexOf(d)}`)===daySelect.value);
  const selectedEx=()=>selectedDay()?.exercises?.find(e=>(e.id||`legacy-ex-${selectedDay().exercises.indexOf(e)}`)===exSelect.value);
  const drawEx=()=>{const day=selectedDay();exSelect.innerHTML=`<option value="">Elegir ejercicio</option>${(day?.exercises||[]).map((e,i)=>`<option value="${esc(e.id||`legacy-ex-${i}`)}" ${s?.exerciseId===(e.id||`legacy-ex-${i}`)?'selected':''}>${esc(e.name)}</option>`).join('')}`;$('#planned-summary').textContent='';};
  const drawDays=()=>{const p=selectedPlan();daySelect.innerHTML=`<option value="">Elegir día</option>${(p?.days||[]).map((d,i)=>`<option value="${esc(d.id||`legacy-day-${i}`)}" ${s?.dayId===(d.id||`legacy-day-${i}`)?'selected':''}>${esc(d.name)}</option>`).join('')}`;drawEx()};
  planSelect.onchange=drawDays;daySelect.onchange=()=>{drawEx();const d=selectedDay();if(d)$('#modal-form [name=day]').value=d.name};
  exSelect.onchange=()=>{const e=selectedEx();if(e){$('#modal-form [name=exercise]').value=e.name;const a=legacyPlanned(e);$('#planned-summary').textContent=`Planificado: ${a.sets} × ${a.reps}, ${a.intensityType} ${a.intensityValue||'—'}, ${a.load||'—'} kg objetivo.`}};
  drawDays();
};

sessionTable=function(sid){const list=recent(state.sessions.filter(x=>x.studentId===sid));return list.length?`<div class="session-list">${list.map(x=>{const real=x.performed||x;return `<article class="planned-ex"><div class="plan-head"><strong>${niceDate(x.date)} · ${esc(x.day)} · ${esc(x.exercise)}</strong><button class="ghost" data-action="session-edit" data-id="${x.id}">Editar</button></div><span>Realizado: ${esc(real.sets||'—')} × ${esc(real.reps||'—')} · ${shown(real.load)} kg · ${esc(real.intensityType||'RIR')} ${shown(real.intensityValue??x.rir)}</span>${real.notes?`<small>${esc(real.notes)}</small>`:''}</article>`}).join('')}</div>`:empty('No hay sesiones registradas.')};

function photoCards(sid){const photos=recent(state.photos.filter(x=>x.studentId===sid));return photos.length?`<div class="photos">${photos.map(p=>`<article class="photo">${p.data?.startsWith('data:image/')?`<img src="${p.data}" alt="Foto de ${esc(studentName(sid))} del ${niceDate(p.date)}">`:'<div class="photo-placeholder">Imagen pendiente</div>'}<small>${niceDate(p.date)} · ${esc(p.label||'Foto')}</small>${p.checkinId?`<small>Control: ${niceDate(state.checkins.find(c=>c.id===p.checkinId)?.date)}</small>`:''}<button class="ghost" data-action="photo-delete" data-id="${p.id}">Eliminar</button></article>`).join('')}</div>`:empty('Todavía no hay fotos ni referencias de progreso.')}
photoForm=function(sid){const controls=recent(state.checkins.filter(c=>c.studentId===sid));modal('Referencia de foto','Podés asociar fecha y control. La carga de imágenes nuevas espera un almacenamiento persistente seguro.',`<div class="form-grid">${f('date','Fecha *','date',date(),'required')}${select('label','Vista',['Frente','Espalda','Perfil','Otra'])}<label class="field wide">Asociar a un control<select name="checkinId"><option value="">Sin control asociado</option>${controls.map(c=>`<option value="${c.id}">${niceDate(c.date)}</option>`).join('')}</select></label></div><p class="hint">La referencia se guarda en este navegador. No adjunta una imagen nueva.</p>`,d=>commit(v=>v.photos.push({id:id(),studentId:sid,date:d.date,label:d.label,checkinId:d.checkinId,data:null})));};
actions['photo-new']=e=>photoForm(e.dataset.sid);

renderDetail=function(){
  const s=student(selectedId);if(!s)return empty('Alumno no encontrado.');
  const tabs=[['overview','Ficha'],['plans','Rutina'],['progress','Evolución'],['photos','Fotos']];
  const values=[['Objetivo',s.goal],['Nivel',s.level],['Disponibilidad semanal',s.availability?`${s.availability} días`:null],['Duración por sesión',s.sessionMinutes?`${s.sessionMinutes} min`:null],['Lugar',s.trainingPlace],['Inicio',niceDate(s.start)],['Nacimiento',s.birthDate?niceDate(s.birthDate):null],['Sexo',s.sex],['Altura',s.height?`${s.height} cm`:null],['Peso inicial',s.initialWeight?`${s.initialWeight} kg`:null],['Estado',s.status]];
  const sections={
    overview:()=>`<div class="grid two"><div class="card"><h3>Evaluación inicial</h3><div class="profile-grid">${values.map(([label,value])=>`<div><small>${label}</small><strong>${shown(value)}</strong></div>`).join('')}</div><h3 class="subheading">Experiencia previa</h3><p class="hint long-text">${shown(s.experience)}</p><h3>Lesiones o limitaciones relevantes</h3><p class="hint long-text">${shown(s.limitations)}</p><h3>Equipamiento disponible</h3><p class="hint long-text">${shown(s.equipment)}</p><h3>Contexto y observaciones</h3><p class="hint long-text">${shown(s.notes)}</p><h3>Observaciones del entrenador</h3><p class="hint long-text">${shown(s.trainerNotes)}</p></div><div class="card"><h3>Último control</h3>${(()=>{const c=recent(state.checkins.filter(x=>x.studentId===s.id))[0];return c?`<p class="muted">${niceDate(c.date)}</p><div class="metric"><strong>${shown(c.weight)}</strong> kg</div><p class="hint">Cintura ${shown(c.waist)} cm · Ombligo ${shown(c.navel)} cm</p>`:empty('Todavía no hay controles.','Registrar progreso','checkin-new')})()}</div></div>`,
    plans:()=>`<div class="section-head"><h2>Bloques de ${esc(s.name)}</h2><button class="primary" data-action="plan-new" data-sid="${s.id}">+ Nuevo bloque</button></div>${state.plans.filter(x=>x.studentId===s.id).map(planCard).join('')||empty('Todavía no hay rutinas asignadas.')}`,
    progress:()=>`<div class="section-head"><h2>Controles y fuerza</h2><div class="detail-actions"><button class="secondary" data-action="session-new" data-sid="${s.id}">+ Sesión</button><button class="primary" data-action="checkin-new" data-sid="${s.id}">+ Control</button></div></div>${controlsFor(s.id)}<div class="section-head"><h2>Sesiones realizadas</h2></div>${sessionTable(s.id)}`,
    photos:()=>`<div class="section-head"><div><h2>Fotos de evolución</h2><p class="hint">Las imágenes anteriores siguen disponibles en este navegador. Las nuevas referencias se vinculan a una fecha o control; adjuntar archivos queda pendiente.</p></div><button class="primary" data-action="photo-new" data-sid="${s.id}">+ Referencia de foto</button></div>${photoCards(s.id)}`
  };
  return `<button class="ghost" data-action="back">← Volver</button><div class="card detail-head"><span class="avatar">${esc(initials(s.name))}</span><div><h2>${esc(s.name)}</h2><p>${esc(s.goal||'Sin objetivo')} · ${esc(s.status||'Activo')}</p></div><div class="detail-actions"><button class="secondary" data-action="student-edit" data-id="${s.id}">Editar ficha</button><button class="ghost" data-action="student-delete" data-id="${s.id}">Eliminar</button></div></div><div class="tabs">${tabs.map(([key,label])=>`<button data-tab="${key}" class="${detailTab===key?'selected':''}">${label}</button>`).join('')}</div>${sections[detailTab]()}`;
};

progressPanel=function(){const sid=$('#progress-student')?.value;if(!sid){$('#progress-panel').innerHTML=empty('Elegí un alumno para ver su evolución.');return}$('#progress-panel').innerHTML=`<div class="section-head"><h2>${esc(studentName(sid))}</h2><button class="primary" data-action="checkin-new" data-sid="${sid}">+ Registrar progreso</button></div>${controlsFor(sid)}<div class="section-head"><h2>Sesiones realizadas</h2><button class="secondary" data-action="session-new" data-sid="${sid}">+ Registrar sesión</button></div>${sessionTable(sid)}`};
render();
