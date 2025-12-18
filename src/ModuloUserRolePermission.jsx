import React, { useState, useEffect } from 'react';
import { Users, Shield, Lock, Eye, EyeOff, Plus, Edit2, Trash2, Save, X, Key, CircleUser, Settings, Search, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = 'http://localhost/restaurant/backend';

const ModuloUserRolPermisos = ({ token }) => {
  const [tabActiva, setTabActiva] = useState('usuarios');
  
  const tabs = [
    { id: 'usuarios', nombre: 'Usuarios', icon: Users },
    { id: 'roles', nombre: 'Roles', icon: CircleUser },
    //{ id: 'permisos', nombre: 'Permisos', icon: Shield }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-red-500 p-3 rounded-lg">
          <Settings className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios, Roles y Permisos del sistema</h1>
          <p className="text-sm text-gray-600">Gestiona usuarios, roles y permisos</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  tabActiva === tab.id
                    ? 'text-red-600 border-b-2 border-red-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {tab.nombre}
              </button>
            );
          })}
        </div>
        
        {/* Contenido de las Tabs */}
        <div className="p-6">
          {tabActiva === 'usuarios' && <TabUsuarios token={token} />}
          {tabActiva === 'roles' && <TabRoles token={token} />}
          {/*{tabActiva === 'permisos' && <TabPermisos token={token} />}*/}
        </div>
      </div>
    </div>
  );
};

