// =============================================================================
// USER MANAGEMENT PAGE - PRESENTATION
// =============================================================================
// Página de gestión de usuarios para administradores

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../application/context/AuthContext';
import { useToast } from '../../application/context/ToastContext';
import { LABELS } from '../../application/constants/labels';
import userManagementService, { UserInfo, UserRole } from '../../infrastructure/services/UserManagementService';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const ROLES: UserRole[] = ['SUPERVISOR', 'OPERADOR', 'CHOFER'];

const roleBadgeStyles: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  SUPERVISOR: 'bg-purple-100 text-purple-700',
  OPERADOR: 'bg-blue-100 text-blue-700',
  CHOFER: 'bg-green-100 text-green-700',
};

export default function UserManagement(): React.ReactElement {
  const { user: currentUser, hasRole } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  
  // Estados para crear usuario
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'OPERADOR' as UserRole });
  const [isCreating, setIsCreating] = useState(false);

  // Estados para editar usuario
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Verificar que el usuario es ADMIN
  if (!hasRole('ADMIN')) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-gray-200 border-dashed">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1 text-center">Acceso Denegado</h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userManagementService.listUsers();
      setUsers(data);
    } catch (err) {
      toast.error('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole): Promise<void> => {
    // No permitir cambiar el rol del usuario actual
    if (userId === currentUser?.id) {
      toast.error('No puedes cambiar tu propio rol');
      return;
    }

    setChangingRole(userId);
    try {
      const updatedUser = await userManagementService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
      toast.success('Rol actualizado correctamente');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Error updating role:', error.response?.data || err);
      toast.error(error.response?.data?.message || 'Error al actualizar el rol');
    } finally {
      setChangingRole(null);
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    // No permitirse eliminar a uno mismo
    if (userId === currentUser?.id) {
      toast.error('No puedes eliminarte a ti mismo');
      return;
    }

    const confirmed = window.confirm(LABELS.userManagement.actions.deactivateConfirm);
    if (!confirmed) return;

    setDeletingUser(userId);
    try {
      await userManagementService.deactivateUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('Usuario eliminado correctamente');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Error deleting user:', error.response?.data || err);
      toast.error(error.response?.data?.message || 'Error al eliminar el usuario');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleCreateUser = async (): Promise<void> => {
    if (!newUser.email || !newUser.name) {
      toast.error('El email y nombre son obligatorios');
      return;
    }

    setIsCreating(true);
    try {
      const createdUser = await userManagementService.createUser({
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      });
      
      // Recargar lista de usuarios
      const users = await userManagementService.listUsers();
      setUsers(users);
      
      // Mostrar la contraseña del usuario creado
      if (createdUser.password) {
        toast.success(`${LABELS.userManagement.actions.createSuccess}. Contraseña: ${createdUser.password}`);
      } else {
        toast.success(LABELS.userManagement.actions.createSuccess);
      }
      
      setIsCreateDialogOpen(false);
      setNewUser({ email: '', name: '', role: 'OPERADOR' });
    } catch (err) {
      toast.error(LABELS.userManagement.actions.createError);
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (): Promise<void> => {
    if (!editingUser) return;

    setIsEditing(true);
    try {
      await userManagementService.updateUserRole(editingUser.id, editingUser.role);
      
      // Recargar lista de usuarios
      const users = await userManagementService.listUsers();
      setUsers(users);
      
      toast.success('Usuario actualizado correctamente');
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (err) {
      toast.error('Error al actualizar el usuario');
      console.error(err);
    } finally {
      setIsEditing(false);
    }
  };

  const openEditDialog = (user: UserInfo): void => {
    // Solo permitir editar usuarios creados desde el panel (source: 'admin')
    if (user.source !== 'admin') {
      toast.error('No puedes editar usuarios registrados desde Clerk');
      return;
    }
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (users.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {LABELS.userManagement.title}
            </h1>
            <p className="text-gray-500 mt-1">
              {LABELS.userManagement.subtitle}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus size={18} className="mr-2" />
            {LABELS.userManagement.actions.create}
          </Button>
        </div>
        <EmptyState
          icon={Users}
          title={LABELS.userManagement.empty}
          description=""
        />

        {/* Dialog para crear usuario (incluido en estado vacío) */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{LABELS.userManagement.actions.create}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-empty">Email</Label>
                <Input 
                  id="email-empty"
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div>
                <Label htmlFor="name-empty">Nombre</Label>
                <Input 
                  id="name-empty"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nombre del usuario"
                />
              </div>
              <div>
                <Label htmlFor="role-empty">Rol</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
                >
                  <SelectTrigger id="role-empty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERVISOR">{LABELS.userManagement.roles.SUPERVISOR}</SelectItem>
                    <SelectItem value="OPERADOR">{LABELS.userManagement.roles.OPERADOR}</SelectItem>
                    <SelectItem value="CHOFER">{LABELS.userManagement.roles.CHOFER}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {LABELS.common.actions.cancel}
              </Button>
              <Button 
                onClick={handleCreateUser} 
                disabled={isCreating || !newUser.email || !newUser.name}
              >
                {isCreating ? LABELS.common.actions.loading : LABELS.common.actions.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {LABELS.userManagement.title}
          </h1>
          <p className="text-gray-500 mt-1">
            {LABELS.userManagement.subtitle}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus size={18} className="mr-2" />
          {LABELS.userManagement.actions.create}
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{LABELS.userManagement.columns.name}</TableHead>
              <TableHead>{LABELS.userManagement.columns.email}</TableHead>
              <TableHead>{LABELS.userManagement.columns.role}</TableHead>
              <TableHead>Contraseña</TableHead>
              <TableHead>{LABELS.userManagement.columns.createdAt}</TableHead>
              <TableHead className="text-right">{LABELS.userManagement.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users
              .sort((a, b) => {
                // ADMIN siempre primero
                if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
                if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
                return 0;
              })
              .map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              // Usar source para determinar si es de Clerk o del panel
              const isFromClerk = user.source === 'clerk';
              const canEdit = user.source === 'admin' && !isCurrentUser;
              
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-gray-500">{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        roleBadgeStyles[user.role]
                      )}
                    >
                      {LABELS.userManagement.roles[user.role]}
                    </span>
                    {isFromClerk && (
                      <span className="ml-2 text-xs text-gray-400">(registrado)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 font-mono text-xs">
                    {user.source === 'admin' && user.password ? user.password : '—'}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botón de editar (lápiz) - solo para usuarios creados desde el panel */}
                      {canEdit && (
                        <button
                          onClick={() => openEditDialog(user)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar usuario"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {/* Botón de borrar - solo para usuarios creados desde el panel */}
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para crear usuario */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{LABELS.userManagement.actions.create}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="ejemplo@correo.com"
              />
            </div>
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Nombre del usuario"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={newUser.role} 
                onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">{LABELS.userManagement.roles.SUPERVISOR}</SelectItem>
                  <SelectItem value="OPERADOR">{LABELS.userManagement.roles.OPERADOR}</SelectItem>
                  <SelectItem value="CHOFER">{LABELS.userManagement.roles.CHOFER}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {LABELS.common.actions.cancel}
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={isCreating || !newUser.email || !newUser.name}
            >
              {isCreating ? LABELS.common.actions.loading : LABELS.common.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={editingUser.email} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Nombre</Label>
                <Input value={editingUser.name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input value={editingUser.password || ''} disabled className="bg-gray-50 font-mono" />
              </div>
              <div>
                <Label>Rol</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value as UserRole})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERVISOR">{LABELS.userManagement.roles.SUPERVISOR}</SelectItem>
                    <SelectItem value="OPERADOR">{LABELS.userManagement.roles.OPERADOR}</SelectItem>
                    <SelectItem value="CHOFER">{LABELS.userManagement.roles.CHOFER}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {LABELS.common.actions.cancel}
            </Button>
            <Button 
              onClick={handleEditUser} 
              disabled={isEditing}
            >
              {isEditing ? LABELS.common.actions.loading : LABELS.common.actions.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}