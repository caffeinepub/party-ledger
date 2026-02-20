import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetShopBranding, useSetShopBranding } from '../../hooks/queries/useBranding';
import { ExternalBlob } from '../../backend';
import { Upload, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function BrandingSettingsCard() {
  const { data: branding } = useGetShopBranding();
  const { mutate: setBranding, isPending } = useSetShopBranding();
  const [shopName, setShopName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Sync shopName state with fetched branding data
  useEffect(() => {
    if (branding?.name) {
      setShopName(branding.name);
    }
  }, [branding?.name]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      setBranding(
        { name: shopName || null, logo: blob },
        {
          onSuccess: () => {
            toast.success('Logo updated successfully');
            setIsUploading(false);
            setUploadProgress(0);
          },
          onError: (error) => {
            toast.error(`Failed to update logo: ${error.message}`);
            setIsUploading(false);
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      toast.error('Failed to read file');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveName = () => {
    setBranding(
      { name: shopName || null, logo: branding?.logo || null },
      {
        onSuccess: () => {
          toast.success('Shop name updated successfully');
        },
        onError: (error) => {
          toast.error(`Failed to update shop name: ${error.message}`);
        },
      }
    );
  };

  const logoUrl = branding?.logo?.getDirectURL() || '/assets/generated/app-logo.dim_256x256.png';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Branding</CardTitle>
        <CardDescription>Customize your shop name and logo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="shopName">Shop Name</Label>
          <div className="flex gap-2">
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter shop name"
              className="flex-1"
            />
            <Button onClick={handleSaveName} disabled={isPending}>
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Shop Logo</Label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center border">
              {branding?.logo ? (
                <img src={logoUrl} alt="Shop logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploading || isPending}
                className="cursor-pointer"
              />
              {isUploading && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-muted-foreground">Uploading: {uploadProgress}%</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a logo image (PNG, JPG, etc.)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
