// ================= DATOS =================

var EMPLEADOS = [
  { nombre:"Margarita", tipo:"Full time" },
  { nombre:"Nixabelid", tipo:"Full time" },
  { nombre:"Laura", tipo:"Full time" },
  { nombre:"Venus", tipo:"Full time" },
  { nombre:"Jaime", tipo:"Part time" },
  { nombre:"Alejandra", tipo:"Part time" }
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
          <select onchange="DESCANSOS_CONFIG['${emp.nombre}']=this.value">
            <option value="">Seleccionar</option>
            ${DIAS.filter(d=>d!=="Domingo").map(d=>`<option>${d}</option>`).join("")}
          </select>
        </td>
      </tr>
    `;
  });
}

function validarDescansos(){
  return EMPLEADOS.every(e => DESCANSOS_CONFIG[e.nombre]);
}

function generarSemana(){

  if(!validarDescansos()){
    alert("Asigna todos los descansos");
    return;
  }

  let tbody = document.getElementById("tabla");
  tbody.innerHTML = "";

  let horas = {};
  let contadorApertura = 0;

  DIAS.forEach((dia,indexDia)=>{

    let disponibles = EMPLEADOS.filter(e => DESCANSOS_CONFIG[e.nombre] !== dia);
    let full = disponibles.filter(e => e.tipo==="Full time");
    let part = disponibles.filter(e => e.tipo==="Part time");

    let asignacion = {};
    let manana = 0;
    let tarde = 0;

    // ================= PART TIME SEPARADOS =================
    if(part.length === 2){
      asignacion[part[0].nombre] = "M";
      asignacion[part[1].nombre] = "T";
      manana++;
      tarde++;
    }

    // ================= APERTURA ROTATIVA =================
    let nombreApertura = null;
    if(full.length > 0){
      nombreApertura = full[contadorApertura % full.length].nombre;
      contadorApertura++;
    }

    if(nombreApertura && !asignacion[nombreApertura]){
      asignacion[nombreApertura] = "M";
      manana++;
    }

    // ================= MINIMO 2 POR TURNO =================
    full.forEach(emp=>{
      if(asignacion[emp.nombre]) return;

      if(manana < 2){
        asignacion[emp.nombre] = "M";
        manana++;
      }
      else if(tarde < 2){
        asignacion[emp.nombre] = "T";
        tarde++;
      }
    });

    // ================= BALANCE GENERAL =================
    full.forEach(emp=>{
      if(asignacion[emp.nombre]) return;

      if(indexDia % 2 === 0){
        if(manana <= tarde){
          asignacion[emp.nombre] = "M";
          manana++;
        } else {
          asignacion[emp.nombre] = "T";
          tarde++;
        }
      } else {
        if(tarde <= manana){
          asignacion[emp.nombre] = "T";
          tarde++;
        } else {
          asignacion[emp.nombre] = "M";
          manana++;
        }
      }
    });

    // ================= REGLA FIJA MARGARITA =================
    if(asignacion["Margarita"]){

      let debeManana = ["Miércoles","Viernes","Domingo"].includes(dia);
      let turnoActual = asignacion["Margarita"];

      if(debeManana && turnoActual !== "M"){
        // buscar full en mañana para intercambiar
        let candidato = full.find(e =>
          e.nombre !== "Margarita" &&
          asignacion[e.nombre] === "M"
        );

        if(candidato){
          asignacion["Margarita"] = "M";
          asignacion[candidato.nombre] = "T";
        }
      }

      if(!debeManana && turnoActual !== "T"){
        // buscar full en tarde para intercambiar
        let candidato = full.find(e =>
          e.nombre !== "Margarita" &&
          asignacion[e.nombre] === "T"
        );

        if(candidato){
          asignacion["Margarita"] = "T";
          asignacion[candidato.nombre] = "M";
        }
      }
    }

    // ================= RENDER =================
    EMPLEADOS.forEach(emp=>{

      let inicio="", fin="", h=0;

      if(DESCANSOS_CONFIG[emp.nombre] === dia){
        h=0;
      }
      else{

        let turno = asignacion[emp.nombre];

        if(emp.tipo==="Full time"){
          h = HORAS_FULL;
        } else {
          h = dia==="Domingo" ? HORAS_PART_DOM : HORAS_PART_SEM;
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
