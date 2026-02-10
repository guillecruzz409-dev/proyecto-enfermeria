/*************************************************
 * Sistema de Apoyo Quirúrgico — Demo (local)
 * - Roles: admin, estudiante, estudiante_rotante, profesional_planta, profesional_visitante
 * - Profesional: paciente obligatorio antes de checklist
 * - Checklist: Momentos 1-2-3, secciones por rol, observaciones, destino, firmas
 * - Persistencia: localStorage
 *************************************************/

const KEY = "saq_demo_v1";
const $ = (id) => document.getElementById(id);

const ROLE_LABEL = {
  admin: "Administrador",
  estudiante: "Estudiante",
  estudiante_rotante: "Estudiante (Rotante)",
  profesional_planta: "Profesional – Planta",
  profesional_visitante: "Profesional – Visitante",
};

const MENU = {
  admin: [
    { id:"home", label:"Inicio", ico:"🏠" },
    { id:"admin", label:"Gestión de usuarios", ico:"👤" },
  ],
  estudiante: [
    { id:"home", label:"Inicio", ico:"🏠" },
    { id:"biblioteca", label:"Biblioteca", ico:"📚" },
  ],
  estudiante_rotante: [
    { id:"home", label:"Inicio", ico:"🏠" },
    { id:"biblioteca", label:"Biblioteca", ico:"📚" },
  ],
  profesional_planta: [
    { id:"home", label:"Inicio", ico:"🏠" },
    { id:"paciente", label:"Datos del paciente", ico:"🧾" },
    { id:"checklist", label:"Checklist quirúrgico", ico:"✅", requiresPatient:true },
  ],
  profesional_visitante: [
    { id:"home", label:"Inicio", ico:"🏠" },
    { id:"paciente", label:"Datos del paciente", ico:"🧾" },
    { id:"checklist", label:"Checklist quirúrgico", ico:"✅", requiresPatient:true },
  ],
};

function nowAR(){
  return new Date().toLocaleString("es-AR", {hour12:false});
}

function defaultState(){
  return {
    session: null, // {username, role}
    users: [
      { username:"admin", password:"admin123", role:"admin", active:true, createdAt: nowAR() }
    ],
    patient: {
      name:"", hc:"", proc:"", serv:"", savedAt:null
    },
    checklist: buildChecklistModel(),
    log: [],
  };
}

