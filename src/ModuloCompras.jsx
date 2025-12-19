import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Eye, Calendar, Filter, DollarSign, Package, Truck, CheckCircle, XCircle, Clock, Circle } from 'lucide-react';
import { usePermisos } from './App';

//const API_URL = 'http://localhost/restaurant/backend';
const API_URL = 'https://acciontic.com.mx/restaurant';

// Componente principal de Compras
const ModuloCompras = ({ token }) => {
  const [vista, setVista] = useState('lista'); // 'lista' | 'nueva' | 'detalle'
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    proveedor: '',
    estado: ''
  });
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const { tienePermiso } = usePermisos();
  
  // Validar permisos específicos
  const puedeVer = tienePermiso('compras', 'ver');
  const puedeCrear = tienePermiso('compras', 'crear');
  const puedeEditar = tienePermiso('compras', 'editar');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    try {
      const [comprasRes, proveedoresRes, insumosRes] = await Promise.all([
        fetch(`${API_URL}/compras`, { headers }),
        fetch(`${API_URL}/proveedores`, { headers }),
        fetch(`${API_URL}/insumos`, { headers })
      ]);
      
      const [comprasData, proveedoresData, insumosData] = await Promise.all([
        comprasRes.json(),
        proveedoresRes.json(),
        insumosRes.json()
      ]);
      
      if (comprasData.success) setCompras(comprasData.data);
      if (proveedoresData.success) setProveedores(proveedoresData.data);
      if (insumosData.success) setInsumos(insumosData.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  };
  
  const aplicarFiltros = async () => {
    const params = new URLSearchParams();
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros.proveedor) params.append('proveedor', filtros.proveedor);
    if (filtros.estado) params.append('estado', filtros.estado);
    
    try {
      const response = await fetch(`${API_URL}/compras?${params}`, { headers });
      const data = await response.json();
      if (data.success) setCompras(data.data);
    } catch (error) {
      console.error('Error aplicando filtros:', error);
    }
  };
  
  const verDetalle = async (id) => {
    try {
      const response = await fetch(`${API_URL}/compras/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setCompraSeleccionada(data.data);
        setVista('detalle');
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };
  
  const getEstadoBadge = (estado) => {
    const configs = {
      'recibida': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: CheckCircle },
      'pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: Clock },
      'cancelada': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: XCircle }
    };
    
    const config = configs[estado] || configs.pendiente;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        <Icon size={14} />
        {estado.toUpperCase()}
      </span>
    );
  };

  const cambiarEstado = async (id, state) => {
    if(state === 'cancelada'){
      if(!confirm("¿Seguro que deseas cancelar la compra?")){
        return;
      }
    }
    const datosEstado = {
      estado: state
    };
    console.log(1);
    try{
      const response = await fetch(`${API_URL}/compras/${id}/estado`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(datosEstado)
      });
      
      const data = await response.json();
      //console.log(data);
      if (data.success) {
        //alert('Compra registrada exitosamente');
        //await cargarDatos();
        setVista('lista');
        aplicarFiltros();
      } else {
        alert('Error al registrar la compra: ' + data.message);
      }
    }catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando compras...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {vista === 'lista' && (
        <ListaCompras
          compras={compras}
          proveedores={proveedores}
          filtros={filtros}
          setFiltros={setFiltros}
          aplicarFiltros={aplicarFiltros}
          verDetalle={verDetalle}
          setVista={setVista}
          getEstadoBadge={getEstadoBadge}
          cambiarEstado={cambiarEstado}
          puedeCrear={puedeCrear}
          puedeEditar={puedeEditar}
        />
      )}
      
      {vista === 'nueva' && (
        <NuevaCompra
          proveedores={proveedores}
          insumos={insumos}
          headers={headers}
          setVista={setVista}
          cargarDatos={cargarDatos}
          puedeCrear={puedeCrear}
        />
      )}
      
      {vista === 'detalle' && compraSeleccionada && (
        <DetalleCompra
          compra={compraSeleccionada}
          setVista={setVista}
          getEstadoBadge={getEstadoBadge}
          cambiarEstado={cambiarEstado}
          puedeEditar={puedeEditar}
        />
      )}
    </div>
  );
};

// Componente: Lista de Compras
const ListaCompras = ({ compras, proveedores, filtros, setFiltros, aplicarFiltros, verDetalle, setVista, getEstadoBadge, cambiarEstado, puedeCrear, puedeEditar }) => {
  const totalCompras = compras.reduce((sum, c) => sum + parseFloat(c.total_compra), 0);
  
  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900">{compras.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">${totalCompras.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Proveedores Activos</p>
              <p className="text-2xl font-bold text-gray-900">{proveedores.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Truck className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
            <select
              value={filtros.proveedor}
              onChange={(e) => setFiltros({...filtros, proveedor: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos</option>
              {proveedores.map(p => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre_proveedor}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="recibida">Recibida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={aplicarFiltros}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={() => {
              setFiltros({ fecha_inicio: '', fecha_fin: '', proveedor: '', estado: '' });
              aplicarFiltros();
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
      
      {/* Botón Nueva Compra */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Historial de Compras</h2>
        {puedeCrear && (
          <button
            onClick={() => setVista('nueva')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Nueva Compra
          </button>
        )}
      </div>
      
      {/* Tabla de Compras */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado por</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {compras.map(compra => (
                <tr key={compra.id_compra} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-blue-600">{compra.numero_compra}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(compra.fecha_compra).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{compra.nombre_proveedor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ${parseFloat(compra.total_compra).toFixed(2)}
                    </span>
                  </td>
                  <td 
                    className="px-6 py-4 text-center cursor-pointer"
                    onClick={() => {
                      compra.estado === 'pendiente' && cambiarEstado(compra.id_compra,'recibida')
                    }}
                    disabled={(compra.estado === 'pendiente' && puedeEditar) ? false : true}
                  >
                    {getEstadoBadge(compra.estado)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {compra.usuario}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => verDetalle(compra.id_compra)}
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
        
        {compras.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No hay compras registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente: Nueva Compra
const NuevaCompra = ({ proveedores, insumos, headers, setVista, cargarDatos, puedeCrear }) => {
  const [compra, setCompra] = useState({
    id_proveedor: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    notas: '',
    estado: 'recibida'
  });
  
  const [detalles, setDetalles] = useState([
    { id_insumo: '', cantidad: 0, precio_unitario: 0, subtotal: 0 }
  ]);
  
  const [guardando, setGuardando] = useState(false);
  
  const agregarLinea = () => {
    setDetalles([...detalles, { id_insumo: '', cantidad: 0, precio_unitario: 0, subtotal: 0 }]);
  };
  
  const eliminarLinea = (index) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((_, i) => i !== index));
    }
  };
  
  const actualizarDetalle = (index, campo, valor) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][campo] = valor;
    
    if (campo === 'cantidad' || campo === 'precio_unitario') {
      const cantidad = parseFloat(nuevosDetalles[index].cantidad) || 0;
      const precio = parseFloat(nuevosDetalles[index].precio_unitario) || 0;
      nuevosDetalles[index].subtotal = cantidad * precio;
    }
    
    setDetalles(nuevosDetalles);
  };
  
  const calcularTotal = () => {
    return detalles.reduce((sum, d) => sum + (parseFloat(d.subtotal) || 0), 0);
  };
  
  const guardarCompra = async () => {
    // Validaciones
    if (!compra.id_proveedor) {
      alert('Selecciona un proveedor');
      return;
    }
    
    const detallesValidos = detalles.filter(d => d.id_insumo && d.cantidad > 0);
    if (detallesValidos.length === 0) {
      alert('Agrega al menos un insumo a la compra');
      return;
    }
    
    setGuardando(true);
    
    const datosCompra = {
      ...compra,
      total_compra: calcularTotal(),
      detalles: detallesValidos
    };
    
    try {
      const response = await fetch(`${API_URL}/compras`, {
        method: 'POST',
        headers,
        body: JSON.stringify(datosCompra)
      });
      
      const data = await response.json();
      //console.log(data);
      if (data.success) {
        alert('Compra registrada exitosamente');
        await cargarDatos();
        setVista('lista');
      } else {
        alert('Error al registrar la compra: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar la compra');
    } finally {
      setGuardando(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Nueva Compra</h2>
          <p className="text-sm text-gray-600 mt-1">Registra una nueva compra de insumos</p>
        </div>
        <button
          onClick={() => setVista('lista')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
      
      {/* Información General */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Información General</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor *</label>
            <select
              value={compra.id_proveedor}
              onChange={(e) => setCompra({...compra, id_proveedor: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores.map(p => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre_proveedor}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Compra *</label>
            <input
              type="date"
              value={compra.fecha_compra}
              onChange={(e) => setCompra({...compra, fecha_compra: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={compra.estado}
              onChange={(e) => setCompra({...compra, estado: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="recibida">Recibida</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
          
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
            <textarea
              value={compra.notas}
              onChange={(e) => setCompra({...compra, notas: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              placeholder="Información adicional sobre la compra..."
            />
          </div>
        </div>
      </div>
      
      {/* Detalles de la Compra */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Detalles de la Compra</h3>
          <button
            onClick={agregarLinea}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            <Plus size={16} />
            Agregar Línea
          </button>
        </div>
        
        <div className="space-y-3">
          {detalles.map((detalle, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Insumo</label>
                <select
                  value={detalle.id_insumo}
                  onChange={(e) => actualizarDetalle(index, 'id_insumo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  {insumos.map(ins => (
                    <option key={ins.id_insumo} value={ins.id_insumo}>
                      {ins.nombre_insumo} ({ins.abreviatura})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={detalle.cantidad}
                  onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="0.00"
                />
              </div>
              
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio Unit.</label>
                <input
                  type="number"
                  step="0.01"
                  value={detalle.precio_unitario}
                  onChange={(e) => actualizarDetalle(index, 'precio_unitario', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="0.00"
                />
              </div>
              
              <div className="col-span-4 md:col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Subtotal</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900">
                  ${detalle.subtotal.toFixed(2)}
                </div>
              </div>
              
              <div className="col-span-12 md:col-span-1 flex items-end">
                {detalles.length > 1 && (
                  <button
                    onClick={() => eliminarLinea(index)}
                    className="w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar línea"
                  >
                    <XCircle size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="bg-blue-50 px-6 py-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total de la Compra</p>
              <p className="text-3xl font-bold text-blue-600">${calcularTotal().toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botones de Acción */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setVista('lista')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        {puedeCrear && (
          <button
            onClick={guardarCompra}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Guardar Compra
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Componente: Detalle de Compra
const DetalleCompra = ({ compra, setVista, getEstadoBadge, cambiarEstado, puedeEditar }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Detalle de Compra</h2>
          <p className="text-sm text-gray-600 mt-1">{compra.numero_compra}</p>
        </div>
        {puedeEditar && (
          <button
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={() => cambiarEstado(compra.id_compra,'cancelada')}
            title="Cancelar"
          >
            <XCircle size={18} />
          </button>
        )}
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
            <label className="text-sm font-medium text-gray-500">Proveedor</label>
            <div className="flex items-center gap-2 mt-1">
              <Truck className="text-gray-400" size={20} />
              <p className="text-gray-900 font-semibold">{compra.nombre_proveedor}</p>
            </div>
            {compra.telefono && (
              <p className="text-sm text-gray-600 mt-1 ml-7">Tel: {compra.telefono}</p>
            )}
            {compra.email && (
              <p className="text-sm text-gray-600 ml-7">{compra.email}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Fecha de Compra</label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="text-gray-400" size={20} />
              <p className="text-gray-900 font-semibold">
                {new Date(compra.fecha_compra).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Estado</label>
            <div className="mt-1">
              {getEstadoBadge(compra.estado)}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Registrado por</label>
            <p className="text-gray-900 font-semibold mt-1">{compra.usuario}</p>
          </div>
          
          {compra.notas && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Notas</label>
              <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{compra.notas}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Detalles de la Compra */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Productos Comprados</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insumo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {compra.detalles && compra.detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detalle.nombre_insumo}</p>
                        <p className="text-xs text-gray-500">{detalle.abreviatura}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {parseFloat(detalle.cantidad).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    ${parseFloat(detalle.precio_unitario).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    ${parseFloat(detalle.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan="3" className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                  TOTAL
                </td>
                <td className="px-4 py-4 text-right text-lg font-bold text-blue-600">
                  ${parseFloat(compra.total_compra).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Información de Registro */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Fecha de Registro:</span>{' '}
            {new Date(compra.fecha_registro).toLocaleString('es-MX')}
          </div>
        </div>
      </div>
    </div>
  );
};

export { ModuloCompras };