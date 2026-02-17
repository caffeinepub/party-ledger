import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useExportData, useImportData } from '../../hooks/queries/useTransfer';
import { downloadJSON, parseJSONFile, mergeImportData } from '../../lib/transfer/jsonTransfer';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function JsonTransferCard() {
  const [importMode, setImportMode] = useState<'overwrite' | 'merge'>('merge');
  const { mutateAsync: exportData, isPending: isExporting } = useExportData();
  const { mutateAsync: importData, isPending: isImporting } = useImportData();

  const handleExport = async () => {
    try {
      const data = await exportData();
      downloadJSON(data);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await parseJSONFile(file);

      if (importMode === 'merge') {
        const currentData = await exportData();
        const mergedData = mergeImportData(currentData, importedData);
        await importData(mergedData);
      } else {
        await importData(importedData);
      }

      toast.success('Data imported successfully');
      e.target.value = '';
    } catch (error) {
      toast.error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Transfer</CardTitle>
        <CardDescription>
          Export or import all data as JSON to share between devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Export Data</Label>
          <Button onClick={handleExport} disabled={isExporting} className="w-full gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export All Data'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Download all parties, payments, and branding as a JSON file
          </p>
        </div>

        <div className="space-y-4">
          <Label>Import Data</Label>
          
          <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as 'overwrite' | 'merge')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="merge" id="merge" />
              <Label htmlFor="merge" className="font-normal cursor-pointer">
                Merge (add/update without deleting existing data)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="overwrite" id="overwrite" />
              <Label htmlFor="overwrite" className="font-normal cursor-pointer">
                Overwrite (replace all existing data)
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
            />
            <p className="text-xs text-muted-foreground">
              Select a JSON file exported from this app
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