function buildChecklistModel(){
  // Estructura FINAL que definiste (Momentos/Secciones/Items)
  const moments = [
    {
      id:"m1",
      title:"Momento 1 — Antes de la inducción anestésica",
      note:"Verificación previa a la anestesia. Secciones por rol.",
      sections: [
        {
          id:"m1a",
          title:"Sección A — Instrumentador/a / Enfermería",
          items: [
            "Identidad del paciente confirmada",
            "Procedimiento quirúrgico confirmado",
            "Sitio quirúrgico correcto y marcado",
            "Consentimiento informado verificado",
          ],
          obsKey: null,
        },
        {
          id:"m1b",
          title:"Sección B — Anestesiólogo",
          items: [
            "Control del equipamiento de anestesia",
            "Verificación de existencia de alergias conocidas",
            "Oxímetro de pulso colocado y funcionando",
            "El equipo quirúrgico conoce las comorbilidades del paciente",
            "Chequeo de vías aéreas (riesgo de aspiración)",
            "En caso de existir riesgo, se constató disponibilidad de equipos y ayuda",
            "Verificación de profilaxis antibiótica administrada en los últimos 60 minutos (si corresponde)",
          ],
          obsKey: "obs_m1b",
        },
        {
          id:"m1c",
          title:"Sección C — Cirujano",
          items: [
            "Procedimiento quirúrgico confirmado",
            "Sitio quirúrgico confirmado",
            "Eventos críticos previstos comunicados al equipo",
            "Verificación de riesgo de hemorragia mayor a 500 ml",
            "En niños: mayor a 7 ml/kg",
            "En caso de existir riesgo, se previó disponibilidad de accesos venosos adecuados y sangre",
          ],
          obsKey: null,
        },
        {
          id:"m1d",
          title:"Sección D — Profilaxis antibiótica",
          items: [
            "Profilaxis antibiótica indicada",
            "Profilaxis antibiótica administrada (si corresponde)",
          ],
          obsKey: null,
        },
        {
          id:"m1e",
          title:"Sección E — Cirujano / Instrumentador/a",
          items: [
            "Cirujano e instrumentador/a verificaron los materiales protésicos necesarios",
            "Confirmación de esterilidad del instrumental",
            "Chequeo del correcto funcionamiento de todos los equipos necesarios",
          ],
          obsKey: null,
        },
      ]
    },
    {
      id:"m2",
      title:"Momento 2 — Antes de la incisión cutánea (Pausa quirúrgica)",
      note:"Todo el equipo presente. Confirmaciones verbales y revisión de riesgos.",
      sections: [
        {
          id:"m2a",
          title:"Sección A — Circulante",
          items: [
            "Confirmación de presentación de todos los miembros del equipo con nombre y función (cirujano, ayudantes, anestesiólogo, instrumentador/a, circulante, otros si corresponde)",
          ],
          obsKey: null,
        },
        {
          id:"m2b",
          title:"Sección B — Confirmación verbal (equipo completo)",
          items: [
            "Identidad del paciente confirmada verbalmente",
            "Procedimiento quirúrgico confirmado verbalmente",
            "Sitio quirúrgico confirmado verbalmente",
          ],
          obsKey: null,
        },
        {
          id:"m2c",
          title:"Sección C — Cirujano",
          items: [
            "Revisión en voz alta de los pasos críticos del procedimiento",
            "Identificación de posibles eventos imprevistos",
            "Estimación de pérdida sanguínea esperada",
            "Confirmación de disponibilidad de material e instrumental específico",
          ],
          obsKey: null,
        },
        {
          id:"m2d",
          title:"Sección D — Anestesiólogo",
          items: [
            "Revisión en voz alta de posibles problemas específicos del paciente",
            "Confirmación de estabilidad hemodinámica previa a la incisión",
            "Verificación de monitoreo adecuado durante el procedimiento",
          ],
          obsKey: null,
        },
        {
          id:"m2e",
          title:"Sección E — Instrumentador/a",
          items: [
            "Confirmación de disponibilidad de instrumental e insumos necesarios",
            "Confirmación de esterilidad del campo quirúrgico",
            "Verificación del correcto posicionamiento del paciente",
          ],
          obsKey: "obs_m2",
        },
      ]
    },
    {
      id:"m3",
      title:"Momento 3 — Antes de la salida del paciente del quirófano",
      note:"Cierre seguro del procedimiento y documentación final.",
      sections: [
        {
          id:"m3a",
          title:"Sección A — Instrumentador/a / Circulante",
          items: [
            "Nombre del procedimiento realizado",
            "Recuento de instrumental",
            "Recuento de agujas",
            "No procede (cuando corresponda)",
            "Rotulado de muestras correcto",
            "Se detectaron problemas relacionados con el instrumental y/o los equipos",
            "Cirujano, anestesista y circulante revisan los principales aspectos de la recuperación del paciente (indicaciones postquirúrgicas)",
          ],
          obsKey: null,
        },
        {
          id:"m3b",
          title:"Sección B — Cirujano",
          items: [
            "Confirmación del procedimiento quirúrgico realizado",
            "Comunicación de hallazgos relevantes",
          ],
          obsKey: null,
        },
        {
          id:"m3d",
          title:"Sección D — Anestesiólogo",
          items: [
            "Evaluación del estado del paciente al finalizar el procedimiento",
            "Indicaciones anestésicas postoperatorias registradas",
            "Control de normotermia postoperatoria",
          ],
          obsKey: null,
        },
        {
          id:"m3e",
          title:"Sección E — Equipo quirúrgico (antes de la salida del quirófano)",
          items: [
            "Parte quirúrgico completo",
            "Parte anestésico completo",
            "Chequeo de egreso del paciente con sus respectivos estudios",
            "Ficha obstétrica (si corresponde)",
            "Monitoreo fetal (si corresponde)",
          ],
          obsKey: null,
          destination: true,
        },
      ],
      signatures: true
    }
  ];

  // Estado: checkboxes + observaciones + destino + firmas
  const checks = {};
  moments.forEach(m=>{
    m.sections.forEach(s=>{
      s.items.forEach(txt=>{
        const key = `${s.id}::${txt}`;
        checks[key] = false;
      });
    });
  });

  return {
    moments,
    checks,
    observations: {
      obs_m1b: "",
      obs_m2: "",
    },
    destination: "", // Piso / Unidad coronaria / Terapia intensiva / Cirugía ambulatoria
    signatures: {
      inst_aseptico: false,
      cirujano: false,
      inst_circulante: false,
      anestesiologo: false,
    }
  };
}