// ===================================
// TAB: USUARIOS
// ===================================
const TabUsuarios = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  // Formularios
  const [currentUser, setCurrentUser] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    roleId: '',
    activo: 1
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Cargar datos iniciales
  useEffect(() => {
      cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [usuariosRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/usuarios`, { headers }),
        fetch(`${API_URL}/roles`, { headers })
      ]);

      const [usuariosData, rolesData] = await Promise.all([
        usuariosRes.json(),
        rolesRes.json()
      ]);

      if (usuariosData.success){setUsers(usuariosData.data)}else{localStorage.removeItem('token'); window.location.reload();};
      if (rolesData.success) {setRoles(rolesData.data)}else{localStorage.removeItem('token'); window.location.reload();};

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser.username.trim()) {
      mostrarMensaje('El nombre del usuario es obligatorio', 'error');
      return;
    }
    
    const url = modalMode === 'create' 
      ? `${API_URL}/usuarios`
      : `${API_URL}/usuarios/${currentUser.id_usuario}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentUser)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        cargarDatos();
        resetForm();
        mostrarMensaje(
          modalMode === 'create' ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente',
          'success'
        );
      } else {
        mostrarMensaje(data.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al guardar el proveedor', 'error');
    }
  };

  const handleEdit = (usuario) => {
    setCurrentUser(usuario);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        cargarUsuarios();
        mostrarMensaje('Usuario eliminado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar el usuario', 'error');
    }
  };

  const resetForm = () => {
    setCurrentUser({
      username: '',
      password: '',
      fullName: '',
      email: '',
      roleId: '',
      active: 1
    });
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  const usuariosFiltrados = users.filter(u =>
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de notificación */}
      {mensaje && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setModalMode('create');
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>
      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
              {usuariosFiltrados.map(user => (
                <tr key={user.id_usuario} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{user.nombre_completo}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {user.nombre_rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id_usuario)}
                        className="text-red-600 hover:text-red-800"
                        disabled={user.id_usuario === 1}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700">
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
                  value={currentUser.username}
                  onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {modalMode === 'create' && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentUser.password}
                    onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder={modalMode === 'edit' ? 'Dejar vacío para no cambiar' : 'Contraseña'}
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
                  value={currentUser.nombre_completo}
                  onChange={(e) => setCurrentUser({ ...currentUser, nombre_completo: e.target.value })}
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
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={currentUser.id_rol}
                  onChange={(e) => setCurrentUser({ ...currentUser, id_rol: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map(role => (
                    <option key={role.id_rol} value={role.id_rol}>{role.nombre_rol}</option>
                  ))}
                </select>
              </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={currentUser.activo}
                    onChange={(e) => setCurrentUser({ ...currentUser, activo: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Usuario activo
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

// ===================================
// TAB: ROLES
// ===================================
const TabRoles = ({ token }) => {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [permisoRol, setPermisoRol] = useState([]);
  const [showModalP, setShowModalP] = useState(false);
  const [currentRol, setCurrentRol] = useState({
    nombre_rol: '',
    descripcion: '',
    activo: 1
  });
  const [currentRolPermiso, setCurrenRolPermiso] = useState([]);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Cargar datos iniciales
  useEffect(() => {
      cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/roles`, { headers });
      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentRol.nombre_rol.trim()) {
      mostrarMensaje('El nombre del rol es obligatorio', 'error');
      return;
    }
    
    const url = modalMode === 'create' 
      ? `${API_URL}/roles`
      : `${API_URL}/roles/${currentRol.id_rol}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentRol)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        cargarRoles();
        resetForm();
        mostrarMensaje(
          modalMode === 'create' ? 'Rol creado exitosamente' : 'Rol actualizado exitosamente',
          'success'
        );
      } else {
        mostrarMensaje(data.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al guardar el proveedor', 'error');
    }
  };

  const handleEdit = (roles) => {
    setCurrentRol(roles);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return;
    
    try {
      const response = await fetch(`${API_URL}/roles/${id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        cargarRoles();
        mostrarMensaje('Rol eliminado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar el rol', 'error');
    }
  };

  const handleSubmitP = async() => {
    if(currentRolPermiso.id_rol === 1){ 
      mostrarMensaje('No se puede editar el rol de administradir', 'error');
      return;
    }
    try{
      const response = await fetch(`${API_URL}/roles/${currentRolPermiso.id_rol}/permisos`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(permisoRol)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModalP(false);
        mostrarMensaje('Permisos del rol actualizado exitosamente','success');
      } else {
        mostrarMensaje(data.message || 'Error al guardar', 'error');
      }

    }catch (error){
      console.error('Error:', error);
      mostrarMensaje('Error al actualizar permisos del rol', 'error');
    }
  };

  const getPermissionsByRol = async (rol) => {
    setCurrenRolPermiso(rol);
    try {
      const [permisosRes, permisoRolRes] = await Promise.all([
        fetch(`${API_URL}/permisos`, { headers }),
        fetch(`${API_URL}/permisos/${rol.id_rol}`, { headers })
      ]);

      const [permisosData, permisoRolData] = await Promise.all([
        permisosRes.json(),
        permisoRolRes.json()
      ]);

      if (permisosData.success){
        setPermisos(permisosData.data);
      }else{
        mostrarMensaje(permisosData.message || 'Error al obtener permisos', 'error');
      }
      if (permisoRolData.success) {
        setPermisoRol(permisoRolData.data);
      }else{mostrarMensaje(permisoRolData.message || 'Error al obtener permisos del rol', 'error');};

      setShowModalP(true);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al obtener el rol', 'error');
    }
  };

  const togglePermission = (permiso) => {
    const per = permisoRol.find(p => p.nombre_permiso === permiso.nombre_permiso);

    if(per){
      // Si el permiso existe, lo removemos del array
      const permiso_aux = permisoRol.filter(p => p.id_permiso !== per.id_permiso);
      setPermisoRol(permiso_aux);
    } else {
      // Si el permiso NO existe, lo agregamos al array
      setPermisoRol([...permisoRol, permiso]);
    }
    
  };

  const resetForm = () => {
    setCurrentRol({
      nombre_rol: '',
      descripcion: '',
      activo: 1
    });
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  const rolesFiltrados = roles.filter(r =>
    r.nombre_rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.descripcion && r.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de notificación */}
      {mensaje && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar rol..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setModalMode('create');
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nuevo Rol
        </button>
      </div>
      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descripcion</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rolesFiltrados.map(rol => (
                <tr key={rol.id_rol} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{rol.nombre_rol}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{rol.descripcion}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rol.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rol.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => getPermissionsByRol(rol)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Shield size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(rol)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(rol.id_rol)}
                        className="text-red-600 hover:text-red-800"
                        disabled={rol.id_rol === 1}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={currentRol.nombre_rol}
                  onChange={(e) => setCurrentRol({ ...currentRol, nombre_rol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Nombre del rol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción 
                </label>
                <textarea
                  value={currentRol.descripcion}
                  onChange={(e) => setCurrentRol({...currentRol, descripcion: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={currentRol.activo}
                  onChange={(e) => setCurrentRol({ ...currentRol, activo: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Rol activo
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {modalMode === 'create' ? 'Crear' : 'Actualizar'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {showModalP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Permisos rol {currentRolPermiso.descripcion}
              </h3>
              <button 
                onClick={() => {
                  setShowModalP(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {//Object.keys(permisos).forEach(modulo => (
                  Object.entries(permisos).map(([modulo, perms]) => (
                    <div key={modulo} className="mb-4 last:mb-0">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Lock size={16} />
                        {modulo}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {//permisos[modulo].map(permiso => (
                        perms.map(permiso => (
                          <label key={permiso.id_permiso} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={
                                (permisoRol.find(p => p.id_permiso === permiso.id_permiso)) ? true : false
                                //permisoRol.has(permiso.nombre_permiso)
                              }
                              onChange={() => togglePermission(permiso)}
                              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">{permiso.descripcion}</span>
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
                onClick={handleSubmitP}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowModalP(false);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export { ModuloUserRolPermisos }