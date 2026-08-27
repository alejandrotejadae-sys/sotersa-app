# SOTERSA — Sistema de operaciones y portal de cliente

**Empresa:** SOTER CIA. LTDA. (marca comercial: SOTERSA) · Quito, Ecuador
**Rol:** Alejandro Tejada — Fundador y CEO
**Iniciado:** 2026-08-27
**Estado:** plan técnico, antes de escribir código

---

## Qué es

Un solo sistema con **cuatro vistas sobre la misma base de datos**:

| Vista | Quién la usa | Para qué |
|---|---|---|
| **App del guardia** (móvil) | Guardia en el puesto | Abrir turno, registrar novedades, hacer rondas, consultar protocolos |
| **Panel del supervisor** | Supervisor de zona | Ver quién está en puesto, validar novedades, detectar puesto vacío |
| **Panel interno** | Operaciones SOTERSA | Clientes, puestos, guardias, cuadrante de turnos, códigos QR |
| **Portal del cliente** | Administración del edificio | Bitácora en tiempo real, informes, cumplimiento de SLA |

**La idea que sostiene todo:** la bitácora que ve el cliente **no se escribe dos veces**.
Se genera sola con lo que el guardia ya registró en su turno. Si el cliente exigiera un
informe que alguien tiene que teclear aparte, el sistema habría fracasado: el trabajo
extra no desaparecería, solo cambiaría de escritorio.

---

## Por qué ahora (y no es una app "porque sí")

Dos hechos que ya existen y que este sistema conecta:

1. **SOTERSA ya vendió esto por escrito.** El resumen ejecutivo de Citimed
   (`SOT-ES-2026-001-RE`, 2026-08-23) compromete: *bitácora digital accesible en tiempo
   real*, aviso de novedades **≤ 15 min**, informes diario/semanal/mensual, y un capítulo
   entero de "cómo verificar que cumplimos". Eso no se sostiene con WhatsApp y un cuaderno.
   Si Citimed se cierra, hay que entregarlo.

2. **El procedimiento ya está escrito, en papel.** Las *Normas de la Garita* y los
   *Protocolos de Emergencia* (Drive `11_Marketing`) ya definen el flujo casi literalmente:

   > *"Verifica al iniciar el turno: radio, cámaras, linterna y bitácora"* → **checklist de apertura**
   > *"Entrega el puesto limpio: quien recibe verifica y firma"* → **relevo con firma**
   > *"Registra toda novedad en la bitácora con hora y firma"* → **registro de novedades**
   > *"COMPLETAR EN CADA PUESTO"* (contactos) → **configuración por puesto**

   No hay que inventar el procedimiento. La app **ejecuta** el que ya existe.

Y de los 7 procesos de la tabla de sistematización en la nota `SOTERSA` — todos hoy en
⬜ *No documentado* — este sistema documenta **cuatro** por el solo hecho de operar:
asignación y control de turnos, supervisión de puestos/rondas, protocolo ante incidentes,
y mantenimiento de equipo (el checklist de apertura es un registro de estado del equipo).

---

## Decisiones tomadas

| Decisión | Elegido | Razón |
|---|---|---|
| Alcance v1 | Operación + portal de cliente | Decisión de Alejandro, 2026-08-27. La operación alimenta al portal; al revés no funciona |
| Stack | Next.js + TypeScript + Tailwind + Supabase | Ya probado en `comexbox-app`; Node 24 y Git ya instalados. La Fase 0 sale gratis |
| Hosting | Vercel, dominio propio | Igual que Comex Box: **separado del WordPress de sotersa.com**, que tiene 19 vulnerabilidades y PHP 7.4 EOL. La app no debe compartir suerte con ese sitio |
| Plataforma | PWA instalable primero | El guardia instala desde el navegador, sin Play Store, sin esperar aprobación |
| Ingreso del guardia | **Cédula + PIN**, no correo | Un guardia no tiene correo corporativo. Pedirle email y contraseña es garantía de que no entra |
| Puntos de ronda | **QR impreso**, no NFC | Un sticker cuesta centavos y se reimprime; NFC exige comprar hardware para cada punto |
| Registro sin señal | **Obligatorio desde el día uno** | Ver abajo — es la decisión que define si el sistema vive o muere |

### La decisión más importante: funcionar sin señal

Un puesto de control está en un lobby, una garita o un parqueadero subterráneo. **La señal
falla.** Si la app exige internet para registrar una novedad, el guardia vuelve al cuaderno
en la primera semana y el sistema muere sin que nadie lo anuncie.

Por eso: todo se guarda **primero en el teléfono** (cola local) y se sincroniza cuando hay
señal. Y la hora que vale es la de **captura**, no la de sincronización — si no, una novedad
de las 02:14 aparecería como de las 07:30, y una bitácora con horas falsas no sirve ni
para el cliente ni para un juicio.

