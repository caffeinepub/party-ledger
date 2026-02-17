import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandingSettingsCard from '../components/branding/BrandingSettingsCard';
import ExcelPartyImportCard from '../components/import/ExcelPartyImportCard';
import JsonTransferCard from '../components/transfer/JsonTransferCard';
import StaffManagementPanel from '../components/admin/StaffManagementPanel';
import { useStaffAuth } from '../hooks/useStaffAuth';

export default function SettingsPage() {
  const { isAdmin } = useStaffAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="transfer">Data Transfer</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="branding">
          <BrandingSettingsCard />
        </TabsContent>

        <TabsContent value="import">
          <ExcelPartyImportCard />
        </TabsContent>

        <TabsContent value="transfer">
          <JsonTransferCard />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <StaffManagementPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
