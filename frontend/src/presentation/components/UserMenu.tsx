// =============================================================================
// USER MENU COMPONENT - PRESENTATION
// =============================================================================
// Dropdown menu del avatar de usuario en el header del dashboard
// Opciones: Perfil y Cerrar Sesión

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../application/context/AuthContext';
import { LABELS } from '../../application/constants/labels';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';

export default function UserMenu(): React.ReactElement {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleProfile = (): void => {
    navigate('/dashboard/profile');
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  const userName = user?.name ?? 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer w-full text-left"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{userName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {userInitial}
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={4}>
        <DropdownMenuItem
          onClick={handleProfile}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          {LABELS.userMenu.profile}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {LABELS.userMenu.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}