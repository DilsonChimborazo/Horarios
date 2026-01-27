console.log("logic.js OK");

// ================= DATOS BASE =================

var EMPLEADOS = [
  { nombre:"Margarita", rol:"Supervisora", tipo:"Full time" },
  { nombre:"Nixabelid", rol:"Asistente", tipo:"Full time" },
  { nombre:"Laura", rol:"Asistente", tipo:"Full time" },
  { nombre:"Venus", rol:"Asistente", tipo:"Full time" },
  { nombre:"Jaime", rol:"Asistente", tipo:"Part time" },
  { nombre:"Alejandra", rol:"Asistente", tipo:"Part time" }
];

var CARGO_VISIBLE = {
  Margarita:"supervisora",
  Nixabelid:"segunda",
  Laura:"tercera",
  Venus:"asistente",
  Jaime:"asistente",
  Alejandra:"asistente"
};

var DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

var TURNOS = {
  MAÑANA:["07:00","14:30",7],
  MAÑANA_LARGA:["06:00","14:30",8],
  TARDE:["14:30","22:00",7],
  TARDE_LARGA:["13:30","22:00",8],
  PART_M:["07:00","13:30",6],
  PART_T:["15:30","22:00",6],
  PEDIDOS:["06:00","14:30",8],
  DESCANSO:["","",0]
};

var TOPE = { "Full time":44, "Part time":36 };

// ================= DESCANSOS CONFIGURADOS =================

var DESCANSOS_CONFIG = {};

function cargarTablaDescansos(){
  let tb = document.getElementById("tablaDescansos");
  tb.innerHTML = "";

  EMPLEADOS.forEach(emp=>{
    tb.innerHTML += `
      <tr>
        <td>${emp.nombre}</td>
        <td>
          <select onchange="setDescanso('${emp.nombre}', this.value)">
            <option value="">-- Seleccionar --</option>
            ${DIAS.filter(d=>d!=="Domingo").map(d=>`<option value="${d}">${d}</option>`).join("")}
          </select>
        </td>
      </tr>
    `;
  });
}

function setDescanso(nombre, dia){
  DESCANSOS_CONFIG[nombre] = dia;
}

function validarDescansos(){
  return EMPLEADOS.every(e => DESCANSOS_CONFIG[e.nombre]);
}

// ================= UTILIDADES =================

function nombreTurno(t){
  if(t==="DESCANSO") return "DESCANSO";
  if(["MAÑANA","MAÑANA_LARGA","PEDIDOS","PART_M"].includes(t)) return "Mañana";
  return "Tarde";
}

function esManana(t){
  return ["MAÑANA","MAÑANA_LARGA","PEDIDOS","PART_M"].includes(t);
}

function esTarde(t){
  return ["TARDE","TARDE_LARGA","PART_T"].includes(t);
}

// ================= GENERADOR =================

function generarSemana(){

  if(!validarDescansos()){
    alert("⚠️ los dia de descanso pendej@");
    return;
  }

  let tbody = document.getElementById("tabla");
  tbody.innerHTML = "";

  let horas={}, largos={}, ultimoLargo={};

  for(let d=0; d<DIAS.length; d++){
    let dia = DIAS[d];
    let regs=[];
    let largosM=0, largosT=0;
    let pt={Jaime:"PART_M", Alejandra:"PART_T"};

    EMPLEADOS.forEach((emp,i)=>{
      let turno="";

      if(dia==="Domingo"){
        turno = emp.tipo==="Part time" ? pt[emp.nombre] : "MAÑANA";
      }
      else if(DESCANSOS_CONFIG[emp.nombre] === dia){
        turno="DESCANSO";
      }
      else if(emp.rol==="Supervisora"){
        turno = (dia==="Miércoles"||dia==="Viernes")?"PEDIDOS":"MAÑANA";
      }
      else if(emp.tipo==="Part time"){
        turno = pt[emp.nombre];
      }
      else{
        if((largos[emp.nombre]||0)<2 && ultimoLargo[emp.nombre]!==d-1 && largosM<2){
          turno="MAÑANA_LARGA";
          largosM++; largos[emp.nombre]=(largos[emp.nombre]||0)+1; ultimoLargo[emp.nombre]=d;
        }
        else if((largos[emp.nombre]||0)<2 && ultimoLargo[emp.nombre]!==d-1 && largosT<2){
          turno="TARDE_LARGA";
          largosT++; largos[emp.nombre]=(largos[emp.nombre]||0)+1; ultimoLargo[emp.nombre]=d;
        }
        else{
          turno=i%2===0?"MAÑANA":"TARDE";
        }
      }

      let h=TURNOS[turno][2];
      horas[emp.nombre]=horas[emp.nombre]||0;

      if(dia!=="Domingo" && horas[emp.nombre]+h>TOPE[emp.tipo]){
        turno="DESCANSO"; h=0;
      }

      horas[emp.nombre]+=h;

      regs.push({
        dia:dia.toLowerCase(),
        nombre:emp.nombre,
        cargo:CARGO_VISIBLE[emp.nombre],
        categoria:emp.tipo,
        turno,
        inicio:TURNOS[turno][0],
        fin:TURNOS[turno][1],
        horas:h
      });
    });

    // -------- COBERTURA --------
    let min = dia==="Domingo" ? 3 : 2;

    function contar(){
      return {
        m: regs.filter(r=>esManana(r.turno)).length,
        t: regs.filter(r=>esTarde(r.turno)).length
      };
    }

    let c = contar(), guard=0;

    while((c.m<min || c.t<min) && guard<10){
      guard++;

      if(c.t<min){
        let r = regs.find(r=>esManana(r.turno)&&r.horas===7);
        if(r){ r.turno="TARDE"; r.inicio=TURNOS.TARDE[0]; r.fin=TURNOS.TARDE[1]; }
      }

      if(c.m<min){
        let r = regs.find(r=>esTarde(r.turno)&&r.horas===7);
        if(r){ r.turno="MAÑANA"; r.inicio=TURNOS.MAÑANA[0]; r.fin=TURNOS.MAÑANA[1]; }
      }

      c = contar();
    }

    // -------- RENDER --------
    regs.forEach(r=>{
      let cls=r.turno==="DESCANSO"?"descanso":esManana(r.turno)?"manana":"tarde";
      if(r.horas===8) cls+=" largo";

      tbody.innerHTML+=`
        <tr class="${cls}">
          <td>${r.dia}</td>
          <td>${r.nombre}</td>
          <td>${r.cargo}</td>
          <td>${r.categoria}</td>
          <td>${nombreTurno(r.turno)}</td>
          <td>${r.inicio}</td>
          <td>${r.fin}</td>
          <td>${r.horas}</td>
        </tr>`;
    });
  }

  // -------- RESUMEN --------
  let res=document.getElementById("resumen");
  res.innerHTML="<h3>Resumen semanal</h3>";
  Object.keys(horas).forEach(n=>{
    let ok=horas[n]===TOPE["Full time"]||horas[n]===TOPE["Part time"];
    res.innerHTML+=`<p>${ok?"✅":"⚠️"} <b>${n}:</b> ${horas[n]} horas</p>`;
  });
}

// ================= FILTRO =================

function filtrarDia(){
  let d=document.getElementById("filtroDia").value;
  document.querySelectorAll("#tabla tr").forEach(r=>{
    r.style.display = (d==="Todos" || r.children[0].innerText===d.toLowerCase()) ? "" : "none";
  });
}
