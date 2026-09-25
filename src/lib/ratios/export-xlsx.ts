import type { RatioReport } from "./report";

/** .xlsx of the inputs and results, built in the browser with exceljs (loaded on click). */
export async function createRatioXlsx(report: RatioReport): Promise<Blob> {
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AQVIK";

  const inputs = workbook.addWorksheet("Inputs");
  inputs.columns = [{ width: 44 }, { width: 22 }];
  inputs.addRow([report.title]).font = { bold: true, size: 14 };
  inputs.addRow([`Amounts in ${report.unitLabel}. Figures entered by the user.`]);
  for (const section of report.inputs) {
    inputs.addRow([]);
    inputs.addRow([section.section]).font = { bold: true };
    for (const row of section.rows) inputs.addRow(row);
  }
  inputs.addRow([]);
  inputs.addRow([report.disclaimer]).font = { italic: true };

  const results = workbook.addWorksheet("Results");
  results.columns = [{ width: 36 }, { width: 44 }, { width: 70 }];
  results.addRow([report.title]).font = { bold: true, size: 14 };
  const block = (title: string, rows: string[][]) => {
    results.addRow([]);
    results.addRow([title, "Result", "Formula"]).font = { bold: true };
    for (const row of rows) results.addRow(row);
  };
  block(`Worked out (${report.unitLabel})`, report.derived);
  for (const group of report.groups) block(group.title, group.rows);
  block("DuPont breakdown", report.dupont);
  results.addRow([]);
  results.addRow([report.dupontNote]);
  results.addRow([report.disclaimer]).font = { italic: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
