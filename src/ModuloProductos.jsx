import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, ChefHat, DollarSign, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { usePermisos } from './App';

//const API_URL = 'http://localhost/restaurant/backend';
const API_URL = 'https://acciontic.com.mx/restaurant';

// Componente Principal - Módulo de Productos
const ModuloProductos = ({ token }) => {
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [currentProducto, setCurrentProducto] = useState({
    nombre_producto: '',
    descripcion: '',
    tipo_producto: 'pollo',
    precio_venta: 0,
    stock_actual: 0,
    receta: []
  });
  const { tienePermiso } = usePermisos();
    
  // Validar permisos específicos
  const puedeVer = tienePermiso('productos', 'ver');
  const puedeCrear = tienePermiso('productos', 'crear');
  const puedeEditar = tienePermiso('productos', 'editar');
  const puedeEliminar = tienePermiso('productos', 'eliminar');    
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    try {
      const [productosRes, insumosRes] = await Promise.all([
        fetch(`${API_URL}/productos`, { headers }),
        fetch(`${API_URL}/insumos`, { headers })
      ]);
      
      const [productosData, insumosData] = await Promise.all([
        productosRes.json(),
        insumosRes.json()
      ]);
      
      if (productosData.success) setProductos(productosData.data);
      if (insumosData.success) setInsumos(insumosData.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!currentProducto.nombre_producto.trim()) {
      mostrarMensaje('El nombre del producto es obligatorio', 'error');
      return;
    }
    
    if (currentProducto.precio_venta <= 0) {
      mostrarMensaje('El precio de venta debe ser mayor a 0', 'error');
      return;
    }
    
    const url = modalMode === 'create' 
      ? `${API_URL}/productos`
      : `${API_URL}/productos/${currentProducto.id_producto}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentProducto)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        cargarDatos();
        resetForm();
        mostrarMensaje(
          modalMode === 'create' ? 'Producto creado exitosamente' : 'Producto actualizado exitosamente',
          'success'
        );
      } else {
        mostrarMensaje(data.message || 'Error al guardar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al guardar el producto', 'error');
    }
  };
  
  const handleEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}/productos/${id}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        setCurrentProducto(data.data);
        setModalMode('edit');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al cargar el producto', 'error');
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const response = await fetch(`${API_URL}/productos/${id}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        cargarDatos();
        mostrarMensaje('Producto eliminado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar el producto', 'error');
    }
  };
  
  const resetForm = () => {
    setCurrentProducto({
      nombre_producto: '',
      descripcion: '',
      tipo_producto: 'pollo',
      precio_venta: 0,
      stock_actual: 0,
      receta: []
    });
  };
  
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 4000);
  };
  
  const productosFiltrados = productos.filter(p => {
    const matchSearch = p.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filtroTipo || p.tipo_producto === filtroTipo;
    return matchSearch && matchTipo;
  });
  
  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'pollo': return <ChefHat className="text-orange-500" size={20} />;
      case 'guarnicion': return <Package className="text-green-500" size={20} />;
      case 'combo': return <FileText className="text-purple-500" size={20} />;
      default: return <Package className="text-gray-500" size={20} />;
    }
  };
  
  const getTipoLabel = (tipo) => {
    const labels = {
      'pollo': 'Pollo',
      'guarnicion': 'Guarnición',
      'combo': 'Combo'
    };
    return labels[tipo] || tipo;
  };
  
  const getTipoBadge = (tipo) => {
    const configs = {
      'pollo': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
      'guarnicion': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      'combo': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' }
    };
    
    const config = configs[tipo] || configs.pollo;
    
    return (
      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        {getTipoLabel(tipo)}
      </span>
    );
  };
  
  // Estadísticas
  const totalProductos = productos.length;
  const productosPollos = productos.filter(p => p.tipo_producto === 'pollo').length;
  const productosGuarniciones = productos.filter(p => p.tipo_producto === 'guarnicion').length;
  const valorInventario = productos.reduce((sum, p) => sum + (parseFloat(p.precio_venta) * parseInt(p.stock_actual)), 0);
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-500 p-3 rounded-lg">
          <ChefHat className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos Terminados</h1>
          <p className="text-sm text-gray-600">Gestiona tus productos y sus recetas</p>
        </div>
      </div>
      
      {/* Mensaje */}
      {mensaje && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pollos</p>
              <p className="text-2xl font-bold text-gray-900">{productosPollos}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <ChefHat className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Guarniciones</p>
              <p className="text-2xl font-bold text-gray-900">{productosGuarniciones}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900">${valorInventario.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos</option>
              <option value="pollo">Pollos</option>
              <option value="guarnicion">Guarniciones</option>
              <option value="combo">Combos</option>
            </select>
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
              Nuevo Producto
            </button>
          )}
        </div>
      </div>
      
      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Receta</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productosFiltrados.map(producto => (
                <tr key={producto.id_producto} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getTipoIcon(producto.tipo_producto)}
                      <div>
                        <div className="font-medium text-gray-900">{producto.nombre_producto}</div>
                        {producto.descripcion && (
                          <div className="text-sm text-gray-500">{producto.descripcion}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getTipoBadge(producto.tipo_producto)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ${parseFloat(producto.precio_venta).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-semibold ${
                      producto.stock_actual > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {producto.stock_actual}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-500">
                      {producto.receta > 0 ? `${producto.receta} insumos` : 'Sin receta'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {puedeEditar && (
                        <button
                          onClick={() => handleEdit(producto.id_producto)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {puedeEliminar && (
                        <button
                          onClick={() => handleDelete(producto.id_producto)}
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
        
        {productosFiltrados.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ChefHat size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay productos registrados</p>
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <ModalProducto
          mode={modalMode}
          producto={currentProducto}
          setProducto={setCurrentProducto}
          insumos={insumos}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          onSubmit={handleSubmit}
          puedeCrear={puedeCrear}
          puedeEditar={puedeEditar}
        />
      )}
    </div>
  );
};

// Componente Modal de Producto
const ModalProducto = ({ mode, producto, setProducto, insumos, onClose, onSubmit, puedeCrear, puedeEditar }) => {
  const agregarInsumo = () => {
    const nuevaReceta = [...(producto.receta || []), { id_insumo: '', cantidad_necesaria: 0 }];
    setProducto({...producto, receta: nuevaReceta});
  };
  
  const eliminarInsumo = (index) => {
    const nuevaReceta = producto.receta.filter((_, i) => i !== index);
    setProducto({...producto, receta: nuevaReceta});
  };
  
  const actualizarInsumo = (index, campo, valor) => {
    const nuevaReceta = [...producto.receta];
    nuevaReceta[index][campo] = valor;
    setProducto({...producto, receta: nuevaReceta});
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
          </h2>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Información Básica */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Información del Producto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                <input
                  type="text"
                  value={producto.nombre_producto}
                  onChange={(e) => setProducto({...producto, nombre_producto: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Pollo Entero Asado"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={producto.descripcion}
                  onChange={(e) => setProducto({...producto, descripcion: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="2"
                  placeholder="Descripción del producto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Producto *</label>
                <select
                  value={producto.tipo_producto}
                  onChange={(e) => setProducto({...producto, tipo_producto: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                >
                  <option value="pollo">Pollo</option>
                  <option value="guarnicion">Guarnición</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio de Venta *</label>
                <input
                  type="number"
                  step="0.01"
                  value={producto.precio_venta}
                  onChange={(e) => setProducto({...producto, precio_venta: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              {mode === 'create' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Inicial</label>
                  <input
                    type="number"
                    value={producto.stock_actual}
                    onChange={(e) => setProducto({...producto, stock_actual: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Receta */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Receta del Producto</h3>
              <button
                onClick={agregarInsumo}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                <Plus size={16} />
                Agregar Insumo
              </button>
            </div>
            
            {(!producto.receta || producto.receta.length === 0) ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Package className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 text-sm">No hay insumos en la receta</p>
                <p className="text-gray-400 text-xs mt-1">Agrega los insumos necesarios para preparar este producto</p>
              </div>
            ) : (
              <div className="space-y-2">
                {producto.receta.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-12 md:col-span-7">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Insumo</label>
                      <select
                        value={item.id_insumo}
                        onChange={(e) => actualizarInsumo(index, 'id_insumo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm appearance-none"
                      >
                        <option value="">Seleccionar...</option>
                        {insumos.map(ins => (
                          <option key={ins.id_insumo} value={ins.id_insumo}>
                            {ins.nombre_insumo} (Stock: {ins.stock_actual} {ins.abreviatura})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-10 md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad Necesaria</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.cantidad_necesaria}
                        onChange={(e) => actualizarInsumo(index, 'cantidad_necesaria', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <button
                        onClick={() => eliminarInsumo(index)}
                        className="w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          {(puedeCrear || puedeEditar) && (
            <button
              onClick={onSubmit}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              {mode === 'create' ? 'Crear Producto' : 'Actualizar Producto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { ModuloProductos };