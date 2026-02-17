import type { Party } from '../../backend';

export interface ParsedParty {
  name: string;
  address: string;
  phone: string;
  pan: string;
  dueAmount: bigint;
}

export interface ParseResult {
  parties: ParsedParty[];
  errors: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export async function parsePartiesFromExcel(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const parties: ParsedParty[] = [];

  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      errors.push('File is empty');
      return { parties, errors };
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    
    // Find column indices
    const nameIdx = headers.findIndex(h => h.toLowerCase() === 'party name');
    const addressIdx = headers.findIndex(h => h.toLowerCase() === 'address');
    const phoneIdx = headers.findIndex(h => h.toLowerCase() === 'phone');
    const panIdx = headers.findIndex(h => h.toLowerCase() === 'pan');
    const dueIdx = headers.findIndex(h => h.toLowerCase() === 'due amount');

    if (nameIdx === -1) {
      errors.push('Missing required column: Party Name');
    }
    if (panIdx === -1) {
      errors.push('Missing required column: PAN');
    }

    if (nameIdx === -1 || panIdx === -1) {
      return { parties, errors };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);

      const name = (values[nameIdx] || '').trim();
      const address = addressIdx !== -1 ? (values[addressIdx] || '').trim() : '';
      const phone = phoneIdx !== -1 ? (values[phoneIdx] || '').trim() : '';
      const pan = (values[panIdx] || '').trim();
      const dueAmountStr = dueIdx !== -1 ? (values[dueIdx] || '0').trim() : '0';

      // Validate required fields
      if (!name) {
        errors.push(`Row ${rowNum}: Party Name is required`);
        continue;
      }
      if (!pan) {
        errors.push(`Row ${rowNum}: PAN is required`);
        continue;
      }

      // Parse due amount
      let dueAmount: bigint;
      try {
        const cleaned = dueAmountStr.replace(/[₹,\s]/g, '');
        const num = parseFloat(cleaned);
        if (isNaN(num)) {
          errors.push(`Row ${rowNum}: Invalid due amount`);
          continue;
        }
        dueAmount = BigInt(Math.floor(num));
      } catch (e) {
        errors.push(`Row ${rowNum}: Invalid due amount`);
        continue;
      }

      parties.push({
        name,
        address,
        phone,
        pan,
        dueAmount,
      });
    }
  } catch (e) {
    errors.push(`Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  return { parties, errors };
}