let state = load();

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaultState();
    const s = JSON.parse(raw);

    // harden
    if(!Array.isArray(s.users)) s.users = [];
    if(!s.users.some(u=>u.username==="admin")){
      s.users.unshift({ username:"admin", password:"admin123", role:"admin", active:true, createdAt: nowAR() });
    }
    if(!s.patient) s.patient = defaultState().patient;
    if(!s.checklist) s.checklist = buildChecklistModel();
    if(!Array.isArray(s.log)) s.log = [];
    return s;
  }catch{
    return defaultState();
  }
}

function save(reason="update"){
  localStorage.setItem(KEY, JSON.stringify(state));
  renderAll();
}

function logAction(action, detail=""){
  const line = `[${nowAR()}] ${action}${detail ? " — " + detail : ""}`;
  state.log.unshift(line);
  state.log = state.log.slice(0, 200);
}

function openModal(title, html){
  $("mTitle").textContent = title;
  $("mBody").innerHTML = html;
  $("overlay").classList.remove("hidden");
}
function closeModal(){
  $("overlay").classList.add("hidden");
}

function roleLabel(role){ return ROLE_LABEL[role] || role; }
function isProfessional(role){ return role === "profesional_planta" || role === "profesional_visitante"; }
function isStudent(role){ return role === "estudiante" || role === "estudiante_rotante"; }

function hasPatient(){
  const p = state.patient;
  return !!(p.name && p.hc && p.proc && p.savedAt);
}

function login(username, password){
  const u = state.users.find(x => x.username.toLowerCase() === username.toLowerCase());
  if(!u){ openModal("Acceso", "<p>Usuario no encontrado.</p>"); return; }
  if(!u.active){ openModal("Acceso", "<p>Usuario deshabilitado.</p>"); return; }
  if(u.password !== password){ openModal("Acceso", "<p>Contraseña incorrecta.</p>"); return; }

  state.session = { username: u.username, role: u.role };
  logAction("Inicio de sesión", `${u.username} (${u.role})`);
  save("login");
  go("home");
}

function logout(){
  if(state.session) logAction("Cierre de sesión", state.session.username);
  state.session = null;
  save("logout");
  go("login");
}

function go(viewId){
  // permissions
  if(viewId !== "login" && !state.session){
    viewId = "login";
  }
  if(viewId === "admin" && state.session?.role !== "admin"){
    viewId = "home";
  }
  if(viewId === "paciente" && !isProfessional(state.session?.role)){
    viewId = "home";
  }
  if(viewId === "checklist" && !isProfessional(state.session?.role)){
    viewId = "home";
  }
  if(viewId === "checklist" && isProfessional(state.session?.role) && !hasPatient()){
    // se muestra warning en checklist
  }
  if(viewId === "biblioteca" && !isStudent(state.session?.role)){
    viewId = "home";
  }

  // show/hide views
  const views = ["login","home","admin","paciente","checklist","biblioteca"];
  views.forEach(v=>{
    const el = $(`view-${v}`);
    if(el) el.classList.toggle("hidden", v !== viewId);
  });

  // active menu
  document.querySelectorAll("#menu a").forEach(a=>{
    a.classList.toggle("active", a.dataset.view === viewId);
  });

  renderContext();
  if(viewId === "checklist") renderChecklist();
}

