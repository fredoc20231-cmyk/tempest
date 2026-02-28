/**
 * Download a chart/figure as PNG by capturing the container's SVG
 */
export const downloadChartAsPng = (containerId: string, filename: string) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  const svg = container.querySelector("svg");
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const a = document.createElement("a");
    a.download = `${filename}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = url;
};

/**
 * Download a table as CSV
 */
export const downloadTableAsCsv = (
  data: { metric: string; value: string; trend: string }[],
  filename: string
) => {
  const header = "Metric,Value,Trend\n";
  const rows = data.map((r) => `"${r.metric}","${r.value}","${r.trend}"`).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.download = `${filename}.csv`;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
};

/**
 * Generate and download a full HTML report
 */
export const downloadHtmlReport = (
  moduleInfo: Record<string, { title: string; subtitle: string; description: string }>,
  moduleResults: Record<string, { metric: string; value: string; trend: string }[]>,
  moduleConfig: Record<string, { label: string; value: string }[]>
) => {
  const now = new Date().toLocaleString();
  const moduleSections = Object.entries(moduleInfo)
    .map(([key, info]) => {
      const results = moduleResults[key] || [];
      const config = moduleConfig[key] || [];

      return `
      <section class="module">
        <h2>${info.title}</h2>
        <p class="subtitle">${info.subtitle}</p>
        <p class="desc">${info.description}</p>
        
        <h3>Results</h3>
        <table>
          <thead><tr><th>Metric</th><th>Value</th><th>Trend</th></tr></thead>
          <tbody>
            ${results.map((r) => `<tr><td>${r.metric}</td><td>${r.value}</td><td>${r.trend}</td></tr>`).join("")}
          </tbody>
        </table>

        <h3>Configuration</h3>
        <div class="config-grid">
          ${config.map((c) => `<div class="config-item"><span class="config-label">${c.label}</span><span class="config-value">${c.value}</span></div>`).join("")}
        </div>
      </section>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEMPEST Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a2e; line-height: 1.6; }
    .header { background: #00356b; color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 28px; letter-spacing: 2px; }
    .header p { opacity: 0.8; margin-top: 8px; font-size: 14px; }
    .container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
    .module { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px; margin-bottom: 24px; }
    .module h2 { color: #00356b; font-size: 18px; margin-bottom: 4px; }
    .subtitle { font-family: monospace; font-size: 12px; color: #64748b; margin-bottom: 12px; }
    .desc { font-size: 13px; color: #475569; margin-bottom: 20px; border-left: 3px solid #00356b; padding-left: 12px; }
    h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 16px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .config-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .config-item { background: #f8fafc; border-radius: 6px; padding: 12px; }
    .config-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-family: monospace; }
    .config-value { display: block; font-size: 13px; font-family: monospace; margin-top: 4px; color: #1e293b; }
    .footer { text-align: center; padding: 24px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TEMPEST ANALYSIS REPORT</h1>
    <p>Tumor Evolution Mapping Platform for Ensemble Statistical Tracking</p>
    <p>Generated: ${now}</p>
  </div>
  <div class="container">
    ${moduleSections}
  </div>
  <div class="footer">
    <p>TEMPEST v2.1.0 — Confidential Research Report</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const a = document.createElement("a");
  a.download = "TEMPEST_Report.html";
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
};
