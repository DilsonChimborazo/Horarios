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
    let opcionesDescanso = DIAS.filter(d => d !== "Domingo");
    if (emp.nombre === "Margarita") {
      opcionesDescanso = opcionesDescanso.filter(d => d !== "Miércoles" && d !== "Viernes");
    }

    tb.innerHTML += `
      <tr>
        <td>${emp.nombre}</td>
        <td>
          <select id="desc1_${emp.nombre}" onchange="actualizarDescansos('${emp.nombre}')">
            <option value="">Seleccionar 1</option>
            ${opcionesDescanso.map(d=>`<option>${d}</option>`).join("")}
          </select>
          <select id="desc2_${emp.nombre}" onchange="actualizarDescansos('${emp.nombre}')">
            <option value="">Ninguno (Opcional)</option>
            ${opcionesDescanso.map(d=>`<option>${d}</option>`).join("")}
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

// ================= ASIGNAR AZAR =================
function asignarDescansosAzar() {
  let diasPosibles = DIAS.filter(d => d !== "Domingo"); // 6 días posibles

  // Crear 8 espacios de descanso (1 para cada empleado)
  let rests = [...diasPosibles]; 
  let duplicates = [...diasPosibles].sort(() => 0.5 - Math.random()).slice(0, 2);
  rests.push(duplicates[0]);
  rests.push(duplicates[1]);
  
  // Extraer el de Margarita asegurándonos de que no le toque Miércoles ni Viernes
  let validForMarg = rests.filter(d => d !== "Miércoles" && d !== "Viernes");
  let margRest = validForMarg[Math.floor(Math.random() * validForMarg.length)];
  
  // Quitarlo del pool general
  rests.splice(rests.indexOf(margRest), 1);
  
  // Mezclar los restantes 7 descansos para los restantes 7 empleados
  rests.sort(() => 0.5 - Math.random());
  
  EMPLEADOS.forEach((emp) => {
    let d1 = (emp.nombre === "Margarita") ? margRest : rests.pop();
    
    let v1Element = document.getElementById("desc1_" + emp.nombre);
    v1Element.value = d1;
    
    // Actualizar configuración sin tocar el descanso 2
    actualizarDescansos(emp.nombre);
  });
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
  
  // Pre-asignar 2 días al azar de 8 horas para los Full time (excepto Margarita)
  let diasDe8Horas = {};
  EMPLEADOS.filter(e => e.tipo === "Full time" && e.nombre !== "Margarita").forEach(emp => {
      let descansos = DESCANSOS_CONFIG[emp.nombre] || [];
      let laborables = DIAS.filter(d => d !== "Domingo" && !descansos.includes(d));
      laborables.sort(() => 0.5 - Math.random());
      diasDe8Horas[emp.nombre] = [laborables[0], laborables[1]];
  });

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

    // Removida la lógica de rotación de apertura, todos entran fijo a las 07:00 en la mañana.

    // ================= RENDER =================
    EMPLEADOS.forEach((emp, indexEmp)=>{

      let inicio="", fin="", h=0;

      if(DESCANSOS_CONFIG[emp.nombre] && DESCANSOS_CONFIG[emp.nombre].includes(dia)){
        h=0;
      }
      else{

        let turno = asignacion[emp.nombre];
        let numDescansos = (DESCANSOS_CONFIG[emp.nombre] || []).length;
        let diasTrabaja = 7 - numDescansos;

        let overrideHorario = false;
        
        let fixedHours = 0;
        let fixedDays = 0;

        if (emp.nombre === "Margarita") {
            let descansos = DESCANSOS_CONFIG["Margarita"] || [];
            let worksWed = !descansos.includes("Miércoles");
            let worksFri = !descansos.includes("Viernes");
            if (worksWed) { fixedHours += 8; fixedDays += 1; }
            if (worksFri) { fixedHours += 8; fixedDays += 1; }
        }
        
        let remainingDays = diasTrabaja - fixedDays;
        let totalHoras = TOPE[emp.tipo];
        let horasRestantes = totalHoras - fixedHours;
        
        let normalH = 0;
        let esDiaNormal = (diasTrabaja === 6);

        if (emp.tipo === "Part time") {
            normalH = esDiaNormal ? 6 : (remainingDays > 0 ? Math.round((horasRestantes / remainingDays)*100)/100 : 0);
        } else if (emp.tipo === "Full time") {
            if (esDiaNormal) {
                if (emp.nombre === "Margarita") {
                    normalH = 7;
                } else if (dia !== "Domingo") {
                    if (diasDe8Horas[emp.nombre] && diasDe8Horas[emp.nombre].includes(dia)) {
                        normalH = 8;
                    } else {
                        normalH = 7;
                    }
                } else {
                    normalH = 7; // Domingo fijo 7 horas
                }
            } else {
                normalH = remainingDays > 0 ? Math.round((horasRestantes / remainingDays)*100)/100 : 0;
            }
        }

        if (emp.nombre === "Margarita" && dia === "Miércoles" && !(DESCANSOS_CONFIG["Margarita"] || []).includes("Miércoles")) { 
            h = 8; inicio = "06:00"; fin = "14:30"; overrideHorario = true; 
        } else if (emp.nombre === "Margarita" && dia === "Viernes" && !(DESCANSOS_CONFIG["Margarita"] || []).includes("Viernes")) { 
            h = 8; inicio = "06:00"; fin = "14:30"; overrideHorario = true; 
        } else {
            h = normalH;
        }

        if (!overrideHorario) {
          if(turno==="M"){
            inicio = "07:00";
            fin = moverHora(inicio, h + 0.5); // +0.5h de descanso no pagado
          }
          else{
            fin = "22:00";
            inicio = moverHora(fin, -(h + 0.5)); // +0.5h de descanso no pagado
          }
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
      
      if (indexEmp === 0) clase += " separador-dia";

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
