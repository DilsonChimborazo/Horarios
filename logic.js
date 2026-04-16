// ================= DATOS =================

var EMPLEADOS = [
  { nombre:"Sonia", tipo:"Part time" },
  { nombre:"Nixabelid", tipo:"Full time" },
  { nombre:"Laura", tipo:"Full time" },
  { nombre:"Venus", tipo:"Full time" },
  { nombre:"Jaime", tipo:"Part time" },
  { nombre:"Alejandra", tipo:"Part time" },
  { nombre:"Zahira", tipo:"Part time" },
  { nombre:"Margarita", tipo:"Full time"}
];

var DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

var HORAS_FULL = 44 / 6;
var HORAS_PART_DOM = 44 / 6;
var HORAS_PART_SEM = (36 - HORAS_PART_DOM) / 5;

var TOPE = {
  "Full time":44,
  "Part time":36
};

// ================= FUNCION PARA MOVER HORA =================

function moverHora(hora, horas){
  let [h,m] = hora.split(":").map(Number);
  let total = h*60 + m + Math.round(horas*60);
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
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
          <select id="desc1_${emp.nombre}" onchange="actualizarDescansos('${emp.nombre}')">
            <option value="">Seleccionar 1</option>
            ${DIAS.filter(d=>d!=="Domingo").map(d=>`<option>${d}</option>`).join("")}
          </select>
          <select id="desc2_${emp.nombre}" onchange="actualizarDescansos('${emp.nombre}')">
            <option value="">Ninguno (Opcional)</option>
            ${DIAS.filter(d=>d!=="Domingo").map(d=>`<option>${d}</option>`).join("")}
          </select>
        </td>
      </tr>
    `;
  });
}

function actualizarDescansos(nombre) {
  let v1 = document.getElementById("desc1_" + nombre).value;
  let v2 = document.getElementById("desc2_" + nombre).value;
  let descansos = [];
  if (v1) descansos.push(v1);
  if (v2 && v2 !== v1) descansos.push(v2);
  DESCANSOS_CONFIG[nombre] = descansos;
}

function validarDescansos(){
  return EMPLEADOS.every(e => DESCANSOS_CONFIG[e.nombre] && DESCANSOS_CONFIG[e.nombre].length > 0);
}

// ================= GENERADOR =================

function generarSemana(){

  if(!validarDescansos()){
    alert("Asigna todos los descansos");
    return;
  }

  let tbody = document.getElementById("tabla");
  tbody.innerHTML = "";

  let horas = {};

  DIAS.forEach((dia,indexDia)=>{

    let disponibles = EMPLEADOS.filter(e => !(DESCANSOS_CONFIG[e.nombre] && DESCANSOS_CONFIG[e.nombre].includes(dia)));
    let full = disponibles.filter(e => e.tipo==="Full time");
    let part = disponibles.filter(e => e.tipo==="Part time");

    let asignacion = {};
    let manana = 0;
    let tarde = 0;

    let targetManana = 3;
    let targetTarde = 3;
    let totalActivos = disponibles.length;

    if (dia === "Domingo") {
      targetManana = 4;
      targetTarde = 4;
    } else {
      if (totalActivos === 7) {
        targetManana = indexDia % 2 === 0 ? 4 : 3;
        targetTarde = totalActivos - targetManana;
      } else if (totalActivos >= 8) {
        targetManana = Math.ceil(totalActivos / 2);
        targetTarde = totalActivos - targetManana;
      } else {
        targetManana = Math.ceil(totalActivos / 2);
        if (targetManana < 3 && totalActivos === 5) targetManana = 3; // force at least 3 if possible
        targetTarde = totalActivos - targetManana;
      }
    }

    let todos = [...part, ...full];
    todos.forEach((emp, i) => {
      if (manana < targetManana && tarde < targetTarde) {
         if (i % 2 === 0) {
             asignacion[emp.nombre] = "M"; manana++;
         } else {
             asignacion[emp.nombre] = "T"; tarde++;
         }
      } else if (manana < targetManana) {
          asignacion[emp.nombre] = "M"; manana++;
      } else {
          asignacion[emp.nombre] = "T"; tarde++;
      }
    });

    // ================= REGLA FIJA MARGARITA =================
    if(asignacion["Margarita"]){

      let debeManana = ["Miércoles","Viernes","Domingo"].includes(dia);
      let turnoActual = asignacion["Margarita"];

      if(debeManana && turnoActual !== "M"){
        let candidato = full.find(e =>
          e.nombre !== "Margarita" &&
          asignacion[e.nombre] === "M"
        );
        if(candidato){
          asignacion["Margarita"] = "M";
          asignacion[candidato.nombre] = "T";
        }
      }
    }

    // ================= APERTURA ROTATIVA ENTRE FULL TIME EN MAÑANA =================
    let fullEnManana = full.filter(e => asignacion[e.nombre] === "M");
    let nombreApertura = null;

    if(fullEnManana.length > 0){
      let indice = indexDia % fullEnManana.length;
      nombreApertura = fullEnManana[indice].nombre;
    }

    // ================= RENDER =================
    EMPLEADOS.forEach(emp=>{

      let inicio="", fin="", h=0;

      if(DESCANSOS_CONFIG[emp.nombre] && DESCANSOS_CONFIG[emp.nombre].includes(dia)){
        h=0;
      }
      else{

        let turno = asignacion[emp.nombre];
        let numDescansos = (DESCANSOS_CONFIG[emp.nombre] || []).length;
        let diasTrabaja = 7 - numDescansos;

        if(emp.tipo==="Full time"){
          h = 44 / diasTrabaja;
        } else {
          h = dia==="Domingo" ? (44 / 6) : ((36 - (44 / 6)) / (diasTrabaja - 1));
        }

        if(turno==="M"){
          inicio = (emp.nombre === nombreApertura) ? "07:00" : "08:00";
          fin = moverHora(inicio,h);
        }
        else{
          fin = "22:00";
          inicio = moverHora(fin,-h);
        }
      }

      horas[emp.nombre] = horas[emp.nombre] || 0;

      if(horas[emp.nombre] + h > TOPE[emp.tipo]){
        inicio="";
        fin="";
        h=0;
      }

      horas[emp.nombre]+=h;

      let textoTurno = h===0 ? "DESCANSO" : (inicio < "12:00" ? "Mañana" : "Tarde");
      let clase = h===0 ? "descanso" : (inicio < "12:00" ? "manana" : "tarde");

      tbody.innerHTML += `
        <tr class="${clase}">
          <td>${dia.toLowerCase()}</td>
          <td>${emp.nombre}</td>
          <td>${emp.tipo}</td>
          <td>${textoTurno}</td>
          <td>${inicio}</td>
          <td>${fin}</td>
          <td>${h.toFixed(2)}</td>
        </tr>`;
    });

  });

  // ================= RESUMEN =================
  let resumen = document.getElementById("resumen");
  resumen.innerHTML = "<h3>Resumen semanal</h3>";

  Object.keys(horas).forEach(n=>{
    let tipo = EMPLEADOS.find(e=>e.nombre===n).tipo;
    let ok = horas[n].toFixed(2)==TOPE[tipo];
    resumen.innerHTML += `<p>${ok?"✅":"⚠️"} ${n}: ${horas[n].toFixed(2)} horas</p>`;
  });
}
