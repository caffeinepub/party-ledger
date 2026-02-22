import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BrandingSettingsCard from '../components/branding/BrandingSettingsCard';
import ExcelPartyImportCard from '../components/import/ExcelPartyImportCard';
import JsonTransferCard from '../components/transfer/JsonTransferCard';
import PrincipalDisplayCard from '../components/settings/PrincipalDisplayCard';
import AdminPrincipalsPanel from '../components/admin/AdminPrincipalsPanel';
import { useIsCallerAdmin } from '../hooks/queries/useAdminPrincipals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const navigate = useNavigate();

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
          <TabsTrigger value="data-health">Data Health</TabsTrigger>
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

        <TabsContent value="data-health">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Data Health Tools
              </CardTitle>
              <CardDescription>
                Tools to identify and resolve data quality issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Find Duplicate Parties</h3>
                <p className="text-sm text-muted-foreground">
                  Identify party records with duplicate names that may need to be merged or cleaned up.
                </p>
                <Button
                  onClick={() => navigate({ to: '/duplicates' })}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  View Duplicate Detection
                </Button>
              </div>
            </CardContent>
          </Card>
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
