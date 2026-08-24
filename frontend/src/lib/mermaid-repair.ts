/**
 * Self-healing repair engine for AI-generated Mermaid charts.
 * Corrects unquoted node labels, illegal characters, arrow formatting,
 * and normalizes common syntax errors produced by LLMs.
 */

export function repairMermaidChart(chart: string): string {
  if (!chart || !chart.trim()) return "";

  let lines = chart.trim().split("\n");

  // Remove markdown code fences if accidentally included
  lines = lines.filter((l) => !l.trim().startsWith("```"));

  if (lines.length === 0) return "";

  // Ensure header exists (e.g. flowchart, sequenceDiagram, mindmap, classDiagram, erDiagram)
  let firstLine = lines[0].trim();
  const validHeaders = [
    "flowchart",
    "graph",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "mindmap",
    "gitGraph",
    "pie",
    "journey",
    "gantt",
  ];

  const hasHeader = validHeaders.some((h) => firstLine.toLowerCase().startsWith(h.toLowerCase()));
  if (!hasHeader) {
    lines.unshift("flowchart TD");
  }

  const repairedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip the diagram type declaration line from label fixes
    if (i === 0 && validHeaders.some((h) => line.trim().toLowerCase().startsWith(h.toLowerCase()))) {
      // Normalize 'graph TD' to 'flowchart TD' for better modern Mermaid parser support
      if (line.trim().startsWith("graph ")) {
        line = line.replace("graph ", "flowchart ");
      }
      repairedLines.push(line);
      continue;
    }

    // 1. Repair unquoted square brackets with parentheses/special chars inside: A[Text (detail)] -> A["Text (detail)"]
    line = line.replace(
      /([A-Za-z0-9_-]+)\[([^"\]\n]*[\(\)\{\}\:\/\\\,\&\<\>\-\'\"][^"\]\n]*)\]/g,
      (_match, id, text) => `${id}["${text.replace(/"/g, "'")}"]`,
    );

    // 2. Repair unquoted round nodes with special chars: A(Text [detail]) -> A("Text [detail]")
    line = line.replace(
      /([A-Za-z0-9_-]+)\(([^"\)\n]*[\[\]\{\}\:\/\\\,\&\<\>\-\'\"][^"\)\n]*)\)/g,
      (_match, id, text) => `${id}("${text.replace(/"/g, "'")}")`,
    );

    // 3. Repair unquoted stadium/subroutine/cylinder nodes:
    line = line.replace(
      /([A-Za-z0-9_-]+)\[\[([^"\]\n]*[\(\)\:\,\&][^"\]\n]*)\]\]/g,
      (_match, id, text) => `${id}[["${text.replace(/"/g, "'")}"]]`,
    );

    // 4. Fix arrow labels with unescaped pipes or quotes: -->|text (info)| -> -->|"text (info)"|
    line = line.replace(/(-->|---|==>|-\.->)\|([^"|\n]*[\(\)\{\}\:\,\&][^"|\n]*)\|/g, (_m, arrow, label) => {
      return `${arrow}|"${label.replace(/"/g, "'")}"|`;
    });

    // 5. Fix double arrow typos like --> --> or ->> in flowcharts
    if (line.includes("-->") || line.includes("---")) {
      line = line.replace(/\s*-->\s*-->\s*/g, " --> ");
    }

    repairedLines.push(line);
  }

  return repairedLines.join("\n");
}
