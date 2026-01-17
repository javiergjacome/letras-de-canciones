
// Lee un archivo de texto del servidor y devuelve su contenido
async function cargarArchivo(ruta) {
    const resp = await fetch(ruta);
    if (!resp.ok) throw new Error("No se pudo cargar " + ruta);
    return await resp.text();
}

// Parser de .ini con campos multilínea entre """ ... """
function parseIni(contenido) {
    const resultado = {};
    const lineas = contenido.split(/\r?\n/);

    let claveActual = null;
    let acumulando = false;
    let buffer = [];

    for (let linea of lineas) {
        linea = linea.trim();

        // Inicio multilínea
        if (!acumulando && linea.includes("=") && linea.includes('"""')) {
            const [clave] = linea.split("=");
            claveActual = clave.trim();
            acumulando = true;
            buffer = [];
            continue;
        }

        // Fin multilínea
        if (acumulando && linea === '"""') {
            resultado[claveActual] = buffer.join("\n");
            acumulando = false;
            claveActual = null;
            buffer = [];
            continue;
        }

        // Acumular multilínea
        if (acumulando) {
            buffer.push(linea);
            continue;
        }

        // Clave normal
        if (linea.includes("=")) {
            const [clave, valor] = linea.split("=");
            resultado[clave.trim()] = valor.trim();
        }
    }

    return resultado;
}

// Muestra la lista de canciones
async function mostrarLista() {
    const cont = document.getElementById("contenedor");
    cont.innerHTML = "<h2>Lista de canciones</h2>";

    const texto = await cargarArchivo("letras.txt");
    const archivos = texto.split(/\r?\n/).filter(x => x.trim() !== "");

    for (const nombre of archivos) {
        // Cargar el ini para obtener autor, título original y traducido
        const ini = parseIni(await cargarArchivo(nombre));

        const autor = ini.autor || "Autor desconocido";
        const tituloOriginal = ini.titulo_original || "(sin título)";
        const tituloTraducido = ini.titulo_traducido || "(sin título)";
		const enlace = ini.enlace;
        const tituloOriginalAdd = ini.titulo_original_add || "";
        const tituloTraducidoAdd = ini.titulo_traducido_add|| "";

        // Crear el elemento de la lista
        const div = document.createElement("div");
        div.className = "cancion-lista-item";
		
		// Texto “autor: título original / título traducido ”
		const texto = document.createTextNode(`${autor}: ${tituloOriginal} ${tituloOriginalAdd}/ ${tituloTraducido} ${tituloTraducidoAdd} `);
		div.appendChild(texto);
				
		// Enlace (solo si existe)
		if (enlace) {
		  const a = document.createElement("a");
		  a.href = enlace;
		  a.target = "_blank";
		  a.rel = "noopener noreferrer";
		  a.textContent = "oir";
		  div.appendChild(a);
		}
		
		div.onclick = () => cargarCancion(nombre);
        cont.appendChild(div);
    }
}

// Cargar canción y mostrarla
async function cargarCancion(nombreIni) {
    const cont = document.getElementById("contenedor");

    const ini = parseIni(await cargarArchivo(nombreIni));

    const versosOriginal = ini["texto_original"].split("\n");
    const versosTraduc = ini["texto_traducido"].split("\n");

    cont.innerHTML = `
        <a id="volver" href="#" class="volver-lista">← Volver a la lista</a>
        <h2>${ini.titulo_original}</h2>
        <h3><em>${ini.titulo_traducido}</em></h3>
        <p><strong>Idioma:</strong> ${ini.idioma_original}</p>
		<p><strong>Autor:</strong> ${ini.autor}</p>
        <hr>
    `;

    versosOriginal.forEach((verso, i) => {
        const div = document.createElement("div");
        div.className = "verso";
        div.textContent = verso;
        div.onclick = () => mostrarPopup(versosTraduc[i]);
        cont.appendChild(div);
    });

	const volver2 = document.createElement("a");
	volver2.className="volver-lista";
	volver2.textContent = "← Volver a la lista";
	volver2.setAttribute("href","#");
	cont.appendChild(volver2);

	// Asigna el comportamiento "volver a la lista" a todos los enlaces con la clase 'volver-lista'
	document.querySelectorAll('.volver-lista').forEach(enlace => {
		enlace.addEventListener('click', (e) => {
			e.preventDefault();
			mostrarLista();   // tu función que vuelve a la lista
		});
	});
	
	
	// Cerrar popup haciendo clic fuera del contenido
	document.getElementById("popup").addEventListener("click", (e) => {
		// Si el clic es en el fondo (no dentro de la caja)
		if (e.target.id === "popup") {
			document.getElementById("popup").classList.add("oculto");
		}
	});

}

// Mostrar popup con la traducción
function mostrarPopup(texto) {
    const popup = document.getElementById("popup");
    const p = document.getElementById("popup-texto");
    p.textContent = texto;
    popup.classList.remove("oculto");
}

document.getElementById("popup-cerrar").onclick = () => {
    document.getElementById("popup").classList.add("oculto");
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById("popup").classList.add("oculto");
  }
});


// Inicializar
mostrarLista();