function renderMenu(){
  const nav = $("menu");
  nav.innerHTML = "";
  if(!state.session){
    nav.innerHTML = `<a class="active" href="#" data-view="login"><span class="ico">🔐</span>Acceso</a>`;
    return;
  }
  const role = state.session.role;
  const items = MENU[role] || [{id:"home",label:"Inicio",ico:"🏠"}];

  items.forEach(it=>{
    const a = document.createElement("a");
    a.href = "#";
    a.dataset.view = it.id;
    a.innerHTML = `<span class="ico">${it.ico}</span>${it.label}`;

    // disabled if requires patient
    if(it.requiresPatient && !hasPatient()){
      a.classList.add("disabled");
      a.title = "Requiere registrar datos del paciente";
    }

    a.addEventListener("click", (e)=>{
      e.preventDefault();
      go(it.id);
    });
    nav.appendChild(a);
  });
}

function renderHeader(){
  const chip = $("chipSession");
  const btn = $("btnLogout");

  if(!state.session){
    chip.textContent = "🔒 Sin sesión";
    btn.disabled = true;
    $("uName").textContent = "—";
    $("uRole").textContent = "—";
    $("sideMeta").textContent = "Acceso institucional";
    return;
  }
  chip.textContent = `✅ ${state.session.username} · ${roleLabel(state.session.role)}`;
  btn.disabled = false;
  $("uName").textContent = state.session.username;
  $("uRole").textContent = roleLabel(state.session.role);
  $("sideMeta").textContent = "Sesión activa";
}

function renderContext(){
  // Home KPIs
  $("kpiPatient").textContent = hasPatient() ? `${state.patient.name} (HC ${state.patient.hc})` : "—";
  $("kpiChecklist").textContent = `${progressPercent()}%`;
  $("kpiSign").textContent = `${signatureCount()}/4`;

  // Patient state box
  $("st_patient").textContent = hasPatient() ? `${state.patient.name} (HC ${state.patient.hc})` : "—";
  $("st_check").textContent = `${progressPercent()}%`;
  $("st_sign").textContent = `${signatureCount()}/4`;
  $("st_last").textContent = state.log[0] ? state.log[0].slice(0, 55) + (state.log[0].length>55?"…":"") : "—";

  // Checklist context
  $("ctx_patient").textContent = hasPatient()
    ? `${state.patient.name} — HC ${state.patient.hc} — ${state.patient.proc}`
    : "—";

  $("warnNeedPatient").classList.toggle("hidden", hasPatient());
  $("logBox").value = state.log.slice(0, 30).join("\n");

  $("sum_progress").textContent = `${progressPercent()}%`;
  $("sum_moment").textContent = currentMomentName();
  $("sum_sign").textContent = `${signatureCount()}/4`;
  $("sum_obs").textContent = observationsSummary();

  // biblioteca placeholders
  renderPDFs();
}

function renderPDFs(){
  const box = $("pdfList");
  if(!box) return;
  const items = [
    {t:"Manual de instrumentación (PDF)", n:"Placeholder"},
    {t:"Checklist quirúrgico (PDF)", n:"Placeholder"},
    {t:"Bioseguridad y esterilización (PDF)", n:"Placeholder"},
  ];
  box.innerHTML = items.map(x => `
    <div class="userItem">
      <div>
        <div style="font-weight:900">${escapeHtml(x.t)}</div>
        <div class="userMeta">${escapeHtml(x.n)}</div>
      </div>
      <span class="badge good">Lectura</span>
    </div>
  `).join("");
}

