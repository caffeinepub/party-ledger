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
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
            {branding?.logo ? (
              <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold break-words">{shopName}</h1>
            <p className="text-xs sm:text-sm opacity-90">Collection Management</p>
          </div>
        </div>
      </div>
    </header>
  );
}
