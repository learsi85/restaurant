import React, { useState, useEffect } from 'react';
import { Factory, Plus, Eye, Calendar, TrendingUp, DollarSign, Package, AlertCircle, CheckCircle, ChefHat, AlertTriangle } from 'lucide-react';
import { usePermisos } from './App';

//const API_URL = 'http://localhost/restaurant/backend';
const API_URL = 'https://acciontic.com.mx/restaurant';

// Componente Principal - Módulo de Producción
const ModuloProduccion = ({ token, user }) => {
  const [vista, setVista] = useState('lista');
  const [producciones, setProducciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [produccionSeleccionada, setProduccionSeleccionada] = useState(null);
  const { tienePermiso } = usePermisos();
      
  // Validar permisos específicos
  const puedeVer = tienePermiso('produccion', 'ver');
  const puedeCrear = tienePermiso('produccion', 'crear');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    try {
      const [produccionesRes, productosRes] = await Promise.all([
        fetch(`${API_URL}/produccion`, { headers }),
        fetch(`${API_URL}/productos`, { headers })
      ]);
      
      const [produccionesData, productosData] = await Promise.all([
        produccionesRes.json(),
        productosRes.json()
      ]);
      
      if (produccionesData.success) setProducciones(produccionesData.data);
      if (productosData.success) setProductos(productosData.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  const verDetalle = async (id) => {
    try {
      const response = await fetch(`${API_URL}/produccion/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setProduccionSeleccionada(data.data);
        setVista('detalle');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 4000);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producción...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {mensaje && (
        <div className={`mb-6 flex items-center gap-2 p-4 rounded-lg ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{mensaje.texto}</span>
        </div>
      )}
      
      {vista === 'lista' && (
        <ListaProduccion
          producciones={producciones}
          productos={productos}
          verDetalle={verDetalle}
          setVista={setVista}
          puedeCrear={puedeCrear}
        />
      )}
      
      {vista === 'nueva' && (
        <NuevaProduccion
          productos={productos}
          headers={headers}
          setVista={setVista}
          cargarDatos={cargarDatos}
          mostrarMensaje={mostrarMensaje}
        />
      )}
      
      {vista === 'detalle' && produccionSeleccionada && (
        <DetalleProduccion
          produccion={produccionSeleccionada}
          setVista={setVista}
        />
      )}
    </div>
  );
};

// Componente: Lista de Producción
const ListaProduccion = ({ producciones, productos, verDetalle, setVista, puedeCrear }) => {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  
  const produccionesFiltradas = producciones.filter(p => {
    const matchTipo = !filtroTipo || p.tipo_producto === filtroTipo;
    const matchFechaInicio = !filtroFechaInicio || new Date(p.fecha_produccion) >= new Date(filtroFechaInicio);
    const matchFechaFin = !filtroFechaFin || new Date(p.fecha_produccion) <= new Date(filtroFechaFin);
    return matchTipo && matchFechaInicio && matchFechaFin;
  });
  
  const totalUnidades = produccionesFiltradas.reduce((sum, p) => sum + parseInt(p.cantidad_producida), 0);
  const totalCosto = produccionesFiltradas.reduce((sum, p) => sum + parseFloat(p.costo_produccion || 0), 0);
  const totalValor = produccionesFiltradas.reduce((sum, p) => sum + (parseFloat(p.precio_venta) * parseInt(p.cantidad_producida)), 0);
  const margenEstimado = totalValor - totalCosto;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-green-500 p-3 rounded-lg">
          <Factory className="text-white" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Producción</h1>
          <p className="text-sm text-gray-600">Registra los productos que preparas cada día</p>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Producciones</p>
              <p className="text-2xl font-bold text-gray-900">{produccionesFiltradas.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Factory className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unidades Producidas</p>
              <p className="text-2xl font-bold text-gray-900">{totalUnidades}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-2xl font-bold text-gray-900">${totalCosto.toFixed(2)}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <DollarSign className="text-red-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Margen Estimado</p>
              <p className="text-2xl font-bold text-green-600">${margenEstimado.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Producto</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos</option>
              <option value="pollo">Pollos</option>
              <option value="guarnicion">Guarniciones</option>
              <option value="combo">Combos</option>
            </select>
          </div>
          
          <div className="flex items-end">
            {puedeCrear && (
              <button
                onClick={() => setVista('nueva')}
                className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Nueva Producción
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado por</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {produccionesFiltradas.map(prod => (
                <tr key={prod.id_produccion} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(prod.fecha_produccion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ChefHat className="text-green-500" size={18} />
                      <div>
                        <div className="font-medium text-gray-900">{prod.nombre_producto}</div>
                        <div className="text-xs text-gray-500 capitalize">{prod.tipo_producto}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">{prod.cantidad_producida}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-red-600">${parseFloat(prod.costo_produccion || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-green-600">
                      ${(parseFloat(prod.precio_venta) * parseInt(prod.cantidad_producida)).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{prod.usuario}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => verDetalle(prod.id_produccion)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {produccionesFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Factory size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay producciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente: Nueva Producción
const NuevaProduccion = ({ productos, headers, setVista, cargarDatos, mostrarMensaje }) => {
  const [produccion, setProduccion] = useState({
    id_producto: '',
    cantidad_producida: 1,
    fecha_produccion: new Date().toISOString().slice(0, 16),
    notas: ''
  });
  
  const [verificacion, setVerificacion] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  const verificarDisponibilidad = async () => {
    if (!produccion.id_producto || produccion.cantidad_producida <= 0) {
      mostrarMensaje('Selecciona un producto y cantidad válida', 'error');
      return;
    }
    
    setVerificando(true);
    
    try {
      const response = await fetch(`${API_URL}/produccion/a/verificar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id_producto: produccion.id_producto,
          cantidad: produccion.cantidad_producida
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVerificacion(data.data);
        
        if (!data.data.puede_producir) {
          mostrarMensaje('No hay suficientes insumos para producir', 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al verificar disponibilidad', 'error');
    } finally {
      setVerificando(false);
    }
  };
  
  const handleProductoChange = (id_producto) => {
    const producto = productos.find(p => p.id_producto == id_producto);
    setProductoSeleccionado(producto);
    setProduccion({...produccion, id_producto});
    setVerificacion(null);
  };
  
  const handleCantidadChange = (cantidad) => {
    setProduccion({...produccion, cantidad_producida: cantidad});
    setVerificacion(null);
  };
  
  const guardarProduccion = async () => {
    if (!verificacion || !verificacion.puede_producir) {
      mostrarMensaje('Primero verifica la disponibilidad de insumos', 'error');
      return;
    }
    
    setGuardando(true);
    
    try {
      const response = await fetch(`${API_URL}/produccion`, {
        method: 'POST',
        headers,
        body: JSON.stringify(produccion)
      });
      
      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('Producción registrada exitosamente', 'success');
        await cargarDatos();
        setVista('lista');
      } else {
        mostrarMensaje(data.message || 'Error al registrar producción', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al registrar producción', 'error');
    } finally {
      setGuardando(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Nueva Producción</h2>
          <p className="text-sm text-gray-600 mt-1">Registra los productos que preparaste</p>
        </div>
        <button
          onClick={() => setVista('lista')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
      
      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Información de la Producción</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Producto a Producir *</label>
            <select
              value={produccion.id_producto}
              onChange={(e) => handleProductoChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre_producto} - ${parseFloat(p.precio_venta).toFixed(2)} ({p.tipo_producto})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad a Producir *</label>
            <input
              type="number"
              min="1"
              value={produccion.cantidad_producida}
              onChange={(e) => handleCantidadChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={produccion.fecha_produccion}
              onChange={(e) => setProduccion({...produccion, fecha_produccion: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={produccion.notas}
              onChange={(e) => setProduccion({...produccion, notas: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="2"
              placeholder="Información adicional..."
            />
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={verificarDisponibilidad}
            disabled={!produccion.id_producto || produccion.cantidad_producida <= 0 || verificando}
            className="w-full md:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verificando ? 'Verificando...' : 'Verificar Disponibilidad de Insumos'}
          </button>
        </div>
      </div>
      
      {/* Resultado de Verificación */}
      {verificacion && (
        <div className={`rounded-lg border-2 p-6 ${
          verificacion.puede_producir ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-start gap-3">
            {verificacion.puede_producir ? (
              <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
            ) : (
              <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
            )}
            
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${
                verificacion.puede_producir ? 'text-green-800' : 'text-red-800'
              }`}>
                {verificacion.puede_producir 
                  ? '✅ Puedes producir esta cantidad' 
                  : '❌ No hay suficientes insumos'}
              </h4>
              
              {verificacion.puede_producir && (
                <div className="space-y-2">
                  <p className="text-sm text-green-700">
                    <strong>Costo estimado de producción:</strong> ${verificacion.costo_estimado.toFixed(2)}
                  </p>
                  {productoSeleccionado && (
                    <>
                      <p className="text-sm text-green-700">
                        <strong>Valor de venta total:</strong> ${(parseFloat(productoSeleccionado.precio_venta) * parseInt(produccion.cantidad_producida)).toFixed(2)}
                      </p>
                      <p className="text-sm text-green-700">
                        <strong>Margen estimado:</strong> ${((parseFloat(productoSeleccionado.precio_venta) * parseInt(produccion.cantidad_producida)) - verificacion.costo_estimado).toFixed(2)}
                      </p>
                    </>
                  )}
                </div>
              )}
              
              {!verificacion.puede_producir && verificacion.faltantes && (
                <div className="mt-3">
                  <p className="text-sm text-red-700 font-medium mb-2">Insumos faltantes:</p>
                  <div className="space-y-1">
                    {verificacion.faltantes.map((f, i) => (
                      <div key={i} className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded">
                        <strong>{f.insumo}:</strong> Necesitas {f.necesario.toFixed(2)} {f.unidad}, 
                        solo tienes {f.disponible.toFixed(2)} {f.unidad}. 
                        Faltan <strong>{f.faltante.toFixed(2)} {f.unidad}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Botones de Acción */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setVista('lista')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={guardarProduccion}
          disabled={!verificacion || !verificacion.puede_producir || guardando}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Registrar Producción
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Componente: Detalle de Producción
const DetalleProduccion = ({ produccion, setVista }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Detalle de Producción</h2>
          <p className="text-sm text-gray-600 mt-1">Producción #{produccion.id_produccion}</p>
        </div>
        <button
          onClick={() => setVista('lista')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Volver al Listado
        </button>
      </div>
      
      {/* Información General */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Información General</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Producto</label>
            <p className="text-gray-900 font-semibold mt-1">{produccion.nombre_producto}</p>
            <p className="text-sm text-gray-500 capitalize">{produccion.tipo_producto}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Fecha de Producción</label>
            <p className="text-gray-900 font-semibold mt-1">
              {new Date(produccion.fecha_produccion).toLocaleString('es-MX')}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Cantidad Producida</label>
            <p className="text-2xl font-bold text-green-600 mt-1">{produccion.cantidad_producida}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Registrado por</label>
            <p className="text-gray-900 font-semibold mt-1">{produccion.usuario}</p>
          </div>
          
          {produccion.notas && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Notas</label>
              <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{produccion.notas}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Costos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Costo de Producción</p>
          <p className="text-2xl font-bold text-red-600">${parseFloat(produccion.costo_produccion).toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Valor de Venta</p>
          <p className="text-2xl font-bold text-green-600">
            ${(parseFloat(produccion.precio_venta) * parseInt(produccion.cantidad_producida)).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Margen de Ganancia</p>
          <p className="text-2xl font-bold text-blue-600">
            ${((parseFloat(produccion.precio_venta) * parseInt(produccion.cantidad_producida)) - parseFloat(produccion.costo_produccion)).toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Insumos Utilizados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Insumos Utilizados</h3>
        
        {produccion.insumos_usados && produccion.insumos_usados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Usada</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Promedio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produccion.insumos_usados.map((insumo, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{insumo.nombre_insumo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {parseFloat(insumo.cantidad_usada).toFixed(2)} {insumo.abreviatura}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      ${parseFloat(insumo.precio_promedio).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      ${parseFloat(insumo.costo_insumo).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    TOTAL
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-bold text-red-600">
                    ${parseFloat(produccion.costo_produccion).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay información de insumos para esta producción</p>
          </div>
        )}
      </div>
      
      {/* Información de Registro */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Registrado el:</span>{' '}
            {new Date(produccion.fecha_registro).toLocaleString('es-MX')}
          </div>
        </div>
      </div>
    </div>
  );
};

export { ModuloProduccion };