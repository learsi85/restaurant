import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, DollarSign, CreditCard, Smartphone, User, Receipt, Eye, CheckCircle, X, AlertCircle } from 'lucide-react';
import { usePermisos } from './App';

//const API_URL = 'http://localhost/restaurant/backend';
const API_URL = 'https://acciontic.com.mx/restaurant';

// Componente Principal - Módulo de Ventas
const ModuloVentas = ({ token, user }) => {
  const [vista, setVista] = useState('pos');
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const { tienePermiso } = usePermisos();
      
  // Validar permisos específicos
  const puedeVer = tienePermiso('ventas', 'ver');
  const puedeCrear = tienePermiso('ventas', 'crear');
  if(!puedeCrear) setVista('historial');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  const cargarVentas = async () => {
    try {
      const response = await fetch(`${API_URL}/ventas`, { headers });
      const data = await response.json();
      if (data.success) setVentas(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const verDetalle = async (id) => {
    try {
      const response = await fetch(`${API_URL}/ventas/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setVentaSeleccionada(data.data);
        setVista('detalle');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Navegación mejorada para móvil */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
        {puedeCrear && (
          <button
            onClick={() => setVista('pos')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
              vista === 'pos' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag size={20} />
            <span className="text-sm sm:text-base">Punto de Venta</span>
          </button>
        )}
        <button
          onClick={() => {
            setVista('historial');
            cargarVentas();
          }}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium ${
            vista === 'historial' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Receipt size={20} />
          <span className="text-sm sm:text-base">Historial</span>
        </button>
      </div>
      
      {vista === 'pos' && <PuntoDeVenta headers={headers} user={user} puedeCrear={puedeCrear} />}
      {vista === 'historial' && <HistorialVentas ventas={ventas} verDetalle={verDetalle} />}
      {vista === 'detalle' && ventaSeleccionada && (
        <DetalleVenta venta={ventaSeleccionada} setVista={setVista} />
      )}
    </div>
  );
};

// Componente: Punto de Venta
const PuntoDeVenta = ({ headers, user, puedeCrear }) => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // NUEVO: Sistema de pagos múltiples
  const [pagosMixtos, setPagosMixtos] = useState(false);
  const [metodosPago, setMetodosPago] = useState([
    { metodo: 'efectivo', monto: 0, referencia: '' }
  ]);
  
  const [descuento, setDescuento] = useState(0);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  // NUEVO: Validar montos de pagos mixtos
  const validarMontosPago = () => {
    const totalPagado = metodosPago.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0);
    const totalVenta = calcularTotal();
    return { totalPagado, diferencia: totalPagado - totalVenta };
  };

  // NUEVO: Agregar método de pago
  const agregarMetodoPago = () => {
    setMetodosPago([...metodosPago, { metodo: 'efectivo', monto: 0, referencia: '' }]);
  };

  // NUEVO: Eliminar método de pago
  const eliminarMetodoPago = (index) => {
    if (metodosPago.length > 1) {
      setMetodosPago(metodosPago.filter((_, i) => i !== index));
    }
  };

  // NUEVO: Actualizar método de pago
  const actualizarMetodoPago = (index, campo, valor) => {
    const nuevosMetodos = [...metodosPago];
    nuevosMetodos[index][campo] = valor;
    setMetodosPago(nuevosMetodos);
  };

  // NUEVO: Calcular cambio (solo para efectivo)
  const calcularCambio = () => {
    const { totalPagado, diferencia } = validarMontosPago();
    return diferencia > 0 ? diferencia : 0;
  };

  // Resto del código existente...
  const cargarProductos = async () => {
    try {
      const response = await fetch(`${API_URL}/productos`, { headers });
      const data = await response.json();
      if (data.success) {
        setProductos(data.data.filter(p => p.stock_actual > 0));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id_producto === producto.id_producto);
    
    if (existe) {
      if (existe.cantidad < producto.stock_actual) {
        setCarrito(carrito.map(item =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ));
      } else {
        mostrarMensaje(`Stock máximo: ${producto.stock_actual}`, 'error');
      }
    } else {
      setCarrito([...carrito, {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        precio_unitario: parseFloat(producto.precio_venta),
        cantidad: 1,
        stock_disponible: producto.stock_actual
      }]);
    }
  };
  
  const modificarCantidad = (id_producto, cantidad) => {
    const item = carrito.find(i => i.id_producto === id_producto);
    
    if (cantidad <= 0) {
      eliminarDelCarrito(id_producto);
      return;
    }
    
    if (cantidad > item.stock_disponible) {
      mostrarMensaje(`Stock máximo: ${item.stock_disponible}`, 'error');
      return;
    }
    
    setCarrito(carrito.map(i =>
      i.id_producto === id_producto ? { ...i, cantidad } : i
    ));
  };
  
  const eliminarDelCarrito = (id_producto) => {
    setCarrito(carrito.filter(item => item.id_producto !== id_producto));
  };
  
  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  };
  
  const calcularTotal = () => {
    return calcularSubtotal() - descuento;
  };
  
  // MODIFICADO: Procesar venta con pagos múltiples
  const procesarVenta = async () => {
    if (carrito.length === 0) {
      mostrarMensaje('Agrega productos al carrito', 'error');
      return;
    }

    // Validar pagos
    const { totalPagado, diferencia } = validarMontosPago();
    const totalVenta = calcularTotal();

    if (totalPagado < totalVenta) {
      mostrarMensaje(`Faltan $${(totalVenta - totalPagado).toFixed(2)} por pagar`, 'error');
      return;
    } 
    
    setProcesando(true);
    
    const venta = {
      productos: carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.precio_unitario * item.cantidad
      })),
      subtotal: calcularSubtotal(),
      descuento: descuento,
      total_venta: totalVenta,
      //metodo_pago: pagosMixtos ? 'mixto' : metodosPago[0].metodo,
      // NUEVO: Información de pagos múltiples
      //pagos_mixtos: pagosMixtos,
      metodos_pago: metodosPago.map(item => ({
        metodo: item.metodo,
        monto: item.monto,
        numero_autorizacion: item.referencia
      }))
    };
    console.log(metodosPago);
    try {
      const response = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(venta)
      });
      
      const data = await response.json();
      console.log(data);
      
      if (data.success) {
        setVentaCompletada({
          ...venta,
          numero_venta: data.data.numero_venta,
          fecha_venta: new Date().toISOString(),
          usuario: user.nombre_completo,
          cambio: calcularCambio()
        });
        setMostrarTicket(true);
        limpiarVenta();
        cargarProductos();
        mostrarMensaje('Venta registrada exitosamente', 'success');
      } else {
        mostrarMensaje(data.message || 'Error al procesar venta', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al procesar venta', 'error');
    } finally {
      setProcesando(false);
    }
  };
  
  const limpiarVenta = () => {
    setCarrito([]);
    setDescuento(0);
    setPagosMixtos(false);
    setMetodosPago([{ metodo: 'efectivo', monto: 0, referencia: '' }]);
  };
  
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };
  
  const productosFiltrados = productos.filter(p =>
    p.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
        <div className="bg-blue-600 p-3 rounded-lg">
          <ShoppingBag className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Punto de Venta</h1>
          <p className="text-xs sm:text-sm text-gray-600">Registra ventas rápidamente</p>
        </div>
      </div>
      
      {/* Mensajes */}
      {mensaje && (
        <div className={`flex items-center gap-2 p-4 rounded-lg shadow-sm ${
          mensaje.tipo === 'success' 
            ? 'bg-green-100 text-green-900 border-2 border-green-300' 
            : 'bg-red-100 text-red-900 border-2 border-red-300'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium text-sm sm:text-base">{mensaje.texto}</span>
        </div>
      )}
      
      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sección de productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar producto..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>
          
          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {productosFiltrados.map(producto => (
              <button
                key={producto.id_producto}
                onClick={() => agregarAlCarrito(producto)}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-500 p-4 text-left transition-all hover:shadow-md active:scale-95"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                    {producto.nombre_producto}
                  </h3>
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2 flex-shrink-0">
                    {producto.stock_actual}
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  ${parseFloat(producto.precio_venta).toFixed(2)}
                </p>
              </button>
            ))}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-8 text-center">
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </div>
        
        {/* Panel del carrito */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {/* Carrito */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-base sm:text-lg">
              🛒 Carrito ({carrito.length})
            </h3>
            
            {carrito.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag size={48} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">Carrito vacío</p>
                <p className="text-xs mt-1">Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {carrito.map(item => (
                  <div key={item.id_producto} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 line-clamp-2">
                        {item.nombre_producto}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        ${item.precio_unitario.toFixed(2)} c/u
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-300 p-1">
                      <button
                        onClick={() => modificarCantidad(item.id_producto, item.cantidad - 1)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-700"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => modificarCantidad(item.id_producto, item.cantidad + 1)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-700"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    
                    <div className="text-right min-w-[60px]">
                      <p className="font-bold text-sm text-gray-900">
                        ${(item.precio_unitario * item.cantidad).toFixed(2)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => eliminarDelCarrito(item.id_producto)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Panel de pago NUEVO */}
          <PanelPago
            descuento={descuento}
            setDescuento={setDescuento}
            calcularSubtotal={calcularSubtotal}
            calcularTotal={calcularTotal}
            pagosMixtos={pagosMixtos}
            metodosPago={metodosPago}
            agregarMetodoPago={agregarMetodoPago}
            eliminarMetodoPago={eliminarMetodoPago}
            actualizarMetodoPago={actualizarMetodoPago}
            validarMontosPago={validarMontosPago}
            calcularCambio={calcularCambio}
            procesarVenta={procesarVenta}
            limpiarVenta={limpiarVenta}
            carrito={carrito}
            procesando={procesando}
            puedeCrear={puedeCrear}
          />
        </div>
      </div>
      
      {mostrarTicket && ventaCompletada && (
        <ModalTicket
          venta={ventaCompletada}
          onClose={() => {
            setMostrarTicket(false);
            setVentaCompletada(null);
          }}
        />
      )}
    </div>
  );
};

// NUEVO COMPONENTE: Panel de Pago con Múltiples Métodos
const PanelPago = ({
  descuento,
  setDescuento,
  calcularSubtotal,
  calcularTotal,
  pagosMixtos,
  metodosPago,
  agregarMetodoPago,
  eliminarMetodoPago,
  actualizarMetodoPago,
  validarMontosPago,
  calcularCambio,
  procesarVenta,
  limpiarVenta,
  carrito,
  procesando,
  puedeCrear
}) => {
  const { totalPagado, diferencia } = validarMontosPago();
  const totalVenta = calcularTotal();
  const faltante = totalVenta - totalPagado;

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 space-y-4">
      {/* Descuento */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          💰 Descuento
        </label>
        <input
          type="number"
          value={descuento}
          onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </div>

      {/* Totales */}
      <div className="pt-4 border-t-2 border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Subtotal:</span>
          <span className="font-bold text-gray-900">${calcularSubtotal().toFixed(2)}</span>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-sm">
            <span className="font-medium text-red-700">Descuento:</span>
            <span className="font-bold text-red-700">-${descuento.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg sm:text-xl font-bold pt-2 border-t-2 border-gray-300">
          <span className="text-gray-900">TOTAL:</span>
          <span className="text-blue-600">${totalVenta.toFixed(2)}</span>
        </div>
      </div>

      {/* Métodos de Pago */}
      <div className="space-y-3">
        {metodosPago.map((pago, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">
                Método {pagosMixtos ? index + 1 : ''}
              </span>
              {pagosMixtos && metodosPago.length > 1 && (
                <button
                  onClick={() => eliminarMetodoPago(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Selector de Método */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => actualizarMetodoPago(index, 'metodo', 'efectivo')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  pago.metodo === 'efectivo' 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <DollarSign size={20} className={pago.metodo === 'efectivo' ? 'text-blue-600' : 'text-gray-600'} />
                <span className={`text-xs font-medium ${pago.metodo === 'efectivo' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Efectivo
                </span>
              </button>
              <button
                onClick={() => actualizarMetodoPago(index, 'metodo', 'tarjeta')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  pago.metodo === 'tarjeta' 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <CreditCard size={20} className={pago.metodo === 'tarjeta' ? 'text-blue-600' : 'text-gray-600'} />
                <span className={`text-xs font-medium ${pago.metodo === 'tarjeta' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Tarjeta
                </span>
              </button>
              <button
                onClick={() => actualizarMetodoPago(index, 'metodo', 'transferencia')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  pago.metodo === 'transferencia' 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <Smartphone size={20} className={pago.metodo === 'transferencia' ? 'text-blue-600' : 'text-gray-600'} />
                <span className={`text-xs font-medium ${pago.metodo === 'transferencia' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Transfer.
                </span>
              </button>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto {pago.metodo === 'efectivo' ? 'recibido' : 'a pagar'}
              </label>
              <input
                type="number"
                value={pago.monto}
                onChange={(e) => actualizarMetodoPago(index, 'monto', e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Referencia (para tarjeta y transferencia) */}
            {(pago.metodo === 'tarjeta' || pago.metodo === 'transferencia') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia / No. de autorización
                </label>
                <input
                  type="text"
                  value={pago.referencia}
                  onChange={(e) => actualizarMetodoPago(index, 'referencia', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ingresa referencia..."
                />
              </div>
            )}
          </div>
        ))}

        {/* Botón agregar método */}
        <button
          onClick={agregarMetodoPago}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-700 font-medium"
        >
         <Plus size={20} />
         Agregar método de pago
        </button>
        
      </div>

      {/* Resumen de pagos mixtos */}
      
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Total a pagar:</span>
            <span className="font-bold text-gray-900">${totalVenta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Total pagado:</span>
            <span className={`font-bold ${totalPagado >= totalVenta ? 'text-green-600' : 'text-orange-600'}`}>
              ${totalPagado.toFixed(2)}
            </span>
          </div>
          {faltante > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-blue-300">
              <span className="font-medium text-red-700">Faltante:</span>
              <span className="font-bold text-red-700">${faltante.toFixed(2)}</span>
            </div>
          )}
          {diferencia > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-blue-300">
              <span className="font-medium text-green-700">Cambio:</span>
              <span className="font-bold text-green-700">${diferencia.toFixed(2)}</span>
            </div>
          )}
        </div>

      {/* Cambio para pago único en efectivo */}
      {!pagosMixtos && metodosPago[0].metodo === 'efectivo' && calcularCambio() > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-green-900">Cambio:</span>
            <span className="text-lg font-bold text-green-700">
              ${calcularCambio().toFixed(2)}
            </span>
          </div>
        </div>
      )}
     
      {/* Botones de acción */}
      {puedeCrear && (
        <button
          onClick={procesarVenta}
          disabled={carrito.length === 0 || procesando}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-md"
        >
          {procesando ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Procesar Venta
            </>
          )}
        </button>
      )}
      {carrito.length > 0 && (
        <button
          onClick={limpiarVenta}
          className="w-full px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  );
};

// Modal Ticket mejorado para móvil
// Modal Ticket ACTUALIZADO para pagos múltiples
const ModalTicket = ({ venta, onClose }) => {
  const esPagoMixto = venta.metodos_pago.length > 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b-2 border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">✅ Venta Completada</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white rounded-lg text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-900">{venta.numero_venta}</p>
            <p className="text-sm text-green-700 font-medium mt-1">Venta registrada exitosamente</p>
          </div>
          
          <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Cajero:</span>
              <span className="font-bold text-gray-900">{venta.usuario}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Fecha:</span>
              <span className="font-bold text-gray-900">
                {new Date(venta.fecha_venta).toLocaleString('es-MX')}
              </span>
            </div>
          </div>

          {/* Detalle de pagos múltiples */}
          {esPagoMixto && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-bold text-gray-900 text-sm mb-3">💳 Detalle de Pagos:</p>
              {venta.metodos_pago.map((pago, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-blue-200 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize text-sm">
                      {pago.metodo}
                    </p>
                    {pago.numero_autorizacion && (
                      <p className="text-xs text-gray-600">Ref: {pago.numero_autorizacion}</p>
                    )}
                  </div>
                  <span className="font-bold text-gray-900">
                    ${parseFloat(pago.monto).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-t-2 border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Subtotal:</span>
              <span className="font-bold text-gray-900">${venta.subtotal.toFixed(2)}</span>
            </div>
            {venta.descuento > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-medium text-red-700">Descuento:</span>
                <span className="font-bold text-red-700">-${venta.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t-2 border-gray-300">
              <span className="text-gray-900">TOTAL:</span>
              <span className="text-blue-600">${venta.total_venta.toFixed(2)}</span>
            </div>
          </div>

          {/* Cambio */}
          {venta.cambio > 0 && (
            <div className="pt-4 border-t-2 border-gray-200 bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Cambio:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${venta.cambio.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 sm:p-6 border-t-2 border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Historial de Ventas - Responsivo con cards en móvil
const HistorialVentas = ({ ventas, verDetalle }) => {
  const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total_venta), 0);
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg border-2 border-blue-400 p-6 text-white">
        <p className="text-sm font-medium opacity-90">Total Ventas</p>
        <p className="text-3xl sm:text-4xl font-bold mt-1">${totalVentas.toFixed(2)}</p>
        <p className="text-sm mt-2 opacity-80">{ventas.length} ventas registradas</p>
      </div>
      
      {/* Vista de tabla para desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ventas.map(venta => (
                <tr key={venta.id_venta} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600">{venta.numero_venta}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(venta.fecha_venta).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    ${parseFloat(venta.total_venta).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm capitalize font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                      {venta.metodo_pago}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => verDetalle(venta.id_venta)}
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de cards para móvil */}
      <div className="md:hidden space-y-3">
        {ventas.map(venta => (
          <div 
            key={venta.id_venta} 
            className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-blue-600 text-lg">{venta.numero_venta}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(venta.fecha_venta).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className="text-xs capitalize font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                {venta.metodo_pago}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <p className="text-xl font-bold text-green-600">
                ${parseFloat(venta.total_venta).toFixed(2)}
              </p>
              <button
                onClick={() => verDetalle(venta.id_venta)}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors active:scale-95"
              >
                <Eye size={16} />
                Ver detalle
              </button>
            </div>
          </div>
        ))}
      </div>

      {ventas.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-12 text-center">
          <Receipt size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No hay ventas registradas</p>
        </div>
      )}
    </div>
  );
};

// Detalle de Venta - Responsivo
const DetalleVenta = ({ venta, setVista }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 rounded-lg shadow-sm border-2 border-gray-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-600">{venta.numero_venta}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(venta.fecha_venta).toLocaleString('es-MX')}
          </p>
        </div>
        <button
          onClick={() => setVista('historial')}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
        >
          ← Volver
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 bg-gray-50 border-b-2 border-gray-200">
          <h3 className="font-bold text-gray-900 text-lg">📦 Productos</h3>
        </div>

        {/* Vista de tabla para desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Producto</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Cant.</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Precio</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {venta.detalles && venta.detalles.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{d.nombre_producto}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{d.cantidad}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">${parseFloat(d.precio_unitario).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">${parseFloat(d.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan="3" className="px-4 py-4 text-right font-bold text-gray-900 text-base">TOTAL:</td>
                <td className="px-4 py-4 text-right text-xl font-bold text-blue-600">
                  ${parseFloat(venta.total_venta).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Vista de cards para móvil */}
        <div className="sm:hidden divide-y divide-gray-200">
          {venta.detalles && venta.detalles.map((d, i) => (
            <div key={i} className="p-4 space-y-2">
              <p className="font-semibold text-gray-900">{d.nombre_producto}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-bold text-gray-900">{d.cantidad}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio unitario:</span>
                <span className="font-semibold text-gray-900">${parseFloat(d.precio_unitario).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Subtotal:</span>
                <span className="font-bold text-blue-600">${parseFloat(d.subtotal).toFixed(2)}</span>
              </div>
            </div>
          ))}
          
          <div className="p-4 bg-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">TOTAL:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${parseFloat(venta.total_venta).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ModuloVentas };