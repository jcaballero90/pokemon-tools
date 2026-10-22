[![English](https://img.shields.io/badge/lang-en-red.svg)](002-master-consolidation-skill-design.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](002-master-consolidation-skill-design.es.md)

# Diseño de la habilidad para consolidar asignaturas del máster

## Propósito

La habilidad proporciona un método reutilizable y revisable para consolidar una lección del máster en documentos Markdown privados, preservando su contenido, la jerarquía de fuentes, los elementos visuales y la trazabilidad.

## Flujo

ChatGPT Assistant → diseño de reglas y revisión iterativa → instrucción final → ejecución con Codex → SKILL.md generado → revisión humana → protección de resultados → tratamiento de proyectos extraídos → estado de validación actual.

El diseño estableció el procesamiento de una lección cada vez; las funciones de las fuentes primarias, secundarias y complementarias; la prohibición de incorporar conocimiento externo durante la consolidación; la conservación de recursos visuales útiles; el tratamiento de incertidumbre del OCR; la trazabilidad de las fuentes; y la revisión humana antes de aceptar el resultado.

## Funciones de la IA

- **ChatGPT Assistant:** conversación, razonamiento y diseño de instrucciones.
- **Codex:** ejecución con conocimiento del espacio de trabajo y creación de la habilidad.
- **Desarrollador humano:** revisión, corrección, aprobación y decisión final.

## Modelos utilizados

Diseño de instrucciones: ChatGPT Assistant, GPT-5.6 Sol, razonamiento medio.

Ejecución: Codex, GPT-5.6 Sol, razonamiento medio.

## Entrada

Instrucción final de creación: [003-create-master-consolidation-skill.md](../prompts/003-create-master-consolidation-skill.md).

## Resultado generado

Habilidad resultante: [consolidate-master-lesson/SKILL.md](../../../../.agents/skills/consolidate-master-lesson/SKILL.md).

## Revisión humana

La habilidad inicial se revisó manualmente. Codex detectó el riesgo de sobrescribir archivos de salida y recursos existentes; tras la revisión humana se añadió una regla de protección explícita. Otra revisión añadió una regla para tratar los directorios de proyectos extraídos de ZIP como material complementario: deben inspeccionarse de forma selectiva y no ingerirse recursivamente por defecto. La versión revisada se volvió a examinar y se aceptó para una primera prueba controlada con una lección.

## Estado de validación

El diseño de la habilidad está aceptado para pruebas. Todavía no se ha validado con una lección real. Antes de procesar lotes, se hará una prueba controlada con una lección representativa.

## Resultado

La habilidad está preparada para validar su primer uso, pero aún no para procesar lotes de forma definitiva.
