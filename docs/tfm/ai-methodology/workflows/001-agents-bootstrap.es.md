[![English](https://img.shields.io/badge/lang-en-red.svg)](001-agents-bootstrap.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](001-agents-bootstrap.es.md)

# Flujo de trabajo de IA: creación del AGENTS.md global

## Propósito

El [AGENTS.md](../../../../AGENTS.md) global establece reglas permanentes de trabajo para pokemon-tools, incluidos los límites del espacio de trabajo, la atribución de fuentes, la privacidad, la trazabilidad y el trabajo asistido por IA.

## Flujo

ChatGPT Assistant → diseño y revisión iterativa de instrucciones → instrucción final → ejecución con Codex → AGENTS.md generado → revisión humana → ajustes → validación final.

## Funciones de la IA

- **ChatGPT Assistant:** conversación y diseño de instrucciones.
- **Codex:** ejecución con conocimiento del espacio de trabajo.
- **Desarrollador humano:** revisión, aprobación, corrección y decisión final.

## Modelos utilizados

Diseño de instrucciones: ChatGPT Assistant, GPT-5.6 Sol, razonamiento medio.

Ejecución: Codex, GPT-5.6 Sol, razonamiento medio.

## Entrada

Instrucción final: [001-create-agents.md](../prompts/001-create-agents.md).

## Resultado generado

Artefacto resultante: [AGENTS.md](../../../../AGENTS.md).

## Revisión humana

El AGENTS.md generado se revisó manualmente. Codex trató correctamente la sección de alcance específica de la tarea como instrucciones de ejecución, no como reglas permanentes. Codex propuso reglas de seguridad del repositorio; la propuesta se revisó, ajustó, aprobó e incorporó. El AGENTS.md resultante se aceptó para la fase actual del proyecto.

## Resultado

AGENTS.md se considera estable durante la fase actual de preparación y podrá evolucionar posteriormente mediante cambios revisados.
