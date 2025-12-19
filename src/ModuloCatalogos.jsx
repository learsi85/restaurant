import React, { useState, useEffect } from 'react';
import { Settings, Truck, Ruler, FolderOpen, Plus, Edit, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';

//const API_URL = 'http://localhost/restaurant/backend';
const API_URL = 'https://acciontic.com.mx/restaurant';

// Componente Principal - Módulo de Catálogos
const ModuloCatalogos = ({ token }) => {
  const [tabActiva, setTabActiva] = useState('proveedores');
  
  const tabs = [
    { id: 'proveedores', nombre: 'Proveedores', icon: Truck },
    { id: 'categorias', nombre: 'Categorías', icon: FolderOpen },
    { id: 'unidades', nombre: 'Unidades', icon: Ruler }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-purple-500 p-3 rounded-lg">
          <Settings className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Catálogos del Sistema</h1>
          <p className="text-sm text-gray-600">Gestiona proveedores, categorías y unidades de medida</p>
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
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
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
          {tabActiva === 'proveedores' && <TabProveedores token={token} />}
          {tabActiva === 'categorias' && <TabCategorias token={token} />}
          {tabActiva === 'unidades' && <TabUnidades token={token} />}
        </div>
      </div>
    </div>
  );
};

// ===================================
// TAB: PROVEEDORES
// ===================================
const TabProveedores = ({ token }) => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [currentProveedor, setCurrentProveedor] = useState({
    nombre_proveedor: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarProveedores();
  }, []);
  
  const cargarProveedores = async () => {
    try {
      const response = await fetch(`${API_URL}/proveedores`, { headers });
      const data = await response.json();
      if (data.success) {
        setProveedores(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!currentProveedor.nombre_proveedor.trim()) {
      mostrarMensaje('El nombre del proveedor es obligatorio', 'error');
      return;
    }
    
    const url = modalMode === 'create' 
      ? `${API_URL}/proveedores`
      : `${API_URL}/proveedores/${currentProveedor.id_proveedor}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentProveedor)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        cargarProveedores();
        resetForm();
        mostrarMensaje(
          modalMode === 'create' ? 'Proveedor creado exitosamente' : 'Proveedor actualizado exitosamente',
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
  
  const handleEdit = (proveedor) => {
    setCurrentProveedor(proveedor);
    setModalMode('edit');
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    
    try {
      const response = await fetch(`${API_URL}/proveedores/${id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        cargarProveedores();
        mostrarMensaje('Proveedor eliminado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar el proveedor', 'error');
    }
  };
  
  const resetForm = () => {
    setCurrentProveedor({
      nombre_proveedor: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };
  
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };
  
  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre_proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.contacto && p.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
            placeholder="Buscar proveedor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setModalMode('create');
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>
      
      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proveedoresFiltrados.map(proveedor => (
                <tr key={proveedor.id_proveedor} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Truck className="text-purple-500" size={20} />
                      <div>
                        <div className="font-medium text-gray-900">{proveedor.nombre_proveedor}</div>
                        {proveedor.direccion && (
                          <div className="text-sm text-gray-500">{proveedor.direccion}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{proveedor.contacto || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{proveedor.telefono || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{proveedor.email || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(proveedor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(proveedor.id_proveedor)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
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
        
        {proveedoresFiltrados.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Truck size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay proveedores registrados</p>
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proveedor *</label>
                <input
                  type="text"
                  value={currentProveedor.nombre_proveedor}
                  onChange={(e) => setCurrentProveedor({...currentProveedor, nombre_proveedor: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Distribuidora López"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Contacto</label>
                  <input
                    type="text"
                    value={currentProveedor.contacto}
                    onChange={(e) => setCurrentProveedor({...currentProveedor, contacto: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={currentProveedor.telefono}
                    onChange={(e) => setCurrentProveedor({...currentProveedor, telefono: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: 555-1234"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={currentProveedor.email}
                  onChange={(e) => setCurrentProveedor({...currentProveedor, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: contacto@proveedor.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <textarea
                  value={currentProveedor.direccion}
                  onChange={(e) => setCurrentProveedor({...currentProveedor, direccion: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="2"
                  placeholder="Dirección completa del proveedor"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================
// TAB: CATEGORÍAS
// ===================================
const TabCategorias = ({ token }) => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [currentCategoria, setCurrentCategoria] = useState({
    nombre_categoria: '',
    descripcion: ''
  });
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarCategorias();
  }, []);
  
  const cargarCategorias = async () => {
    try {
      const response = await fetch(`${API_URL}/categorias`, { headers });
      const data = await response.json();
      if (data.success) {
        setCategorias(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!currentCategoria.nombre_categoria.trim()) {
      mostrarMensaje('El nombre de la categoría es obligatorio', 'error');
      return;
    }
    
    const url = modalMode === 'create' 
      ? `${API_URL}/categorias`
      : `${API_URL}/categorias/${currentCategoria.id_categoria}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentCategoria)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        cargarCategorias();
        resetForm();
        mostrarMensaje(
          modalMode === 'create' ? 'Categoría creada exitosamente' : 'Categoría actualizada exitosamente',
          'success'
        );
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al guardar la categoría', 'error');
    }
  };
  
  const handleEdit = (categoria) => {
    setCurrentCategoria(categoria);
    setModalMode('edit');
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
      const response = await fetch(`${API_URL}/categorias/${id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        cargarCategorias();
        mostrarMensaje('Categoría eliminada exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar la categoría', 'error');
    }
  };
  
  const resetForm = () => {
    setCurrentCategoria({
      nombre_categoria: '',
      descripcion: ''
    });
  };
  
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };
  
  const categoriasFiltradas = categorias.filter(c =>
    c.nombre_categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {mensaje && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setModalMode('create');
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nueva Categoría
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriasFiltradas.map(categoria => (
          <div key={categoria.id_categoria} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="text-purple-500" size={20} />
                <h3 className="font-semibold text-gray-900">{categoria.nombre_categoria}</h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(categoria)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(categoria.id_categoria)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {categoria.descripcion && (
              <p className="text-sm text-gray-600">{categoria.descripcion}</p>
            )}
          </div>
        ))}
      </div>
      
      {categoriasFiltradas.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay categorías registradas</p>
        </div>
      )}
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Categoría *</label>
                <input
                  type="text"
                  value={currentCategoria.nombre_categoria}
                  onChange={(e) => setCurrentCategoria({...currentCategoria, nombre_categoria: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Proteínas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={currentCategoria.descripcion}
                  onChange={(e) => setCurrentCategoria({...currentCategoria, descripcion: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  placeholder="Descripción de la categoría"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================
// TAB: UNIDADES DE MEDIDA
// ===================================
const TabUnidades = ({ token }) => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [currentUnidad, setCurrentUnidad] = useState({
    nombre_unidad: '',
    abreviatura: '',
    tipo: 'peso'
  });
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarUnidades();
  }, []);
  
  const cargarUnidades = async () => {
    try {
      const response = await fetch(`${API_URL}/unidades`, { headers });
      const data = await response.json();
      if (data.success) {
        setUnidades(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!currentUnidad.nombre_unidad.trim() || !currentUnidad.abreviatura.trim()) {
      mostrarMensaje('El nombre y la abreviatura son obligatorios', 'error');
      return;
    }
    
    const url = modalMode === 'create' 
      ? `${API_URL}/unidades`
      : `${API_URL}/unidades/${currentUnidad.id_unidad}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentUnidad)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        cargarUnidades();
        resetForm();
        mostrarMensaje(
          modalMode === 'create' ? 'Unidad creada exitosamente' : 'Unidad actualizada exitosamente',
          'success'
        );
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al guardar la unidad', 'error');
    }
  };
  
  const handleEdit = (unidad) => {
    setCurrentUnidad(unidad);
    setModalMode('edit');
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta unidad?')) return;
    
    try {
      const response = await fetch(`${API_URL}/unidades/${id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();

      if (data.success) {
        cargarUnidades();
        mostrarMensaje('Unidad eliminada exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar la unidad', 'error');
    }
  };

  const resetForm = () => {
    setCurrentUnidad({
    nombre_unidad: '',
    abreviatura: '',
    tipo: 'peso'
    });
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };
  
  const unidadesFiltradas = unidades.filter(u =>
    u.nombre_unidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.abreviatura.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getTipoBadge = (tipo) => {
    const configs = {
      'peso': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Peso' },
      'volumen': { bg: 'bg-green-100', text: 'text-green-800', label: 'Volumen' },
      'unidad': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Unidad' }
    };
  
    const config = configs[tipo] || configs.unidad;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {mensaje && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
        >
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar unidad..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
            
        <button
          onClick={() => {
            resetForm();
            setModalMode('create');
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
            Nueva Unidad
        </button>
      </div>
        
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abreviatura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unidadesFiltradas.map(unidad => (
                <tr key={unidad.id_unidad} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Ruler className="text-purple-500" size={20} />
                      <span className="font-medium text-gray-900">{unidad.nombre_unidad}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded">
                      {unidad.abreviatura}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getTipoBadge(unidad.tipo)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(unidad)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(unidad.id_unidad)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
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
            
        {unidadesFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Ruler size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay unidades registradas</p>
          </div>
        )}
      </div>
        
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Nueva Unidad' : 'Editar Unidad'}
              </h2>
            </div>
                
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Unidad *</label>
                <input
                  type="text"
                  value={currentUnidad.nombre_unidad}
                  onChange={(e) => setCurrentUnidad({...currentUnidad, nombre_unidad: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Kilogramo"
                />
              </div>
                
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Abreviatura *</label>
                  <input
                    type="text"
                    value={currentUnidad.abreviatura}
                    onChange={(e) => setCurrentUnidad({...currentUnidad, abreviatura: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: kg"
                  />
                </div>
                    
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                  <select
                    value={currentUnidad.tipo}
                    onChange={(e) => setCurrentUnidad({...currentUnidad, tipo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                  >
                    <option value="peso">Peso</option>
                    <option value="volumen">Volumen</option>
                    <option value="unidad">Unidad</option>
                  </select>
                </div>
              </div>
                
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ModuloCatalogos };