import React, { useState, useEffect } from 'react';
import { Users, Shield, Lock, Eye, EyeOff, Plus, Edit2, Trash2, Save, X, Key } from 'lucide-react';

const UserRolePermissionModule = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Permisos predefinidos del sistema
  const systemPermissions = [
    { id: 'ventas_crear', name: 'Crear Ventas', module: 'Ventas' },
    { id: 'ventas_ver', name: 'Ver Ventas', module: 'Ventas' },
    { id: 'ventas_editar', name: 'Editar Ventas', module: 'Ventas' },
    { id: 'ventas_eliminar', name: 'Eliminar Ventas', module: 'Ventas' },
    { id: 'productos_crear', name: 'Crear Productos', module: 'Productos' },
    { id: 'productos_ver', name: 'Ver Productos', module: 'Productos' },
    { id: 'productos_editar', name: 'Editar Productos', module: 'Productos' },
    { id: 'productos_eliminar', name: 'Eliminar Productos', module: 'Productos' },
    { id: 'clientes_crear', name: 'Crear Clientes', module: 'Clientes' },
    { id: 'clientes_ver', name: 'Ver Clientes', module: 'Clientes' },
    { id: 'clientes_editar', name: 'Editar Clientes', module: 'Clientes' },
    { id: 'clientes_eliminar', name: 'Eliminar Clientes', module: 'Clientes' },
    { id: 'reportes_ver', name: 'Ver Reportes', module: 'Reportes' },
    { id: 'reportes_exportar', name: 'Exportar Reportes', module: 'Reportes' },
    { id: 'usuarios_crear', name: 'Crear Usuarios', module: 'Usuarios' },
    { id: 'usuarios_ver', name: 'Ver Usuarios', module: 'Usuarios' },
    { id: 'usuarios_editar', name: 'Editar Usuarios', module: 'Usuarios' },
    { id: 'usuarios_eliminar', name: 'Eliminar Usuarios', module: 'Usuarios' },
    { id: 'roles_gestionar', name: 'Gestionar Roles', module: 'Administración' },
    { id: 'configuracion_ver', name: 'Ver Configuración', module: 'Administración' },
  ];

  const permisosRol = [
    {nombre_permiso: 'inventario_ver'},
    {nombre_permiso: 'productos_ver'},
    {nombre_permiso: 'ventas_ver'},
    {nombre_permiso: 'ventas_crear'},
    {nombre_permiso: 'caja_ver'},
    {nombre_permiso: 'caja_abrir'},
    {nombre_permiso: 'caja_cerrar'}
  ];

  const permiso = {
    caja: [  
      {accion: "ver", activo: "1", descripcion: "Ver caja", id_permiso: "17", modulo: "caja", nombre_permiso: "caja_ver"},
      {accion: "abrir", activo: "1", descripcion: "Abrir caja", id_permiso: "18", modulo: "caja", nombre_permiso: "caja_abrir"},
      {accion: "cerrar", activo: "1", descripcion: "Cerrar caja", id_permiso: "19", modulo: "caja", nombre_permiso: "caja_cerrar"}
    ],
    inventario: [
      {accion: "ajustar", activo: "1", descripcion: "Ajustar stock de insumos", id_permiso: "5", modulo: "inventario", nombre_permiso: "inventario_ajustar"},
      {accion: "crear", activo: "1", descripcion: "Crear nuevos insumos", id_permiso: "2", modulo: "inventario", nombre_permiso: "inventario_crear"},
      {accion: "editar", activo: "1", descripcion: "Editar insumos existentes", id_permiso: "3", modulo: "inventario", nombre_permiso: "inventario_editar"},
      {accion: "eliminar", activo: "1", descripcion: "Eliminar insumos", id_permiso: "4", modulo: "inventario", nombre_permiso: "inventario_eliminar"},
      {accion: "ver", activo: "1", descripcion: "Ver inventario de insumos", id_permiso: "1", modulo: "inventario", nombre_permiso: "inventario_ver"}
    ],
    productos: [
      {accion: "crear", activo: "1", descripcion: "Crear productos", id_permiso: "10", modulo: "productos", nombre_permiso: "productos_crear"},
      {accion: "editar", activo: "1", descripcion: "Editar productos y recetas", id_permiso: "11", modulo: "productos", nombre_permiso: "productos_editar"},
      {accion: "eliminar", activo: "1", descripcion: "Eliminar productos", id_permiso: "12", modulo: "productos", nombre_permiso: "productos_eliminar"},
      {accion: "ver", activo: "1", descripcion: "Ver productos terminados", id_permiso: "9", modulo: "productos", nombre_permiso: "productos_ver"}
    ],
    ventas: [
      {accion: "crear", activo: "1", descripcion: "Realizar ventas", id_permiso: "16", modulo: "ventas", nombre_permiso: "ventas_crear"},
      {accion: "ver", activo: "1", descripcion: "Ver historial de ventas", id_permiso: "15", modulo: "ventas", nombre_permiso: "ventas_ver"}
    ]
  }
  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    // Roles predefinidos
    const defaultRoles = [
      {
        id: 1,
        name: 'Administrador',
        description: 'Acceso completo al sistema',
        permissions: systemPermissions.map(p => p.id),
        isSystem: true
      },
      {
        id: 2,
        name: 'Cajero',
        description: 'Gestión de ventas y clientes',
        permissions: ['ventas_crear', 'ventas_ver', 'clientes_ver', 'clientes_crear', 'productos_ver'],
        isSystem: false
      },
      {
        id: 3,
        name: 'Cocinero',
        description: 'Visualización de pedidos',
        permissions: ['ventas_ver', 'productos_ver'],
        isSystem: false
      }
    ];

    // Usuario administrador por defecto
    const defaultUsers = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrador',
        email: 'admin@polleria.com',
        roleId: 1,
        active: true,
        createdAt: new Date().toISOString()
      }
    ];

    setRoles(defaultRoles);
    setUsers(defaultUsers);
    setPermissions(systemPermissions);
  };

  // Formularios
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    roleId: '',
    active: true
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Funciones para usuarios
  const openUserModal = (user = null) => {
    if (user) {
      setUserForm({ ...user, password: '' });
      setEditingItem(user);
    } else {
      setUserForm({
        username: '',
        password: '',
        fullName: '',
        email: '',
        roleId: '',
        active: true
      });
      setEditingItem(null);
    }
    setModalType('user');
    setShowModal(true);
  };

  const saveUser = () => {
    if (!userForm.username || !userForm.fullName || !userForm.roleId) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    if (!editingItem && !userForm.password) {
      alert('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    if (editingItem) {
      setUsers(users.map(u => u.id === editingItem.id ? {
        ...userForm,
        id: editingItem.id,
        password: userForm.password || editingItem.password
      } : u));
    } else {
      const newUser = {
        ...userForm,
        id: users.length + 1,
        createdAt: new Date().toISOString()
      };
      setUsers([...users, newUser]);
    }
    closeModal();
  };

  const deleteUser = (id) => {
    if (id === 1) {
      alert('No se puede eliminar el usuario administrador');
      return;
    }
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  // Funciones para roles
  const openRoleModal = (role = null) => {
    if (role) {
      setRoleForm({ ...role });
      setEditingItem(role);
    } else {
      setRoleForm({
        name: '',
        description: '',
        permissions: []
      });
      setEditingItem(null);
    }
    setModalType('role');
    setShowModal(true);
  };

  const saveRole = () => {
    if (!roleForm.name) {
      alert('El nombre del rol es obligatorio');
      return;
    }

    if (editingItem) {
      if (editingItem.isSystem) {
        alert('No se pueden editar roles del sistema');
        return;
      }
      setRoles(roles.map(r => r.id === editingItem.id ? {
        ...roleForm,
        id: editingItem.id
      } : r));
    } else {
      const newRole = {
        ...roleForm,
        id: roles.length + 1,
        isSystem: false
      };
      setRoles([...roles, newRole]);
    }
    closeModal();
  };

  const deleteRole = (id) => {
    const role = roles.find(r => r.id === id);
    if (role.isSystem) {
      alert('No se pueden eliminar roles del sistema');
      return;
    }
    const usersWithRole = users.filter(u => u.roleId === id);
    if (usersWithRole.length > 0) {
      alert('No se puede eliminar el rol porque tiene usuarios asignados');
      return;
    }
    if (confirm('¿Está seguro de eliminar este rol?')) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  const togglePermission = (permissionId) => {
    const newPermissions = roleForm.permissions.includes(permissionId)
      ? roleForm.permissions.filter(p => p !== permissionId)
      : [...roleForm.permissions, permissionId];
    setRoleForm({ ...roleForm, permissions: newPermissions });
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setShowPassword(false);
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Sin rol';
  };

  const getPermissionsByModule = () => {
    const grouped = {};
    systemPermissions.forEach(perm => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });
    return grouped;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="text-orange-500" />
                Gestión de Usuarios y Permisos
              </h1>
              <p className="text-gray-600 mt-2">Control de acceso y roles del sistema</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 font-semibold transition-colors ${
                activeTab === 'roles'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield size={20} />
              Roles y Permisos
            </button>
          </div>
        </div>

        {/* Contenido de Usuarios */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Usuarios del Sistema</h2>
              <button
                onClick={() => openUserModal()}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Plus size={20} />
                Nuevo Usuario
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre Completo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {getRoleName(user.roleId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openUserModal(user)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={user.id === 1}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contenido de Roles */}
        {activeTab === 'roles' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Roles y Permisos</h2>
              <button
                onClick={() => openRoleModal()}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <Plus size={20} />
                Nuevo Rol
              </button>
            </div>

            <div className="grid gap-4">
              {roles.map(role => (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
                        {role.isSystem && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            Sistema
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openRoleModal(role)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={role.isSystem}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteRole(role.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={role.isSystem}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(permId => {
                      const perm = systemPermissions.find(p => p.id === permId);
                      return perm ? (
                        <span key={permId} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                          {perm.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Usuario */}
        {showModal && modalType === 'user' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingItem ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario *
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Nombre de usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {!editingItem && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder={editingItem ? 'Dejar vacío para no cambiar' : 'Contraseña'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={userForm.active}
                    onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Usuario activo
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveUser}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Guardar
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Rol */}
        {showModal && modalType === 'role' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingItem ? 'Editar Rol' : 'Nuevo Rol'}
                </h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Rol *
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Gerente, Supervisor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    rows="2"
                    placeholder="Descripción del rol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permisos *
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {Object.entries(getPermissionsByModule()).map(([module, perms]) => (
                      <div key={module} className="mb-4 last:mb-0">
                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Lock size={16} />
                          {module}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                          {perms.map(perm => (
                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={roleForm.permissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700">{perm.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveRole}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Guardar
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRolePermissionModule;
