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
    console.debug('[CSV Parser] Reading file:', file.name, 'Size:', file.size, 'bytes');
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());

    console.debug('[CSV Parser] Total lines (including header):', lines.length);

    if (lines.length === 0) {
      errors.push('File is empty');
      return { parties, errors };
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    console.debug('[CSV Parser] Headers found:', headers);
    
    // Find column indices
    const nameIdx = headers.findIndex(h => h.toLowerCase() === 'party name');
    const addressIdx = headers.findIndex(h => h.toLowerCase() === 'address');
    const phoneIdx = headers.findIndex(h => h.toLowerCase() === 'phone');
    const panIdx = headers.findIndex(h => h.toLowerCase() === 'pan');
    const dueIdx = headers.findIndex(h => h.toLowerCase() === 'due amount');

    console.debug('[CSV Parser] Column indices - Name:', nameIdx, 'Address:', addressIdx, 'Phone:', phoneIdx, 'PAN:', panIdx, 'Due:', dueIdx);

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
      if (!line) {
        console.debug(`[CSV Parser] Row ${rowNum}: Empty line, skipping`);
        continue;
      }

      const values = parseCSVLine(line);
      console.debug(`[CSV Parser] Row ${rowNum}: Parsed ${values.length} values`);

      const name = (values[nameIdx] || '').trim();
      const address = addressIdx !== -1 ? (values[addressIdx] || '').trim() : '';
      const phone = phoneIdx !== -1 ? (values[phoneIdx] || '').trim() : '';
      const pan = (values[panIdx] || '').trim();
      const dueAmountStr = dueIdx !== -1 ? (values[dueIdx] || '0').trim() : '0';

      // Validate required fields
      if (!name) {
        const error = `Row ${rowNum}: Party Name is required`;
        console.debug(`[CSV Parser] ${error}`);
        errors.push(error);
        continue;
      }
      if (!pan) {
        const error = `Row ${rowNum}: PAN is required`;
        console.debug(`[CSV Parser] ${error}`);
        errors.push(error);
        continue;
      }

      // Validate field lengths and formats
      if (name.length > 200) {
        const error = `Row ${rowNum}: Party Name too long (max 200 characters)`;
        console.debug(`[CSV Parser] ${error}`);
        errors.push(error);
        continue;
      }

      if (address.length > 500) {
        const error = `Row ${rowNum}: Address too long (max 500 characters)`;
        console.debug(`[CSV Parser] ${error}`);
        errors.push(error);
        continue;
      }

      // Parse due amount
      let dueAmount: bigint;
      try {
        const cleaned = dueAmountStr.replace(/[₹,\s]/g, '');
        const num = parseFloat(cleaned);
        if (isNaN(num)) {
          const error = `Row ${rowNum}: Invalid due amount "${dueAmountStr}"`;
          console.debug(`[CSV Parser] ${error}`);
          errors.push(error);
          continue;
        }
        dueAmount = BigInt(Math.floor(num));
        console.debug(`[CSV Parser] Row ${rowNum}: Parsed due amount ${dueAmountStr} -> ${dueAmount}`);
      } catch (e) {
        const error = `Row ${rowNum}: Invalid due amount "${dueAmountStr}"`;
        console.debug(`[CSV Parser] ${error}`, e);
        errors.push(error);
        continue;
      }

      console.debug(`[CSV Parser] Row ${rowNum}: Valid party - ${name}`);
      parties.push({
        name,
        address,
        phone,
        pan,
        dueAmount,
      });
    }

    console.debug(`[CSV Parser] Parsing complete. Valid parties: ${parties.length}, Errors: ${errors.length}`);
  } catch (e) {
    const error = `Failed to parse file: ${e instanceof Error ? e.message : 'Unknown error'}`;
    console.error('[CSV Parser]', error, e);
    errors.push(error);
  }

  return { parties, errors };
}
