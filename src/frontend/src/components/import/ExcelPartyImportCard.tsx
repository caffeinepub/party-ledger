import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parsePartiesFromExcel } from '../../lib/excel/parsePartiesFromExcel';
import { useAddParty, useValidateAndGeneratePartyId } from '../../hooks/queries/useParties';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FailedParty {
  name: string;
  reason: string;
}

export default function ExcelPartyImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ count: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: FailedParty[] } | null>(null);

  const { mutateAsync: addParty } = useAddParty();
  const { mutateAsync: generatePartyId } = useValidateAndGeneratePartyId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(null);
    setImportResult(null);

    try {
      console.debug('[CSV Import] Parsing file:', selectedFile.name);
      const result = await parsePartiesFromExcel(selectedFile);
      console.debug('[CSV Import] Parsed parties:', result.parties.length, 'Errors:', result.errors.length);
      setPreview({ count: result.parties.length, errors: result.errors });
    } catch (error) {
      console.error('[CSV Import] Parse error:', error);
      toast.error('Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;

    setIsImporting(true);
    setProgress({ current: 0, total: 0 });
    setImportResult(null);

    try {
      console.debug('[CSV Import] Starting import process');
      const result = await parsePartiesFromExcel(file);
      const totalParties = result.parties.length;
      
      console.debug('[CSV Import] Total parties to import:', totalParties);
      setProgress({ current: 0, total: totalParties });

      let successCount = 0;
      const failedParties: FailedParty[] = [];

      // Process in batches of 10 for better performance
      const BATCH_SIZE = 10;
      for (let i = 0; i < result.parties.length; i += BATCH_SIZE) {
        const batch = result.parties.slice(i, Math.min(i + BATCH_SIZE, result.parties.length));
        console.debug(`[CSV Import] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}, parties ${i + 1}-${Math.min(i + BATCH_SIZE, result.parties.length)}`);

        // Process batch in parallel
        const batchPromises = batch.map(async (party, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            console.debug(`[CSV Import] Processing party ${globalIndex + 1}/${totalParties}: ${party.name}`);
            
            // Generate party ID first
            const partyId = await generatePartyId({ name: party.name, phone: party.phone });
            console.debug(`[CSV Import] Generated ID for ${party.name}: ${partyId}`);
            
            // Add party
            await addParty({ partyId, ...party });
            console.debug(`[CSV Import] Successfully added party ${globalIndex + 1}: ${party.name}`);
            
            return { success: true, party };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[CSV Import] Failed to add party ${globalIndex + 1} (${party.name}):`, errorMessage);
            return { success: false, party, error: errorMessage };
          }
        });

        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Update counts and collect failures
        for (const result of batchResults) {
          if (result.success) {
            successCount++;
          } else {
            failedParties.push({
              name: result.party.name,
              reason: result.error || 'Unknown error',
            });
          }
        }

        // Update progress
        const currentProgress = Math.min(i + BATCH_SIZE, totalParties);
        setProgress({ current: currentProgress, total: totalParties });
        console.debug(`[CSV Import] Progress: ${currentProgress}/${totalParties}`);

        // Small delay between batches to avoid overwhelming the backend
        if (i + BATCH_SIZE < result.parties.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.debug('[CSV Import] Import complete. Success:', successCount, 'Failed:', failedParties.length);

      // Set final result
      setImportResult({ success: successCount, failed: failedParties });

      // Show toast notification
      if (failedParties.length === 0) {
        toast.success(`Successfully imported all ${successCount} parties!`);
      } else if (successCount > 0) {
        toast.warning(`Imported ${successCount} parties, ${failedParties.length} failed`);
      } else {
        toast.error(`Failed to import all parties`);
      }

      // Reset file input only on complete success
      if (failedParties.length === 0) {
        setFile(null);
        setPreview(null);
        const fileInput = document.getElementById('excelFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('[CSV Import] Import process error:', error);
      toast.error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImporting(false);
      setProgress(null);
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

        {preview && !importResult && (
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
                  <ScrollArea className="h-32 w-full rounded border p-2">
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {preview.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            {preview.count > 0 && preview.errors.length === 0 && (
              <Button 
                onClick={handleImport} 
                disabled={isImporting} 
                className="w-full gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {progress ? `Importing ${progress.current} of ${progress.total}...` : 'Starting import...'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {preview.count} {preview.count === 1 ? 'Party' : 'Parties'}
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {importResult && (
          <div className="space-y-2">
            {importResult.failed.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Import Complete!</p>
                  <p className="text-sm mt-1">Successfully imported all {importResult.success} parties.</p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    Import Completed with Errors
                  </p>
                  <p className="text-sm mb-2">
                    Success: {importResult.success} | Failed: {importResult.failed.length}
                  </p>
                  <p className="text-sm font-medium mb-1">Failed parties:</p>
                  <ScrollArea className="h-40 w-full rounded border p-2 bg-background">
                    <ul className="text-sm space-y-2">
                      {importResult.failed.map((failed, i) => (
                        <li key={i} className="border-b pb-2 last:border-b-0">
                          <span className="font-medium">{failed.name}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{failed.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => {
                setImportResult(null);
                setFile(null);
                setPreview(null);
                const fileInput = document.getElementById('excelFile') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
              variant="outline"
              className="w-full"
            >
              Import Another File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
