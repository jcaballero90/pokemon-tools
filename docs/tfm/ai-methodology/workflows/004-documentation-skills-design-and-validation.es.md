[![English](https://img.shields.io/badge/lang-en-red.svg)](004-documentation-skills-design-and-validation.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](004-documentation-skills-design-and-validation.es.md)

# Diseño y validación de habilidades de documentación

> Estado: Validado; la revisión humana se ha completado.

## Propósito

Este flujo creó habilidades específicas y fáciles de localizar para las áreas de documentación del proyecto. Cada habilidad orienta el trabajo futuro sin crear requisitos de producto, elegir una pila tecnológica ni tratar ejemplos del curso como decisiones de pokemon-tools. Este registro conserva los motivos del diseño aprobado y la validación observada; no es una transcripción de la conversación de diseño.

## Entradas y consulta del conocimiento

La entrada inicial fue el plan aprobado por la persona propietaria del proyecto para crear ocho habilidades, refinado al revisar cada propuesta durante esta tarea. No hay una instrucción de ejecución guardada por separado. [AGENTS.md](../../../../AGENTS.md) proporciona las reglas compartidas de privacidad, atribución de fuentes, aprobación de documentación y revisión humana.

Para decisiones sustantivas se consultó el índice privado del máster y se localizaron solo documentos validados pertinentes. Las rutas consultadas incluyeron *Ingeniería del software → Análisis de requisitos*; *Arquitectura del software → Introducción a la arquitectura de software*; *Calidad → Documentación con IA*, *Testing* y *Métricas, coverage y complejidad*; *Seguridad → Introducción al desarrollo seguro* y *Metodologías de desarrollo seguro*; *Infraestructura y cloud → Cloud computing*, *Contenerización* y *DevOps y CICD*; *Proyecto Final → Proyecto Final*; e *Introducción → IA en el proceso de desarrollo*, junto con *Herramientas → Codex*. Estas lecciones orientaron los métodos de las habilidades; sus ejemplos no se convirtieron en requisitos del producto ni decisiones tecnológicas. No se copió texto privado del curso ni archivos de origen a las habilidades o flujos públicos.

## Flujo y decisiones

1. Se refinó la orientación compartida de [AGENTS.md](../../../../AGENTS.md) para que los documentos sustantivos y las decisiones importantes consulten primero el índice privado y después los documentos validados pertinentes. La programación rutinaria no necesita cargar la base de conocimiento. Las alternativas externas materialmente preferibles deben debatirse antes de registrarse como decisiones del proyecto.
2. La [habilidad de consolidación de lecciones](../../../../.agents/skills/consolidate-master-lesson/SKILL.md) existente se trasladó a `.agents/skills/` sin alterar su propósito. Después, las ocho habilidades nuevas se revisaron, crearon y probaron una a una, en vez de generarlas en lote sin revisión.
3. Se aclararon los límites del alcance: los documentos generales vivos describen el estado actual; los ADR conservan el razonamiento y ciclo de vida de decisiones importantes; y los flujos de IA conservan el método y las pruebas. Se propone la documentación candidata antes de crear un archivo, salvo que la tarea ya lo solicite.
4. La persona propietaria eligió una especificación viva de requisitos con identificadores estables `REQ-001` y un índice enlazado que incluye cada campo seguido una sola vez. Seguridad, pruebas e infraestructura también comienzan con un único plan o estrategia viva; por defecto, la habilidad de entregables del TFM no crea una lista de comprobación paralela.
5. La persona propietaria prevé versionar el proyecto cuando su estructura esté definida. Cuando exista, Git conservará las revisiones exactas y los ADR el razonamiento de las decisiones importantes. Durante este flujo no se creó un registro de cambios por edición, un repositorio Git ni un remoto.
6. Para la entrega del TFM, los archivos generados usan literalmente los marcadores `<user>` y `<password>`; la persona propietaria gestiona manualmente el acceso para las pruebas finales. La fecha límite por correo comunicada por la persona propietaria, 2026-10-26, se distingue de la fecha anterior del documento validado *Proyecto Final* y debe confirmarse de nuevo antes de entregar.

## Habilidades resultantes

| Habilidad | Responsabilidad y límite |
| --- | --- |
| [specify-requirements](../../../../.agents/skills/specify-requirements/SKILL.md) | Recoger y mantener requisitos aceptados; no convertir ejercicios del curso en alcance del producto. |
| [design-architecture](../../../../.agents/skills/design-architecture/SKILL.md) | Mantener la descripción del sistema actual y trasladar a los ADR el razonamiento de las decisiones importantes. |
| [record-adr](../../../../.agents/skills/record-adr/SKILL.md) | Conservar una decisión significativa por registro numerado estable, incluidas alternativas y consecuencias. |
| [plan-security](../../../../.agents/skills/plan-security/SKILL.md) | Mantener un plan de riesgos y controles basado en el alcance real del proyecto. |
| [plan-testing](../../../../.agents/skills/plan-testing/SKILL.md) | Relacionar las comprobaciones previstas con requisitos aceptados, sin imponer herramientas ni objetivos arbitrarios de cobertura. |
| [plan-infrastructure](../../../../.agents/skills/plan-infrastructure/SKILL.md) | Documentar decisiones operativas aprobadas u observadas sin elegir prematuramente proveedor o plataforma. |
| [prepare-tfm-deliverables](../../../../.agents/skills/prepare-tfm-deliverables/SKILL.md) | Comprobar la preparación de la entrega frente al encargo validado, sin inventar la estructura de la memoria ni publicar artefactos. |
| [record-ai-workflow](../../../../.agents/skills/record-ai-workflow/SKILL.md) | Registrar trabajo importante asistido por IA y su validación, sin duplicar transcripciones ni flujos de CI/CD. |

## Validación y límites actuales

Cada habilidad nueva se comprobó en cuanto a los metadatos iniciales requeridos, la delimitación del alcance, la consulta de fuentes y su detección local cuando Codex se ejecuta desde el directorio `pokemon-tools`. Se realizaron sesiones de ejemplo de solo lectura para probar los límites previstos: requisitos y arquitectura provisionales, aceptación de ADR, planificación de seguridad, pruebas trazables a requisitos, selección de infraestructura, preparación de la entrega del TFM y registro de flujos de IA basado en pruebas. Esos ejemplos no demuestran el comportamiento en futuras tareas reales del proyecto.

Durante el diseño no se creó ningún documento del proyecto sobre requisitos, arquitectura, ADR, seguridad, pruebas o infraestructura. Tampoco se inicializaron un framework, una base de datos, un proveedor, un repositorio Git, un remoto ni código de aplicación. El proyecto guardado en Codex Desktop aún apunta al espacio de trabajo superior, no a `pokemon-tools`; queda pendiente confirmar la detección automática desde ese contexto. Se verificó la detección desde el directorio de trabajo `pokemon-tools`.

## Revisión humana

La persona propietaria revisó y aprobó individualmente el contenido de las ocho habilidades y validó este registro después de solicitar que se eliminasen detalles incidentales sobre las herramientas de validación.