function escapeHtml(s){
  return (s ?? "").toString().replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

/* ---------- Admin ---------- */
function seedUsers(){
  const demo = [
    { username:"estudiante.demo", password:"demo123", role:"estudiante" },
    { username:"rotante.demo", password:"demo123", role:"estudiante_rotante" },
    { username:"planta.demo", password:"demo123", role:"profesional_planta" },
    { username:"visitante.demo", password:"demo123", role:"profesional_visitante" },
  ];
  demo.forEach(d=>{
    if(!state.users.some(u=>u.username === d.username)){
      state.users.push({ ...d, active:true, createdAt: nowAR() });
    }
  });
  logAction("Admin", "Creó usuarios demo");
  save("seed");
}

function createUser(){
  const u = $("newUser").value.trim();
  const p = $("newPass").value.trim();
  const r = $("newRole").value;
  if(!u || !p){ openModal("Admin", "<p>Complete usuario y contraseña.</p>"); return; }
  if(state.users.some(x=>x.username.toLowerCase() === u.toLowerCase())){
    openModal("Admin", "<p>Ese usuario ya existe.</p>"); return;
  }
  state.users.push({ username:u, password:p, role:r, active:true, createdAt: nowAR() });
  logAction("Admin", `Creó usuario: ${u} (${r})`);
  $("newUser").value = "";
  $("newPass").value = "";
  save("user_create");
}

function toggleUser(username){
  const u = state.users.find(x=>x.username===username);
  if(!u) return;
  u.active = !u.active;
  logAction("Admin", `${u.active ? "Habilitó" : "Deshabilitó"}: ${username}`);
  save("user_toggle");
}

function resetPass(username){
  const u = state.users.find(x=>x.username===username);
  if(!u) return;
  openModal("Restablecer contraseña", `
    <p>Usuario: <strong>${escapeHtml(username)}</strong></p>
    <div class="field" style="margin-top:10px">
      <label>Nueva contraseña</label>
      <input id="np" placeholder="Ej: nueva123">
    </div>
    <div class="row">
      <button class="btn" id="cX" type="button">Cancelar</button>
      <button class="btn primary" id="cOk" type="button">Guardar</button>
    </div>
  `);
  setTimeout(()=>{
    $("cX").onclick = closeModal;
    $("cOk").onclick = ()=>{
      const v = $("np").value.trim();
      if(!v) return;
      u.password = v;
      logAction("Admin", `Reseteó contraseña: ${username}`);
      closeModal();
      save("pass_reset");
    };
  }, 0);
}

function renderUsers(){
  const box = $("usersList");
  if(!box) return;
  const list = state.users.filter(u=>u.username!=="admin");
  if(list.length===0){
    box.innerHTML = `<div class="userItem"><div><div style="font-weight:900">Sin usuarios</div><div class="userMeta">Cree usuarios para probar perfiles.</div></div><span class="badge warn">0</span></div>`;
    return;
  }
  box.innerHTML = list.map(u=>`
    <div class="userItem">
      <div>
        <div style="font-weight:900">${escapeHtml(u.username)}</div>
        <div class="userMeta">${escapeHtml(roleLabel(u.role))} · ${u.active ? "Activo" : "Deshabilitado"} · ${escapeHtml(u.createdAt||"")}</div>
      </div>
      <div class="row" style="margin:0">
        <button class="btn" data-act="toggle" data-user="${escapeHtml(u.username)}" type="button">${u.active?"Deshabilitar":"Habilitar"}</button>
        <button class="btn" data-act="reset" data-user="${escapeHtml(u.username)}" type="button">Reset</button>
      </div>
    </div>
  `).join("");
}

/* ---------- Paciente ---------- */
function savePatient(){
  const name = $("p_name").value.trim();
  const hc = $("p_hc").value.trim();
  const proc = $("p_proc").value.trim();
  const serv = $("p_serv").value.trim();
  if(!name || !hc || !proc){
    openModal("Paciente", "<p>Complete los campos obligatorios (nombre, HC y procedimiento).</p>");
    return;
  }
  state.patient = { name, hc, proc, serv, savedAt: nowAR() };
  logAction("Paciente", `Guardado: ${name} (HC ${hc})`);
  save("patient_save");

  $("savedMsg").classList.remove("hidden");
  setTimeout(()=> $("savedMsg").classList.add("hidden"), 1400);
}

/* ---------- Checklist render / logic ---------- */
function renderChecklist(){
  const box = $("checklistContainer");
  box.innerHTML = "";

  // Gating: paciente requerido
  if(!hasPatient()){
    $("warnNeedPatient").classList.remove("hidden");
  }

  state.checklist.moments.forEach(m=>{
    const momentEl = document.createElement("div");
    momentEl.className = "moment";
    const done = momentDone(m);
    momentEl.innerHTML = `
      <div class="momentHead">
        <div>
          <h3>${escapeHtml(m.title)}</h3>
          <p>${escapeHtml(m.note)}</p>
        </div>
        <span class="badge ${done ? "good" : "warn"}">${done ? "Completo" : "Pendiente"}</span>
      </div>
      <div class="momentBody" id="body_${m.id}"></div>
    `;
    box.appendChild(momentEl);

    const body = momentEl.querySelector(`#body_${m.id}`);

    m.sections.forEach(s=>{
      const st = document.createElement("div");
      st.innerHTML = `<div class="sectionTitle">${escapeHtml(s.title)}</div>`;
      body.appendChild(st);

      s.items.forEach(txt=>{
        const key = `${s.id}::${txt}`;
        const checked = !!state.checklist.checks[key];

        const item = document.createElement("div");
        item.className = "checkItem";
        item.innerHTML = `
          <div class="txt">
            ${escapeHtml(txt)}
          </div>
          <div>
            <input type="checkbox" ${checked ? "checked":""} data-key="${escapeHtml(key)}" ${(!hasPatient() ? "disabled":"")}/>
          </div>
        `;
        body.appendChild(item);
      });

      // Observaciones (si corresponde)
      if(s.obsKey){
        const obs = document.createElement("div");
        obs.className = "field";
        obs.innerHTML = `
          <label>Observación</label>
          <textarea data-obs="${escapeHtml(s.obsKey)}" placeholder="Escriba observaciones...">${escapeHtml(state.checklist.observations[s.obsKey] || "")}</textarea>
        `;
        body.appendChild(obs);
      }

      // Destino (solo momento 3 sección E)
      if(s.destination){
        const dest = document.createElement("div");
        dest.className = "field";
        dest.innerHTML = `
          <label>Destino del paciente</label>
          <div class="radioRow">
            ${radioOpt("Piso")}
            ${radioOpt("Unidad coronaria")}
            ${radioOpt("Terapia intensiva")}
            ${radioOpt("Cirugía ambulatoria")}
          </div>
        `;
        body.appendChild(dest);
      }
    });

    // Firmas al final del Momento 3
    if(m.signatures){
      const sig = document.createElement("div");
      sig.className = "field";
      sig.innerHTML = `
        <div class="hr"></div>
        <div class="sectionTitle">Validación final — Firmas</div>
        <div class="signatureGrid">
          ${sigCheck("inst_aseptico", "Instrumentador/a aséptico")}
          ${sigCheck("cirujano", "Firma y sello del cirujano")}
          ${sigCheck("inst_circulante", "Instrumentador/a circulante")}
          ${sigCheck("anestesiologo", "Firma y sello del anestesiólogo")}
        </div>
      `;
      body.appendChild(sig);
    }
  });

  renderContext();
}

function radioOpt(label){
  const checked = state.checklist.destination === label;
  return `
    <label>
      <input type="radio" name="destino" value="${escapeHtml(label)}" ${checked ? "checked":""} ${(!hasPatient() ? "disabled":"")}/>
      ${escapeHtml(label)}
    </label>
  `;
}

function sigCheck(key, label){
  const checked = !!state.checklist.signatures[key];
  return `
    <label class="checkItem" style="margin:0">
      <div class="txt">${escapeHtml(label)}</div>
      <div><input type="checkbox" data-sign="${escapeHtml(key)}" ${checked?"checked":""} ${(!hasPatient() ? "disabled":"")}/></div>
    </label>
  `;
}

function momentDone(moment){
  // Momento completo si todas las checks de sus secciones están true
  let keys = [];
  moment.sections.forEach(s=>{
    s.items.forEach(txt=> keys.push(`${s.id}::${txt}`));
  });
  const ok = keys.every(k => state.checklist.checks[k] === true);

  // extra: si tiene destino, que esté seleccionado
  const hasDest = moment.sections.some(s=>s.destination);
  if(hasDest && !state.checklist.destination) return false;

  // extra: si es m3 y tiene firmas, todas true
  if(moment.signatures){
    const s = state.checklist.signatures;
    const all = s.inst_aseptico && s.cirujano && s.inst_circulante && s.anestesiologo;
    return ok && all;
  }
  return ok;
}

function totalItems(){
  return Object.keys(state.checklist.checks).length;
}
function doneItems(){
  return Object.values(state.checklist.checks).filter(Boolean).length;
}
function progressPercent(){
  const t = totalItems();
  if(t===0) return 0;
  const p = Math.round((doneItems()/t)*100);
  return Math.max(0, Math.min(100, p));
}
function signatureCount(){
  const s = state.checklist.signatures;
  return [s.inst_aseptico, s.cirujano, s.inst_circulante, s.anestesiologo].filter(Boolean).length;
}
function observationsSummary(){
  const o1 = (state.checklist.observations.obs_m1b || "").trim();
  const o2 = (state.checklist.observations.obs_m2 || "").trim();
  const n = (o1?1:0) + (o2?1:0);
  return n === 0 ? "—" : `${n} cargada(s)`;
}
function currentMomentName(){
  // primer momento no completado
  const m = state.checklist.moments.find(x => !momentDone(x));
  return m ? m.title : "Completado";
}

function resetChecklist(){
  state.checklist = buildChecklistModel();
  logAction("Checklist", "Reinicio completo");
  save("reset_checklist");
}

/* ---------- Patient search (simple demo) ---------- */
function searchPatient(){
  const q = ($("searchPatient").value || "").trim().toLowerCase();
  if(!q){
    openModal("Búsqueda", "<p>Ingrese HC o apellido para buscar.</p>");
    return;
  }
  const p = state.patient;
  if(!p.savedAt){
    openModal("Búsqueda", "<p>No hay paciente registrado.</p>");
    return;
  }
  const ok = (p.hc || "").toLowerCase().includes(q) || (p.name || "").toLowerCase().includes(q);
  openModal("Búsqueda", ok
    ? `<p>Paciente encontrado:</p><p><strong>${escapeHtml(p.name)}</strong> — HC ${escapeHtml(p.hc)} — ${escapeHtml(p.proc)}</p>`
    : `<p>No se encontró coincidencia en el paciente registrado.</p>`
  );
}

/* ---------- Export log ---------- */
function exportLog(){
  const text = state.log.join("\n") || "Sin registros.";
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "registro_saq_demo.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- Render all ---------- */
function renderAll(){
  renderHeader();
  renderMenu();

  // users list for admin
  if(state.session?.role === "admin"){
    renderUsers();
  }

  // keep patient inputs in sync when visiting page
  if(isProfessional(state.session?.role)){
    $("p_name").value = state.patient.name || "";
    $("p_hc").value = state.patient.hc || "";
    $("p_proc").value = state.patient.proc || "";
    $("p_serv").value = state.patient.serv || "";
  }

  renderContext();
}

/* ---------- Events wiring ---------- */
$("btnCloseModal").addEventListener("click", closeModal);
$("overlay").addEventListener("click", (e)=>{ if(e.target.id==="overlay") closeModal(); });

$("btnLogin").addEventListener("click", ()=>{
  login($("inpUser").value.trim(), $("inpPass").value.trim());
});
$("btnDemoAdmin").addEventListener("click", ()=>{
  $("inpUser").value = "admin";
  $("inpPass").value = "admin123";
  login("admin","admin123");
});
$("btnForgot").addEventListener("click", ()=>{
  const u = $("inpUser").value.trim();
  logAction("Recuperación", `Solicitud para ${u || "(sin usuario)"}`);
  save("forgot");
  openModal("Recuperación (simulada)", "<p>Se registró solicitud de recuperación (demo).</p>");
});
$("btnLogout").addEventListener("click", logout);

$("btnCreateUser").addEventListener("click", ()=>{
  if(state.session?.role !== "admin") return;
  createUser();
});
$("btnSeed").addEventListener("click", ()=>{
  if(state.session?.role !== "admin") return;
  seedUsers();
});

document.addEventListener("click", (e)=>{
  const b = e.target.closest("[data-act]");
  if(!b) return;
  if(state.session?.role !== "admin") return;
  const act = b.dataset.act;
  const user = b.dataset.user;
  if(act === "toggle") toggleUser(user);
  if(act === "reset") resetPass(user);
});

$("#btnSavePatient").addEventListener("click", async () => {
  if (!isProfessional(state.session.role)) return;

  const procedureId = await savePatient();   // 🔑 guarda / actualiza
  state.procedureId = procedureId;            // 🔒 ID ÚNICO

  console.log("🎧 Escuchando procedimiento:", state.procedureId);

  listenRealtime();                           // 👂 ahora sí escucha
  renderMenu();                               // 🎨 render final
});


async function savePatient() {
  // 🔑 ID ÚNICO DEL PROCEDIMIENTO (el mismo para todos)
  const id = state.procedureId;

  await db.collection("procedimientos")
    .doc(id)
    .set({
      paciente: state.patient,
      checklist: state.checklist,
      log: state.log || [],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      creadoPor: state.session.user
    }, { merge: true });

  return id;
}


$("btnSearchPatient").addEventListener("click", searchPatient);

$("btnExportLog").addEventListener("click", exportLog);

$("btnResetChecklist").addEventListener("click", ()=>{
  openModal("Reiniciar checklist", `
    <p>Esto reinicia checks, destino, observaciones y firmas.</p>
    <div class="row">
      <button class="btn" id="rx" type="button">Cancelar</button>
      <button class="btn danger" id="rok" type="button">Reiniciar</button>
    </div>
  `);
  setTimeout(()=>{
    $("rx").onclick = closeModal;
    $("rok").onclick = ()=>{
      closeModal();
      resetChecklist();
      renderChecklist();
    };
  },0);
});

// Checklist interactions (delegation)
document.addEventListener("change", (e)=>{
  // checkbox items
  const cb = e.target.closest('input[type="checkbox"][data-key]');
  if(cb){
    const key = cb.dataset.key;
    state.checklist.checks[key] = !!cb.checked;
    logAction("Checklist", `${cb.checked ? "Hecho" : "Pendiente"}: ${key.split("::")[1]}`);
    save("check");
    renderChecklist();
    return;
  }

  // observations
  const ta = e.target.closest("textarea[data-obs]");
  if(ta){
    const k = ta.dataset.obs;
    state.checklist.observations[k] = ta.value;
    logAction("Observación", k);
    save("obs");
    return;
  }

  // destination radio
  const r = e.target.closest('input[type="radio"][name="destino"]');
  if(r){
    state.checklist.destination = r.value;
    logAction("Destino", r.value);
    save("dest");
    renderChecklist();
    return;
  }

  // signatures
  const s = e.target.closest('input[type="checkbox"][data-sign]');
  if(s){
    const k = s.dataset.sign;
    state.checklist.signatures[k] = !!s.checked;
    logAction("Firma", `${k}: ${s.checked ? "confirmada" : "revocada"}`);
    save("sign");
    renderChecklist();
    return;
  }
});

// IMPORTANT: textarea input should save too (not only change)
document.addEventListener("input", (e)=>{
  const ta = e.target.closest("textarea[data-obs]");
  if(!ta) return;
  const k = ta.dataset.obs;
  state.checklist.observations[k] = ta.value;
  save("obs_typing");
});

/* ---------- Init ---------- */
renderAll();
go(state.session ? "home" : "login");
// 🔴 TIEMPO REAL - PROCEDIMIENTO ACTIVO
function listenRealtime(procedureId) {
  if (!window.db) {
    console.error("No existe db (Firestore)");
    return;
  }

  window.db
    .collection("procedimientos")
    .doc(procedureId)
    .onSnapshot((doc) => {
      if (!doc.exists) return;

      const data = doc.data();
      console.log("🔥 Cambio en tiempo real:", data);

      if (data.paciente) state.patient = data.paciente;
      if (data.checklist) state.checklist = data.checklist;
      if (data.log) state.log = data.log;

      renderAll();
    });
}

// Llamalo al iniciar
listenRealtime();
