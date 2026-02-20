import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandingSettingsCard from '../components/branding/BrandingSettingsCard';
import ExcelPartyImportCard from '../components/import/ExcelPartyImportCard';
import JsonTransferCard from '../components/transfer/JsonTransferCard';
import PrincipalDisplayCard from '../components/settings/PrincipalDisplayCard';
import AdminPrincipalsPanel from '../components/admin/AdminPrincipalsPanel';
import { useIsCallerAdmin } from '../hooks/queries/useAdminPrincipals';

export default function SettingsPage() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="transfer">Data Transfer</TabsTrigger>
          {!isAdminLoading && isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <PrincipalDisplayCard />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettingsCard />
        </TabsContent>

        <TabsContent value="import">
          <ExcelPartyImportCard />
        </TabsContent>

        <TabsContent value="transfer">
          <JsonTransferCard />
        </TabsContent>

        {!isAdminLoading && isAdmin && (
          <TabsContent value="admin">
            <AdminPrincipalsPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
