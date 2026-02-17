import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parsePartiesFromExcel } from '../../lib/excel/parsePartiesFromExcel';
import { useAddParty, useValidateAndGeneratePartyId } from '../../hooks/queries/useParties';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ExcelPartyImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ count: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { mutateAsync: addParty } = useAddParty();
  const { mutateAsync: generatePartyId } = useValidateAndGeneratePartyId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(null);

    try {
      const result = await parsePartiesFromExcel(selectedFile);
      setPreview({ count: result.parties.length, errors: result.errors });
    } catch (error) {
      toast.error('Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;

    setIsImporting(true);
    try {
      const result = await parsePartiesFromExcel(file);
      
      let successCount = 0;
      let failCount = 0;

      for (const party of result.parties) {
        try {
          // Generate party ID first
          const partyId = await generatePartyId({ name: party.name, phone: party.phone });
          await addParty({ partyId, ...party });
          successCount++;
        } catch (error) {
          failCount++;
        }
      }

      toast.success(`Imported ${successCount} parties successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
      setFile(null);
      setPreview(null);
      // Reset file input
      const fileInput = document.getElementById('excelFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Parties from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with columns: Party Name, Address, Phone, PAN, Due Amount
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="excelFile">CSV File</Label>
          <Input
            id="excelFile"
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            disabled={isImporting}
          />
          <p className="text-xs text-muted-foreground">
            CSV format: Party Name, Address, Phone, PAN, Due Amount (first row should be headers)
          </p>
        </div>

        {preview && (
          <div className="space-y-2">
            {preview.errors.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ready to import {preview.count} {preview.count === 1 ? 'party' : 'parties'}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Found {preview.errors.length} errors:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {preview.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {preview.errors.length > 5 && (
                      <li>...and {preview.errors.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {preview.count > 0 && preview.errors.length === 0 && (
              <Button onClick={handleImport} disabled={isImporting} className="w-full gap-2">
                <Upload className="h-4 w-4" />
                {isImporting ? 'Importing...' : `Import ${preview.count} ${preview.count === 1 ? 'Party' : 'Parties'}`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
