import type { UpgradeData } from '../../backend';

export function downloadJSON(data: UpgradeData, filename: string = 'party-ledger-export.json') {
  // Convert bigints to strings for JSON serialization
  const serializable = JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );

  const blob = new Blob([serializable], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseJSONFile(file: File): Promise<UpgradeData> {
  const text = await file.text();
  const parsed = JSON.parse(text, (key, value) => {
    // Convert string numbers back to bigints for amount fields
    if (key === 'amount' || key === 'dueAmount' || key === 'paymentDate' || key === 'nextPaymentDate') {
      return typeof value === 'string' ? BigInt(value) : value;
    }
    return value;
  });
  return parsed;
}

export function mergeImportData(existing: UpgradeData, incoming: UpgradeData): UpgradeData {
  // Simple merge: combine parties and partyVisitRecords, prefer incoming branding
  const partyMap = new Map(existing.parties);
  incoming.parties.forEach(([id, party]) => {
    partyMap.set(id, party);
  });

  const visitRecordsMap = new Map(existing.partyVisitRecords);
  incoming.partyVisitRecords.forEach(([id, records]) => {
    const existingRecords = visitRecordsMap.get(id) || [];
    visitRecordsMap.set(id, [...existingRecords, ...records]);
  });

  return {
    parties: Array.from(partyMap.entries()),
    partyVisitRecords: Array.from(visitRecordsMap.entries()),
    branding: incoming.branding || existing.branding,
  };
}
