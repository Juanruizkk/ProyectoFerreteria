import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import OverdueClientsPanel from '../AccountConfig/OverdueClientsPanel';
import PermissionGuard from '@/components/PermissionGuard';
import { PermissionGroups } from '@/config/permissions';
import AccessDenied from '@/components/Common/AccessDenied';

export default function OverdueClientsPage() {
  const navigate = useNavigate();

  return (
    <PermissionGuard
      anyOf={Object.values(PermissionGroups.CURRENT_ACCOUNT.permissions)}
      fallback={<AccessDenied moduleName="la vista de clientes en mora" />}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/clientes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Clientes en Mora</h1>
        </div>

        <OverdueClientsPanel 
          onGoToInterestConfig={() => navigate('/configuracion-cc')} 
        />
      </div>
    </PermissionGuard>
  );
}
