import type { Party, PartyVisitRecord } from '../../backend';
import { formatMoney } from '../format';
import { formatDateTime, formatDate } from '../time';

export function exportPartiesToCSV(parties: Array<[string, Party]>): void {
  const headers = ['Party ID', 'Name', 'Address', 'Phone', 'PAN', 'Due Amount'];
  
  const rows = parties.map(([id, party]) => [
    id,
    escapeCSV(party.name),
    escapeCSV(party.address),
    escapeCSV(party.phone),
    escapeCSV(party.pan),
    Number(party.dueAmount).toString(),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  
  downloadCSV(csv, `parties_export_${getTimestamp()}.csv`);
}

export function exportEventsToCSV(
  events: Array<[string, PartyVisitRecord]>,
  partiesMap: Map<string, Party>
): void {
  const headers = [
    'Payment ID',
    'Party Name',
    'Amount',
    'Comment',
    'Payment Date',
    'Next Payment Date',
    'Has Location',
    'Latitude',
    'Longitude',
  ];

  const rows = events.map(([paymentId, record]) => {
    const party = partiesMap.get(paymentId.split('-')[0]);
    return [
      paymentId,
      party ? escapeCSV(party.name) : 'Unknown',
      Number(record.amount).toString(),
      escapeCSV(record.comment),
      formatDateTime(record.paymentDate),
      record.nextPaymentDate ? formatDate(record.nextPaymentDate) : '',
      record.location ? 'Yes' : 'No',
      record.location ? record.location.latitude.toString() : '',
      record.location ? record.location.longitude.toString() : '',
    ];
  });

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  
  downloadCSV(csv, `events_export_${getTimestamp()}.csv`);
}

function escapeCSV(value: string): string {
  if (!value) return '';
  const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}
