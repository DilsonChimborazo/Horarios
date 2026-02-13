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

// ================= HORAS =================

var HORAS_FULL = 44 / 6; 

var HORAS_PART_DOMINGO = 44 / 6;
var HORAS_PART_SEMANA = (36 - HORAS_PART_DOMINGO) / 5;

var TOPE = { 
  "Full time":44, 
  "Part time":36
};

// ================= FUNCIONES DE TIEMPO =================

function sumarHoras(hora, horasDecimal){
  let [h,m] = hora.split(":").map(Number);
  let totalMin = h*60 + m + Math.round(horasDecimal*60);
  let nuevaH = Math.floor(totalMin/60);
  let nuevaM = totalMin%60;
  return `${String(nuevaH).padStart(2,"0")}:${String(nuevaM).padStart(2,"0")}`;
}

// ================= DESCANSOS =================

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
  return t==="MANANA" ? "Mañana" : "Tarde";
}

function esManana(t){ return t==="MANANA"; }
function esTarde(t){ return t==="TARDE"; }

// ================= GENERADOR =================

function generarSemana(){

  if(!validarDescansos()){
    alert("Debes asignar todos los descansos");
    return;
  }

  let tbody = document.getElementById("tabla");
  tbody.innerHTML = "";

  let horas = {};

  for(let d=0; d<DIAS.length; d++){

    let dia = DIAS[d];
    let regs = [];

    EMPLEADOS.forEach((emp,i)=>{

      let inicio="", fin="", h=0;

      // DESCANSO
      if(DESCANSOS_CONFIG[emp.nombre] === dia){
        inicio="";
        fin="";
        h=0;
      }

      // FULL TIME
      else if(emp.tipo==="Full time"){

        h = HORAS_FULL;

        // Mañanas variables
        if(i%2===0){
          inicio = (i%3===0) ? "07:00" : "08:00";
          fin = sumarHoras(inicio, h);
        }
        // Tardes variables con salida hasta 22:00
        else{
          fin = (i%3===0) ? "22:00" : "21:40";
          inicio = sumarHoras(fin, -h);
        }
      }

      // PART TIME
      else{

        // Domingo 7h20
        if(dia==="Domingo"){
          h = HORAS_PART_DOMINGO;
          inicio = (i%2===0) ? "07:00" : "08:00";
          fin = sumarHoras(inicio, h);
        }
        // Semana 5h44
        else{
          h = HORAS_PART_SEMANA;

          if(i%2===0){
            inicio = "08:00";
            fin = sumarHoras(inicio, h);
          }else{
            fin = "22:00";
            inicio = sumarHoras(fin, -h);
          }
        }
      }

      horas[emp.nombre] = horas[emp.nombre] || 0;

      // No superar tope semanal
      if(horas[emp.nombre] + h > TOPE[emp.tipo]){
        inicio="";
        fin="";
        h=0;
      }

      horas[emp.nombre] += h;

      regs.push({
        dia: dia.toLowerCase(),
        nombre: emp.nombre,
        cargo: CARGO_VISIBLE[emp.nombre],
        categoria: emp.tipo,
        turno: h===0 ? "DESCANSO" : (inicio < "12:00" ? "MANANA" : "TARDE"),
        inicio,
        fin,
        horas: h
      });
    });

    
    regs.forEach(r=>{
      let cls = r.turno==="DESCANSO"
        ? "descanso"
        : (r.turno==="MANANA" ? "manana" : "tarde");

      tbody.innerHTML += `
        <tr class="${cls}">
          <td>${r.dia}</td>
          <td>${r.nombre}</td>
          <td>${r.cargo}</td>
          <td>${r.categoria}</td>
          <td>${nombreTurno(r.turno)}</td>
          <td>${r.inicio}</td>
          <td>${r.fin}</td>
          <td>${r.horas.toFixed(2)}</td>
        </tr>`;
    });
  }

  // -------- RESUMEN --------
  let res = document.getElementById("resumen");
  res.innerHTML="<h3>Resumen semanal</h3>";

  Object.keys(horas).forEach(n=>{
    let tipo = EMPLEADOS.find(e=>e.nombre===n).tipo;
    let ok = horas[n].toFixed(2) == TOPE[tipo];
    res.innerHTML += `<p>${ok?"✅":"⚠️"} <b>${n}:</b> ${horas[n].toFixed(2)} horas</p>`;
  });
}

// ================= FILTRO =================

function filtrarDia(){
  let d=document.getElementById("filtroDia").value;
  document.querySelectorAll("#tabla tr").forEach(r=>{
    r.style.display = (d==="Todos" || r.children[0].innerText===d.toLowerCase()) ? "" : "none";
  });
}