### Lo que estamos compitiendo no es otro software: es WhatsApp

Hoy el registro es papel + WhatsApp. WhatsApp gana porque es **rápido**: abrir, foto, enviar.
Cualquier flujo de la app que tarde más que eso pierde. Regla de diseño, no negociable:

> **Registrar una novedad con foto: máximo 3 toques desde la pantalla de inicio.**

Botones grandes, pensados para un guardia de noche, con frío y posiblemente con guantes.

---

## Modelo de datos (borrador)

```
empresas_cliente   Citimed, UNIB.E…            → nombre, RUC, dirección, contacto admin
puestos            P-01 Lobby, P-02 Vehicular  → cliente, código, cobertura h, armado?,
                                                  contactos del puesto (central, supervisor,
                                                  jefe operaciones, admin cliente)
puntos_ronda       checkpoints del puesto      → código, ubicación, token QR, orden
guardias           personal                    → nombre, cédula, credencial, PIN (hash)
turnos             cuadrante                   → puesto, guardia, inicio/fin programado,
                                                  tipo: fijo_dia | fijo_noche | saca_francos
aperturas_turno    apertura y relevo           → hora real, checklist de equipo, estado del
                                                  puesto recibido, foto, firma entrante/saliente
novedades          la bitácora                 → tipo, severidad, descripción, foto, GPS,
                                                  hora_captura, hora_sync, visible_cliente,
                                                  estado, validada_por, notificada_at
rondas             ejecución                   → turno, punto, hora, GPS
```

**Severidad de una novedad:** `informativa` · `novedad` · `emergencia`
**Estados:** `registrada` → `validada` (supervisor) → `notificada` (cliente) → `cerrada`

### Dos reglas que hacen que la bitácora sirva legalmente

1. **El registro original es inmutable.** La validación del supervisor **agrega** un
   registro, nunca reescribe el original. Si se pudiera editar la hora o el texto después,
   la bitácora no probaría nada ante un cliente, una aseguradora o un juez.

2. **El cliente no ve el crudo.** Una novedad de disciplina interna (un guardia dormido)
   no debe aparecer en el portal del cliente sin pasar por supervisión — pero **tampoco
   se borra**: queda en el registro interno con su hora original. El filtro
   `visible_cliente` separa lo que se comparte de lo que se guarda. Al cliente se le dice
   con todas las letras que hay validación de supervisor; eso es honesto y es además lo
   que hace confiable lo que sí ve.

### El SLA de 15 minutos: medido, no prometido

El sistema cronometra de `hora_captura` a `notificada_at` y publica el cumplimiento en el
informe mensual. Deja de ser una promesa comercial y pasa a ser un número que el cliente
verifica. Es exactamente el capítulo *"cómo verificar que cumplimos"* del resumen de Citimed.

### Seguridad desde la base, no desde la pantalla

Políticas RLS en Postgres: el cliente lee solo las novedades de **sus** puestos y marcadas
visibles; el guardia ve solo **su** turno; el supervisor, solo **su** zona. Se aplica en la
base de datos porque una restricción hecha solo en la interfaz es falsificable.

---

## Pantallas de la v1

**App del guardia (móvil)**
- Ingreso: cédula + PIN
- Apertura de turno: checklist `radio · cámaras · linterna · bitácora`, estado del puesto recibido, foto, firma
- 🟠 **NOVEDAD** — foto + tipo + nota (el botón grande de la pantalla)
- 🔵 **RONDA** — escanear QR del punto
- 🔴 **EMERGENCIA** — los 4 protocolos (sismo · incendio · robo/asalto · otras), 911 y los contactos del puesto. **Disponible sin señal**: en una emergencia es cuando más falla la red
- Cierre de turno y relevo con firma de quien entrega y quien recibe

**Panel del supervisor**
- Tablero de puestos en vivo: quién marcó entrada y quién no
- ⚠️ **Alerta de puesto vacío** — nadie marcó apertura pasados N minutos de la hora programada
- Cola de novedades por validar
- Rondas cumplidas contra rondas programadas

**Panel interno (SOTERSA)**
- Clientes, puestos y contactos por puesto
- Guardias y credenciales
- Cuadrante de turnos, con la aritmética del saca francos incorporada
- Generar e imprimir los QR de los puntos de ronda

**Portal del cliente**
- Bitácora en vivo de sus puestos
- Novedades con foto y hora
- Informes diario / semanal / mensual descargables
- Panel de cumplimiento de SLA

---

## Fases

