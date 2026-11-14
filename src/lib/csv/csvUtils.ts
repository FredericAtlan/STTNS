import Papa from "papaparse";

export function generateCsv<T>(data: T[]): string {
  return Papa.unparse(data, {
    header: true,
    quotes: true,
  });
}

export function parseCsv<T>(csvString: string): T[] {
  const result = Papa.parse<T>(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // Convert numbers and booleans
  });
  
  if (result.errors.length > 0) {
    console.error("CSV Parsing Errors:", result.errors);
  }
  
  return result.data;
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
