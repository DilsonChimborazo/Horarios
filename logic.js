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

// Horas semanales
var HORAS_FULL = 44 / 6;              // 7h20 por día
var HORAS_PART_DOM = 44 / 6;          // 7h20 domingo
var HORAS_PART_SEM = (36 - HORAS_PART_DOM) / 5; // resto semana

var TOPE = {
  "Full time":44,
  "Part time":36
};

// ================= FUNCION PARA SUMAR O RESTAR HORAS =================

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

// ================= GENERADOR =================

function generarSemana(){

  if(!validarDescansos()){
    alert("Asigna todos los descansos");
    return;
  }

  let tbody = document.getElementById("tabla");
  tbody.innerHTML = "";

  let horas = {};

  DIAS.forEach(dia=>{

    let full7Asignado = false;

    EMPLEADOS.forEach((emp,i)=>{

      let inicio="", fin="", h=0;

      // Descanso
      if(DESCANSOS_CONFIG[emp.nombre] === dia){
        h = 0;
      }

      // Full time
      else if(emp.tipo==="Full time"){

        h = HORAS_FULL;

        // Garantizar uno a las 7
        if(!full7Asignado){
          inicio="07:00";
          fin=moverHora(inicio,h);
          full7Asignado=true;
        }
        else{
          if(i%2===0){
            inicio="08:00";
            fin=moverHora(inicio,h);
          }else{
            fin=(i%3===0)?"22:00":"21:40";
            inicio=moverHora(fin,-h);
          }
        }
      }

      // Part time
      else{

        if(dia==="Domingo"){
          h = HORAS_PART_DOM;
          inicio="08:00";
          fin=moverHora(inicio,h);
        }else{
          h = HORAS_PART_SEM;

          if(i%2===0){
            inicio="08:00";
            fin=moverHora(inicio,h);
          }else{
            fin="22:00";
            inicio=moverHora(fin,-h);
          }
        }
      }

      horas[emp.nombre] = horas[emp.nombre] || 0;

      // No superar horas semanales
      if(horas[emp.nombre] + h > TOPE[emp.tipo]){
        inicio="";
        fin="";
        h=0;
      }

      horas[emp.nombre]+=h;

      // Render fila
      let turno = h===0 ? "DESCANSO" : (inicio < "12:00" ? "Mañana" : "Tarde");
      let clase = h===0 ? "descanso" : (inicio < "12:00" ? "manana" : "tarde");

      tbody.innerHTML += `
        <tr class="${clase}">
          <td>${dia.toLowerCase()}</td>
          <td>${emp.nombre}</td>
          <td>${emp.tipo}</td>
          <td>${turno}</td>
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

// ================= FILTRO =================

function filtrarDia(){
  let d=document.getElementById("filtroDia").value;
  document.querySelectorAll("#tabla tr").forEach(r=>{
    r.style.display=(d==="Todos"||r.children[0].innerText===d.toLowerCase())?"":"none";
  });
}