- [x] **Fase 0 — Entorno y marca:** Next.js 16.3.3, Tailwind v4, paleta del logo como tokens. ✅ 2026-08-27
- [x] **Fase 1 — Base de datos:** esquema, 4 roles, RLS e ingreso por cédula + PIN. ✅ 2026-08-27
      Verificado contra un Postgres real con PGlite (`npm run verificar:esquema`): **24 pruebas, 0 fallidas**.
      Y contra el proyecto real (`npm run verificar:nube`): 14 pruebas.
      La verificación encontró y corrigió **dos defectos que habrían llegado a producción**:
      1. **Recursión infinita en las políticas RLS** (`puestos` ↔ `turnos`) — habría reventado al abrir el portal del cliente.
      2. **Fuga de datos entre clientes por las vistas.** Una vista de Postgres corre con los permisos de quien la creó, no de quien la consulta: `v_sla_novedades` le mostraba a un cliente el SLA de los demás. Corregido con `security_invoker = true`, y **verificado en la nube** el 2026-08-27 (`reloptions = {security_invoker=true}` en ambas vistas).
      ⚠️ Pendiente: ejecutarlo en el proyecto de Supabase en la nube. Storage, Realtime y los límites de intentos de ingreso solo se prueban allá.
- [ ] **Fase 2 — App del guardia:** apertura de turno, checklist, novedades **con cola sin señal**
- [ ] **Fase 3 — Rondas:** puntos con QR, escaneo, generación e impresión de códigos
- [ ] **Fase 4 — Supervisor:** validación de novedades y alerta de puesto vacío
- [ ] **Fase 5 — Portal del cliente:** bitácora en vivo, informes, SLA
- [ ] **Fase 6 — Protocolos de emergencia:** los 4 protocolos y contactos, disponibles sin señal
- [ ] **Fase 7 — PWA y publicación:** instalable, desplegada
- [ ] **Fase 8 (después de la v1):** app nativa, biometría en el relevo, integración con CCTV

---

## Identidad de marca

Extraída del logo oficial (`sotersa-logo.jpeg`, muestreo de píxeles) — **no inventada**:

| Rol | Hex | Origen |
|---|---|---|
| Azul SOTERSA (primario) | `#1B9CD8` | bin dominante `#1090C0` (1.247 px) |
| Azul profundo (base) | `#0A4C7A` | bins `#0060A0` / `#0070B0` |
| Cian claro (realce) | `#7FD4F0` | bins `#B0F0F0` / `#C0F0F0` |

**Los colores de severidad no son azules de marca.** Verde, ámbar y rojo significan estado
operativo; si se mezclan con el azul institucional, un guardia no distingue de un vistazo
una novedad informativa de una emergencia.

Tagline oficial: **Seguridad Estratégica**. Razón social en documentos formales:
**SOTER CIA. LTDA.**

---

## ⛔ Lo que hace falta de tu lado

- [ ] **Confirmar el número de certificado BASC.** El material de garita muestra
      `ECUVIC00659` en el encabezado y `ECUUI000659` en el pie — **del mismo documento**.
      Puede ser ruido del OCR o una diferencia real en el arte — leyendo la imagen no
      puedo distinguirlo. Hay que contrastarlo contra el certificado físico, porque ese
      código va impreso en material que ya está en los puestos.
- [ ] **Consentimiento LOPDP.** La app registra **GPS y fotos de trabajadores**. En Ecuador
      eso es dato personal: hace falta consentimiento informado firmado por cada guardia y
      una política de tratamiento de datos. El estudio de Citimed ya invoca la LOPDP para
      los pacientes; el mismo estándar aplica puertas adentro. **Esto se resuelve antes de
      poner el primer teléfono en un puesto, no después.**
- [ ] Decidir el subdominio: `app.sotersa.com` u `operaciones.sotersa.com`
- [ ] Datos reales de arranque: puestos activos, guardias, supervisores por zona
- [ ] Bajar del Drive el logo en alta (`SOTER HORI@4x.png` y el `.ai`) — el que tengo local
      es de 389×85 px, insuficiente para los íconos de la PWA
- [ ] Definir quién valida novedades cuando el supervisor de zona está fuera de turno

> ⚠️ Recordatorio del calendario: el **hosting de sotersa.com vence el 2026-09-02**. No
> bloquea esta app (va en Vercel, aparte), pero sigue pendiente en la nota `SOTERSA`.

---

## Honestidad sobre los límites

- **El QR se puede falsificar.** Alguien podría fotografiar los códigos y "hacer la ronda"
  desde su casa. El GPS y la hora de captura suben mucho el costo de hacer trampa, pero no
  lo vuelven imposible. Si eso llega a importar de verdad, la respuesta es NFC o baliza
  Bluetooth — hardware, no software. Se dice ahora y no cuando alguien lo descubra.
- **La adopción es el riesgo real, no la tecnología.** El sistema se juega en si el guardia
  lo usa en la semana 3. Por eso la regla de los 3 toques y el modo sin señal no son
  refinamientos: son el producto.

---

🔗 Notas relacionadas: `SOTERSA` · `SOTERSA - Estudio de seguridad Citimed` · `Comex Box - App de clientes`
