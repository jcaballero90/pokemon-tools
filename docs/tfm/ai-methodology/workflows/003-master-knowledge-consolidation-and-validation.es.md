[![English](https://img.shields.io/badge/lang-en-red.svg)](003-master-knowledge-consolidation-and-validation.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](003-master-knowledge-consolidation-and-validation.es.md)

# Consolidación y validación del conocimiento del máster

## Objetivo

El flujo transformó el material facilitado del máster en una base de conocimiento Markdown privada, consultable y trazable para usarla de forma selectiva durante el TFM. Su alcance incluye apoyar decisiones sobre requisitos, arquitectura, seguridad, pruebas, infraestructura y metodología cuando el conocimiento del curso resulte pertinente.

El material original, los documentos consolidados y los recursos visuales conservados siguen siendo privados. No se cargan en todas las tareas de desarrollo. Los agentes futuros consultan primero el índice ligero para localizar el conjunto mínimo pertinente y después abren los documentos de conocimiento subyacentes y verifican la atribución antes de utilizar material del curso en documentación o decisiones del proyecto.

## Preparación de las fuentes

Antes de consolidarlas, se inventariaron los directorios de las lecciones. Los archivos se clasificaron por función, en vez de tratarse como una colección indiferenciada:

- Los archivos `PPT-*` eran material docente primario.
- Los resúmenes, conclusiones y otros documentos explicativos eran fuentes secundarias.
- Los archivos `ADJ-*` eran anexos complementarios o prácticos.
- Los directorios extraídos de archivos comprimidos eran material práctico complementario, como ejemplos o proyectos.

Se conservaron los PDF seleccionables y buscables cuando fue posible. El OCR se utilizó solo cuando el texto de origen no estaba disponible de forma fiable, para evitar transformar documentos ya utilizables. El contenido de los archivos comprimidos se inspeccionó de forma selectiva según su pertinencia. Se excluyeron dependencias, cachés, resultados de compilación y archivos con secretos, salvo que su estructura fuese necesaria para determinar el alcance de un ejercicio práctico.

## Jerarquía de fuentes y reglas de consolidación

El orden de autoridad fue:

1. presentaciones primarias;
2. resúmenes o ampliaciones secundarias;
3. anexos y proyectos extraídos complementarios.

El material primario definía la estructura docente y las afirmaciones centrales. El material secundario podía aportar detalles, ejemplos o conclusiones, pero no sustituir silenciosamente la exposición primaria. Si las fuentes discrepaban, la diferencia se conservaba como advertencia en vez de corregirse con conocimiento externo. Los anexos y proyectos extraídos solo se inspeccionaban con la profundidad necesaria para comprender su función práctica acreditada.

La consolidación no incorporó conocimiento externo sobre la materia. Conservó definiciones, explicaciones, distinciones, procedimientos, ejemplos y otros contenidos educativos útiles respaldados por las fuentes proporcionadas. Los elementos visuales con información relevante podían conservarse como recursos privados cuando el texto por sí solo no mantuviera esa información. Cada resultado conservaba la procedencia mediante metadatos estructurados y una tabla de trazabilidad.

## Habilidad de consolidación

Se creó una [habilidad de consolidación](../../../../.agents/skills/consolidate-master-lesson/SKILL.md) específica porque era necesario aplicar restricciones repetibles a lecciones heterogéneas. Las instrucciones puntuales por sí solas no ofrecían un contrato suficientemente estable sobre la autoridad, profundidad, privacidad y estructura de las fuentes.

En términos generales, la habilidad regula la clasificación de fuentes; la conservación de la jerarquía de módulos y lecciones; la consolidación, en lugar de un resumen agresivo; la inspección selectiva de archivos o proyectos; el tratamiento de elementos visuales relevantes; la protección de los resultados existentes; la procedencia; el estado de revisión; y el formato final. Las instrucciones reutilizables fijan el alcance de cada ejecución; la habilidad proporciona el método constante.

## Validación controlada

El flujo se probó con lecciones representativas antes de procesar lotes amplios. El conjunto inicial incluyó una lección pequeña de bases de datos, una lección extensa sobre arquitectura distribuida y una lección de nube con material complementario.

Las pruebas evaluaron el tratamiento de varias presentaciones primarias, ampliaciones solo secundarias, extracción visual, inspección de archivos o proyectos, discrepancias entre fuentes, jerarquía de resultados y revisión humana. También demostraron que el método debía escalar según la complejidad de las fuentes, en vez de dar por supuesto que todas las lecciones podían procesarse con el mismo tamaño de lote o profundidad de inspección.

## Procesamiento por lotes y estado persistente

Las lecciones restantes se procesaron progresivamente mediante la [instrucción para una lección](../prompts/006-run-master-lesson-consolidation.md), la [instrucción por lotes](../prompts/008-run-master-lessons-batch.md) y otras instrucciones reutilizables. Las lecciones se trataron secuencialmente en cada ejecución y los resultados terminados se guardaron antes de continuar.

El registro privado `knowledge-private/processing/lessons-status.md` sirvió como estado operativo persistente. Anotaba la identidad de la lección, número de fuentes, complejidad, cantidad de resultados, estado de procesamiento, revisión humana y notas sustantivas. Así se podían reanudar ejecuciones interrumpidas: los resultados existentes se podían inspeccionar y completar de forma segura sin generar archivos duplicados o con sufijos, y no era necesario regenerar las lecciones terminadas. El tamaño práctico de cada lote variaba según la complejidad y los límites de ejecución.

La [instrucción de inventario](../prompts/007-inventory-master-lessons.md) definió el alcance del procesamiento, mientras que la [instrucción de normalización de rutas](../prompts/005-normalize-workspace-paths.md) mantuvo las instrucciones reutilizables independientes de una máquina concreta.

## Revisión humana e inconsistencia detectada

La revisión humana detectó diferencias en la profundidad de las consolidaciones. Algunos documentos Markdown generados eran autosuficientes y didácticos; otros eran escuetos o describían principalmente el contenido de los archivos de origen, en lugar de incorporar el conocimiento.

La causa principal fue que el contrato inicial no especificaba suficientemente la profundidad. La variación entre modelos y ejecuciones añadió otra variable evitable, aunque las pruebas no demuestran que un modelo fuese superior en todos los casos.

El requisito corregido fue explícito: el documento consolidado debe contener el propio conocimiento educativo y ofrecer suficiente autonomía para que el lector estudie el tema representado sin volver a abrir los PDF de origen. La extensión por sí sola no mide la calidad; la cobertura debe ser proporcional al contenido sustantivo de las fuentes.

## Auditoría de contenido y correcciones

Se registró una auditoría de solo lectura en el archivo privado `knowledge-private/processing/content-audit.md`. Evaluó 196 documentos Markdown y clasificó 138 como `GOOD`, 47 como `THIN`, 10 como `META-ONLY` y 1 como `STRUCTURAL`. A nivel de lección, se marcaron 25 para regeneración.

- `GOOD` indicaba una síntesis útil y autosuficiente con profundidad adecuada.
- `THIN` indicaba que había contenido educativo real, pero se había omitido material significativo de las fuentes.
- `META-ONLY` indicaba que el documento describía principalmente las fuentes en lugar de incorporar su contenido educativo.
- `STRUCTURAL` indicaba que la cobertura educativa era aceptable, pero persistía un problema significativo de estructura o trazabilidad.

La corrección fue selectiva. Se conservaron los documentos `GOOD`; solo se regeneraron los `THIN` y `META-ONLY`, tras volver a inspeccionar las fuentes originales del curso. La auditoría aportó criterios de diagnóstico, nunca conocimiento docente. Una lección solo volvía a `Draft / No` después de regenerar los documentos deficientes y necesitaba otra revisión humana antes de pasar a validada. Los problemas exclusivamente estructurales se corrigieron por separado para no invalidar contenido educativo aceptable.

## Contrato de salida y normalización

La revisión humana también detectó formatos de metadatos y trazabilidad inconsistentes. El contrato final exige exactamente seis campos de nivel superior en el frontmatter y en este orden:

- `title`
- `module`
- `lesson`
- `source_policy`
- `status`
- `human_review`

`source_policy` utiliza YAML estructurado para las fuentes primarias, secundarias y anexas. Cada documento de conocimiento termina con una sección `## Source traceability` que contiene una tabla `Source | Type | Use`. Los valores de `Type` se normalizan como `Primary`, `Secondary` o `Attachment`. El texto educativo suele permanecer en español, mientras que los metadatos estructurales y las etiquetas de trazabilidad se normalizan.

Durante la normalización final se auditaron 196 documentos Markdown; 194 requerían normalización y se validaron 623 relaciones entre fuentes. Esta revisión solo modificó la estructura: se conservaron el contenido educativo y los estados de validación de las lecciones.

## Validación humana

El archivo privado `knowledge-private/processing/lessons-status.md` es el registro operativo de referencia:

- `Draft / No` significa que el resultado de la lección está pendiente de validación humana.
- `Validated / Yes` significa que una persona revisó la lección y la consideró una consolidación fiel de las fuentes proporcionadas.

El estado `Validated` no certifica por sí mismo que todas las afirmaciones del material original sean técnicamente correctas. Certifica que la representación es fiel según la jerarquía de fuentes y las reglas de consolidación documentadas.

El registro actual depurado contiene 65 lecciones, todas con el estado `Validated / Yes`. Por tanto, toda la base de conocimiento actual ha pasado por revisión y validación humanas. Se eliminaron notas obsoletas que aún indicaban que la revisión estaba pendiente, mientras se conservaron discrepancias de fuentes, ambigüedades técnicas, incertidumbre del OCR, límites de inspección de archivos, información fechada de proveedores y otras advertencias sustantivas.

## Índice ligero de conocimiento

El archivo privado `knowledge-private/master-index.md` es una capa de navegación organizada como módulo → lección → documento → temas → ruta relativa. Abarca 11 módulos, 65 lecciones y 196 documentos de conocimiento.

Cuando el conocimiento del curso sea pertinente, los agentes futuros deben:

1. consultar el índice;
2. identificar el conjunto mínimo de documentos pertinente;
3. abrir solo esos documentos;
4. verificar la atribución al curso frente al documento de conocimiento real.

El índice no está pensado para todas las instrucciones, no reproduce contenido educativo sustancial y no sustituye los documentos subyacentes.

## Lecciones aprendidas

- La generación automatizada necesitó revisión humana para detectar defectos de contenido y estructura.
- La jerarquía de fuentes evitó mezclar o sustituir material silenciosamente.
- Las discrepancias entre fuentes deben conservarse, no corregirse con información externa durante la consolidación.
- El estado operativo persistente permitió interrumpir y reanudar el trabajo de forma segura.
- La profundidad educativa debe ser un requisito explícito, no una propiedad supuesta de la consolidación.
- El formato de salida debe ser un contrato, no una colección de ejemplos.
- La calidad del contenido y la del formato requieren revisiones separadas.
- La corrección selectiva es preferible a regenerar material ya considerado aceptable.
- Un índice ligero reduce el coste de contexto en trabajos posteriores.

## Resultado final

El sistema completo consta de una base Markdown privada y validada por personas; recursos visuales privados conservados; un registro de procesamiento y validación; una auditoría de contenido; un índice ligero de navegación; una habilidad de consolidación reutilizable; instrucciones de ejecución reutilizables; y documentación pública de los flujos que expone el método sin divulgar el contenido privado del curso.

Estos recursos permiten utilizar el conocimiento del curso de forma selectiva y trazable durante el TFM, mantienen privadas las fuentes y preservan la diferencia entre consolidar fielmente el material docente y verificar técnicamente sus afirmaciones de forma independiente.

## Trazabilidad

- [Habilidad de consolidación](../../../../.agents/skills/consolidate-master-lesson/SKILL.md)
- [Instrucción para normalizar rutas](../prompts/005-normalize-workspace-paths.md)
- [Instrucción de consolidación de una lección](../prompts/006-run-master-lesson-consolidation.md)
- [Instrucción de inventario de lecciones](../prompts/007-inventory-master-lessons.md)
- [Instrucción de consolidación por lotes](../prompts/008-run-master-lessons-batch.md)
- [Instrucción para documentar este flujo](../prompts/009-document-master-knowledge-consolidation-workflow.md)
- [Registro del diseño de la habilidad](002-master-consolidation-skill-design.es.md)
- [Este registro del flujo](003-master-knowledge-consolidation-and-validation.es.md)
