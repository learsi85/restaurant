import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Edit, Trash2, TrendingDown } from 'lucide-react';
import { usePermisos } from './App';

//const API_URL = 'http://localhost/restaurant/backend';
const API_URL = 'https://acciontic.com.mx/restaurant';

// Componente de Dashboard de Inventario
const ModuloInventario = ({ token }) => {
  const [insumos, setInsumos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [currentInsumo, setCurrentInsumo] = useState({
    nombre_insumo: '',
    descripcion: '',
    id_categoria: '',
    id_unidad: '',
    stock_actual: 0,
    stock_minimo: 0,
    precio_promedio: 0
  });
  const { tienePermiso } = usePermisos();
  
  // Validar permisos específicos
  //const puedeVer = tienePermiso('inventario', 'ver');
  const puedeCrear = tienePermiso('inventario', 'crear');
  const puedeEditar = tienePermiso('inventario', 'editar');
  const puedeEliminar = tienePermiso('inventario', 'eliminar');
  //const puedeAjustar = tienePermiso('inventario', 'ajustar');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    try {
      const [insumosRes, alertasRes, categoriasRes, unidadesRes] = await Promise.all([
        fetch(`${API_URL}/insumos`, { headers }),
        fetch(`${API_URL}/insumos/a/alertas`, { headers }),
        fetch(`${API_URL}/categorias`, { headers }),
        fetch(`${API_URL}/unidades`, { headers })
      ]);
      
      const [insumosData, alertasData, categoriasData, unidadesData] = await Promise.all([
        insumosRes.json(),
        alertasRes.json(),
        categoriasRes.json(),
        unidadesRes.json()
      ]);
      
      if (insumosData.success){setInsumos(insumosData.data)}else{localStorage.removeItem('token'); window.location.reload();};
      if (alertasData.success) {setAlertas(alertasData.data)}else{localStorage.removeItem('token'); window.location.reload();};
      if (categoriasData.success) {setCategorias(categoriasData.data)}else{localStorage.removeItem('token'); window.location.reload();};
      if (unidadesData.success) {setUnidades(unidadesData.data)}else{localStorage.removeItem('token'); window.location.reload();};
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    const url = modalMode === 'create' 
      ? `${API_URL}/insumos`
      : `${API_URL}/insumos/${currentInsumo.id_insumo}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentInsumo)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        cargarDatos();
        resetForm();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const handleEdit = (insumo) => {
    setCurrentInsumo(insumo);
    setModalMode('edit');
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este insumo?')) return;
    
    try {
      const response = await fetch(`${API_URL}/insumos/${id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        cargarDatos();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const resetForm = () => {
    setCurrentInsumo({
      nombre_insumo: '',
      descripcion: '',
      id_categoria: '',
      id_unidad: '',
      stock_actual: 0,
      stock_minimo: 0,
      precio_promedio: 0
    });
  };
  
  const insumosFiltrados = insumos.filter(insumo => {
    const matchSearch = insumo.nombre_insumo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !filterCategoria || insumo.id_categoria == filterCategoria;
    return matchSearch && matchCategoria;
  });
  
  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'CRÍTICO': return 'bg-red-100 text-red-800 border-red-300';
      case 'BAJO': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-yellow-600" size={20} />
              <h3 className="font-semibold text-yellow-800">Alertas de Stock Bajo</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {alertas.slice(0, 5).map(alerta => (
                <span key={alerta.id_insumo} className="bg-white px-3 py-1 rounded-full text-sm text-yellow-800 border border-yellow-300">
                  {alerta.nombre_insumo}: {alerta.stock_actual} {alerta.abreviatura}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Controles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar insumo..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                >
                  <option value="">Todas</option>
                  {categorias.map(cat => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {puedeCrear && (
              <button
                onClick={() => {
                  resetForm();
                  setModalMode('create');
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Nuevo Insumo
              </button>
            )}
          </div>
        </div>
        
        {/* Tabla de Insumos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Prom.</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insumosFiltrados.map(insumo => (
                  <tr key={insumo.id_insumo} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{insumo.nombre_insumo}</div>
                        {insumo.descripcion && (
                          <div className="text-sm text-gray-500">{insumo.descripcion}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{insumo.nombre_categoria}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {insumo.stock_actual} {insumo.abreviatura}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {insumo.stock_minimo} {insumo.abreviatura}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      ${parseFloat(insumo.precio_promedio).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getEstadoColor(insumo.estado_stock)}`}>
                        {insumo.estado_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {puedeEditar && (
                          <button
                            onClick={() => handleEdit(insumo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {puedeEliminar && (
                          <button
                            onClick={() => handleDelete(insumo.id_insumo)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {insumosFiltrados.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron insumos
            </div>
          )}
        </div>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Nuevo Insumo' : 'Editar Insumo'}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={currentInsumo.nombre_insumo}
                    onChange={(e) => setCurrentInsumo({...currentInsumo, nombre_insumo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={currentInsumo.descripcion}
                    onChange={(e) => setCurrentInsumo({...currentInsumo, descripcion: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  <select
                    value={currentInsumo.id_categoria}
                    onChange={(e) => setCurrentInsumo({...currentInsumo, id_categoria: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre_categoria}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Medida *</label>
                  <select
                    value={currentInsumo.id_unidad}
                    onChange={(e) => setCurrentInsumo({...currentInsumo, id_unidad: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    {unidades.map(unidad => (
                      <option key={unidad.id_unidad} value={unidad.id_unidad}>
                        {unidad.nombre_unidad} ({unidad.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>
                
                {modalMode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Inicial</label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentInsumo.stock_actual}
                      onChange={(e) => setCurrentInsumo({...currentInsumo, stock_actual: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentInsumo.stock_minimo}
                    onChange={(e) => setCurrentInsumo({...currentInsumo, stock_minimo: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Promedio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentInsumo.precio_promedio}
                    onChange={(e) => setCurrentInsumo({...currentInsumo, precio_promedio: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
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
                {(puedeCrear || puedeEditar) && (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ModuloInventario };