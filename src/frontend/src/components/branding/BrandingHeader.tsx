import { useGetShopBranding } from '../../hooks/queries/useBranding';
import { Building2 } from 'lucide-react';

export default function BrandingHeader() {
  const { data: branding } = useGetShopBranding();

  const logoUrl = branding?.logo?.getDirectURL() || '/assets/generated/app-logo.dim_256x256.png';
  const shopName = branding?.name || 'Party Ledger';

  return (
    <header className="bg-primary text-primary-foreground py-4 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-foreground/10 flex items-center justify-center">
            {branding?.logo ? (
              <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{shopName}</h1>
            <p className="text-sm opacity-90">Collection Management</p>
          </div>
        </div>
      </div>
    </header>
  );
}
