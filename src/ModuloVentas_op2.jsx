import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, DollarSign, CreditCard, Smartphone, Receipt, Eye, CheckCircle, X, AlertCircle, Printer, Menu, Hash } from 'lucide-react';

const API_URL = 'http://localhost/restaurant/backend';

// Componente Principal - Módulo de Ventas con Pagos Mixtos
const ModuloVentas = ({ token, user }) => {
  const [vista, setVista] = useState('pos');
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  
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
    <div className="min-h-screen bg-gray-50">
      {/* Navegación optimizada para móvil */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm mb-4">
        <div className="flex gap-2 p-3 overflow-x-auto">
          <button
            onClick={() => setVista('pos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
              vista === 'pos' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag size={20} />
            <span className="text-sm md:text-base">Punto de Venta</span>
          </button>
          <button
            onClick={() => {
              setVista('historial');
              cargarVentas();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
              vista === 'historial' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Receipt size={20} />
            <span className="text-sm md:text-base">Historial</span>
          </button>
        </div>
      </div>
      
      <div className="px-3 md:px-6 pb-6">
        {vista === 'pos' && <PuntoDeVenta headers={headers} user={user} />}
        {vista === 'historial' && <HistorialVentas ventas={ventas} verDetalle={verDetalle} />}
        {vista === 'detalle' && ventaSeleccionada && (
          <DetalleVenta venta={ventaSeleccionada} setVista={setVista} />
        )}
      </div>
    </div>
  );
};

// Componente: Punto de Venta con Pagos Mixtos
const PuntoDeVenta = ({ headers, user }) => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [showModalPago, setShowModalPago] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  
  // Estado para pagos mixtos
  const [pagosMixtos, setPagosMixtos] = useState({
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0
  });
  
  // Estado para autorizaciones
  const [autorizaciones, setAutorizaciones] = useState({
    tarjeta: '',
    transferencia: ''
  });
  
  useEffect(() => {
    cargarProductos();
  }, []);
  
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
    
    // En móvil, mostrar carrito al agregar producto
    if (window.innerWidth < 1024) {
      setMostrarCarrito(true);
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
  
  const abrirModalPago = () => {
    if (carrito.length === 0) {
      mostrarMensaje('Agrega productos al carrito', 'error');
      return;
    }
    
    const total = calcularTotal();
    setPagosMixtos({
      efectivo: total,
      tarjeta: 0,
      transferencia: 0
    });
    setAutorizaciones({
      tarjeta: '',
      transferencia: ''
    });
    setShowModalPago(true);
  };
  
  const procesarVenta = async (metodoPago, pagosMixtos = null, autorizaciones = null) => {
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
      total_venta: calcularTotal(),
      metodo_pago: metodoPago,
      pagos_mixtos: pagosMixtos,
      autorizaciones: autorizaciones
    };
    console.log(pagosMixtos, autorizaciones);
    try {
      const response = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(venta)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVentaCompletada({
          ...venta,
          numero_venta: data.data.numero_venta,
          fecha_venta: new Date().toISOString(),
          usuario: user.nombre_completo
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
      setShowModalPago(false);
    }
  };
  
  const limpiarVenta = () => {
    setCarrito([]);
    setDescuento(0);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 md:p-3 rounded-lg">
            <ShoppingBag className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Punto de Venta</h1>
            <p className="text-xs md:text-sm text-gray-600">Pagos mixtos disponibles</p>
          </div>
        </div>
        
        {/* Botón carrito móvil */}
        <button
          onClick={() => setMostrarCarrito(true)}
          className="lg:hidden relative p-2.5 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <ShoppingBag size={24} />
          {carrito.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {carrito.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Mensajes */}
      {mensaje && (
        <div className={`flex items-center gap-2 p-3 md:p-4 rounded-lg text-sm md:text-base ${
          mensaje.tipo === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{mensaje.texto}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            {productosFiltrados.map(producto => (
              <button
                key={producto.id_producto}
                onClick={() => agregarAlCarrito(producto)}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-blue-500 p-3 md:p-4 text-left transition-all hover:shadow-md active:scale-95"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight">
                    {producto.nombre_producto}
                  </h3>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium ml-1">
                    {producto.stock_actual}
                  </span>
                </div>
                <p className="text-base md:text-lg font-bold text-blue-600">
                  ${parseFloat(producto.precio_venta).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Carrito - Desktop */}
        <div className="hidden lg:block space-y-4">
          <CarritoComponent
            carrito={carrito}
            modificarCantidad={modificarCantidad}
            eliminarDelCarrito={eliminarDelCarrito}
            descuento={descuento}
            setDescuento={setDescuento}
            calcularSubtotal={calcularSubtotal}
            calcularTotal={calcularTotal}
            abrirModalPago={abrirModalPago}
            limpiarVenta={limpiarVenta}
          />
        </div>
      </div>
      
      {/* Carrito - Mobile (Modal) */}
      {mostrarCarrito && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Carrito de Compras</h3>
              <button
                onClick={() => setMostrarCarrito(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <CarritoComponent
                carrito={carrito}
                modificarCantidad={modificarCantidad}
                eliminarDelCarrito={eliminarDelCarrito}
                descuento={descuento}
                setDescuento={setDescuento}
                calcularSubtotal={calcularSubtotal}
                calcularTotal={calcularTotal}
                abrirModalPago={abrirModalPago}
                limpiarVenta={limpiarVenta}
                onClose={() => setMostrarCarrito(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {showModalPago && (
        <ModalPagoMixto
          total={calcularTotal()}
          pagosMixtos={pagosMixtos}
          setPagosMixtos={setPagosMixtos}
          autorizaciones={autorizaciones}
          setAutorizaciones={setAutorizaciones}
          procesarVenta={procesarVenta}
          onClose={() => setShowModalPago(false)}
          procesando={procesando}
        />
      )}
      
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

// Componente reutilizable: Carrito
const CarritoComponent = ({ 
  carrito, 
  modificarCantidad, 
  eliminarDelCarrito, 
  descuento, 
  setDescuento, 
  calcularSubtotal, 
  calcularTotal, 
  abrirModalPago, 
  limpiarVenta,
  onClose 
}) => {
  return (
    <div className="space-y-4 p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4 text-base md:text-lg">Productos</h3>
        
        {carrito.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag size={48} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Carrito vacío</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 md:max-h-80 overflow-y-auto">
            {carrito.map(item => (
              <div key={item.id_producto} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {item.nombre_producto}
                  </p>
                  <p className="text-xs text-gray-600">${item.precio_unitario.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg">
                  <button
                    onClick={() => modificarCantidad(item.id_producto, item.cantidad - 1)}
                    className="p-1.5 hover:bg-gray-100 rounded-l-lg"
                  >
                    <Minus size={16} className="text-gray-700" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-900">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => modificarCantidad(item.id_producto, item.cantidad + 1)}
                    className="p-1.5 hover:bg-gray-100 rounded-r-lg"
                  >
                    <Plus size={16} className="text-gray-700" />
                  </button>
                </div>
                
                <div className="text-right w-16">
                  <p className="font-semibold text-sm text-gray-900">
                    ${(item.precio_unitario * item.cantidad).toFixed(2)}
                  </p>
                </div>
                
                <button
                  onClick={() => eliminarDelCarrito(item.id_producto)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Descuento
          </label>
          <input
            type="number"
            step="0.01"
            value={descuento}
            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
            className="w-full px-3 md:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            placeholder="0.00"
          />
        </div>
        
        <div className="pt-4 border-t-2 border-gray-200 space-y-2">
          <div className="flex justify-between text-sm md:text-base">
            <span className="text-gray-700 font-medium">Subtotal:</span>
            <span className="font-semibold text-gray-900">
              ${calcularSubtotal().toFixed(2)}
            </span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-sm md:text-base text-red-600">
              <span className="font-medium">Descuento:</span>
              <span className="font-semibold">-${descuento.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg md:text-xl font-bold pt-2 border-t-2 border-gray-200">
            <span className="text-gray-900">TOTAL:</span>
            <span className="text-blue-600">${calcularTotal().toFixed(2)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => {
              abrirModalPago();
              if (onClose) onClose();
            }}
            disabled={carrito.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 md:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm md:text-base shadow-lg"
          >
            <CheckCircle size={20} />
            Procesar Venta
          </button>
          
          {carrito.length > 0 && (
            <button
              onClick={limpiarVenta}
              className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base"
            >
              Limpiar Carrito
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal: Pago Mixto con Autorización
const ModalPagoMixto = ({ total, pagosMixtos, setPagosMixtos, autorizaciones, setAutorizaciones, procesarVenta, onClose, procesando }) => {
  const totalPagos = parseFloat(pagosMixtos.efectivo) + parseFloat(pagosMixtos.tarjeta) + parseFloat(pagosMixtos.transferencia);
  const diferencia = totalPagos - total;
  const esPagoCompleto = Math.abs(diferencia) < 0.01;
  
  // Validar autorización si es necesario
  const requiereAutorizacionTarjeta = pagosMixtos.tarjeta > 0;
  const requiereAutorizacionTransferencia = pagosMixtos.transferencia > 0;
  const autorizacionesCompletas = 
    (!requiereAutorizacionTarjeta || autorizaciones.tarjeta.trim().length > 0) &&
    (!requiereAutorizacionTransferencia || autorizaciones.transferencia.trim().length > 0);
  
  const puedeConfirmar = esPagoCompleto && autorizacionesCompletas;
  
  const actualizarPago = (metodo, valor) => {
    setPagosMixtos({
      ...pagosMixtos,
      [metodo]: parseFloat(valor) || 0
    });
  };
  
  const actualizarAutorizacion = (metodo, valor) => {
    setAutorizaciones({
      ...autorizaciones,
      [metodo]: valor
    });
  };
  
  const aplicarPagoRapido = (metodo) => {
    if (metodo === 'efectivo') {
      setPagosMixtos({ efectivo: total, tarjeta: 0, transferencia: 0 });
      setAutorizaciones({ tarjeta: '', transferencia: '' });
    } else if (metodo === 'tarjeta') {
      setPagosMixtos({ efectivo: 0, tarjeta: total, transferencia: 0 });
      setAutorizaciones({ tarjeta: '', transferencia: '' });
    } else {
      setPagosMixtos({ efectivo: 0, tarjeta: 0, transferencia: total });
      setAutorizaciones({ tarjeta: '', transferencia: '' });
    }
  };
  
  const confirmarPago = () => {
    if (!puedeConfirmar) return;
    
    const metodoPrincipal = pagosMixtos.efectivo > 0 && pagosMixtos.tarjeta === 0 && pagosMixtos.transferencia === 0 ? 'efectivo' :
                           pagosMixtos.tarjeta > 0 && pagosMixtos.efectivo === 0 && pagosMixtos.transferencia === 0 ? 'tarjeta' :
                           pagosMixtos.transferencia > 0 && pagosMixtos.efectivo === 0 && pagosMixtos.tarjeta === 0 ? 'transferencia' :
                           'mixto';
    
    procesarVenta(metodoPrincipal, pagosMixtos, autorizaciones);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 md:p-6 border-b flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Métodos de Pago</h2>
            <p className="text-sm md:text-base text-gray-700 font-medium">
              Total a pagar: <span className="text-blue-600 font-bold">${total.toFixed(2)}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>
        
        <div className="p-4 md:p-6 space-y-6">
          {/* Botones rápidos */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Pago Rápido
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <button
                onClick={() => aplicarPagoRapido('efectivo')}
                className="flex flex-col items-center gap-2 p-3 md:p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all active:scale-95 bg-white"
              >
                <DollarSign size={24} className="text-green-600" />
                <span className="text-xs md:text-sm font-bold text-gray-900 text-center">
                  Todo Efectivo
                </span>
              </button>
              <button
                onClick={() => aplicarPagoRapido('tarjeta')}
                className="flex flex-col items-center gap-2 p-3 md:p-4 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all active:scale-95 bg-white"
              >
                <CreditCard size={24} className="text-purple-600" />
                <span className="text-xs md:text-sm font-bold text-gray-900 text-center">
                  Todo Tarjeta
                </span>
              </button>
              <button
                onClick={() => aplicarPagoRapido('transferencia')}
                className="flex flex-col items-center gap-2 p-3 md:p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all active:scale-95 bg-white"
              >
                <Smartphone size={24} className="text-orange-600" />
                <span className="text-xs md:text-sm font-bold text-gray-900 text-center">
                  Todo Transfer.
                </span>
              </button>
            </div>
          </div>
          
          {/* Pago mixto manual */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              O especifica cantidades
            </label>
            <div className="space-y-4">
              {/* Efectivo */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-2">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Efectivo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pagosMixtos.efectivo}
                    onChange={(e) => actualizarPago('efectivo', e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm md:text-base font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* Tarjeta */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-2">
                  <CreditCard className="text-purple-600" size={24} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Tarjeta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pagosMixtos.tarjeta}
                    onChange={(e) => actualizarPago('tarjeta', e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base font-medium"
                    placeholder="0.00"
                  />
                  
                  {/* Campo de autorización para tarjeta */}
                  {pagosMixtos.tarjeta > 0 && (
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={autorizaciones.tarjeta}
                        onChange={(e) => actualizarAutorizacion('tarjeta', e.target.value)}
                        className="w-full pl-10 pr-3 md:pr-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm md:text-base font-medium"
                        placeholder="Número de autorización"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Transferencia */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-2">
                  <Smartphone className="text-orange-600" size={24} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    Transferencia
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pagosMixtos.transferencia}
                    onChange={(e) => actualizarPago('transferencia', e.target.value)}
                    className="w-full px-3 md:px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm md:text-base font-medium"
                    placeholder="0.00"
                  />
                  
                  {/* Campo de referencia para transferencia */}
                  {pagosMixtos.transferencia > 0 && (
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={autorizaciones.transferencia}
                        onChange={(e) => actualizarAutorizacion('transferencia', e.target.value)}
                        className="w-full pl-10 pr-3 md:pr-4 py-2.5 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm md:text-base font-medium"
                        placeholder="Número de referencia"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Resumen */}
          <div className={`rounded-lg p-4 border-2 ${
            esPagoCompleto ? 'bg-green-50 border-green-400' :
            diferencia > 0 ? 'bg-blue-50 border-blue-400' :
            'bg-red-50 border-red-400'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-900">Total a pagar:</span>
              <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-900">Total pagos:</span>
              <span className="text-lg font-bold text-gray-900">${totalPagos.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-gray-400">
              <span className="font-bold text-gray-900">
                {esPagoCompleto ? '✓ Pago completo' :
                 diferencia > 0 ? 'Sobra:' : 'Falta:'}
              </span>
              <span className={`text-xl font-bold ${
                esPagoCompleto ? 'text-green-700' :
                diferencia > 0 ? 'text-blue-700' : 'text-red-700'
              }`}>
                {esPagoCompleto ? '¡Listo!' : `$${Math.abs(diferencia).toFixed(2)}`}
              </span>
            </div>
            
            {/* Advertencia de autorización */}
            {esPagoCompleto && !autorizacionesCompletas && (
              <div className="mt-3 pt-3 border-t-2 border-yellow-400 bg-yellow-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle size={18} />
                  <span className="text-sm font-bold">
                    Ingresa los números de autorización requeridos
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 p-4 md:p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={procesando}
            className="flex-1 px-4 py-3 border-2 border-gray-400 text-gray-900 bg-white rounded-lg hover:bg-gray-100 disabled:opacity-50 font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarPago}
            disabled={!puedeConfirmar || procesando}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {procesando ? 'Procesando...' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Ticket (sin cambios significativos, solo mejora de contraste)
const ModalTicket = ({ venta, onClose }) => {
  const mostrarDesglose = venta.metodo_pago === 'mixto' && venta.pagos_mixtos;
  const mostrarAutorizaciones = venta.autorizaciones && (venta.autorizaciones.tarjeta || venta.autorizaciones.transferencia);
  
  const imprimirTicket = () => {
    window.print();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 md:p-6 border-b flex justify-between items-center z-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">✅ Venta Completada</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 md:p-6 space-y-4">
          <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 text-center">
            <p className="text-lg md:text-xl font-bold text-green-800">
              {venta.numero_venta}
            </p>
            <p className="text-sm text-green-700 font-medium">Venta registrada exitosamente</p>
          </div>
          
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong className="text-gray-900">Fecha:</strong> {new Date(venta.fecha_venta).toLocaleString()}</p>
            <p><strong className="text-gray-900">Atendió:</strong> {venta.usuario}</p>
            <p><strong className="text-gray-900">Método de pago:</strong> <span className="uppercase font-semibold text-blue-600">{venta.metodo_pago}</span></p>
          </div>
          
          {mostrarDesglose && (
            <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
              <p className="text-sm font-bold text-blue-900 mb-3">Desglose de Pago Mixto:</p>
              <div className="space-y-2 text-sm">
                {venta.pagos_mixtos.efectivo > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <DollarSign size={16} className="text-green-600" />
                      Efectivo:
                    </span>
                    <span className="font-bold text-gray-900">
                      ${venta.pagos_mixtos.efectivo.toFixed(2)}
                    </span>
                  </div>
                )}
                {venta.pagos_mixtos.tarjeta > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <CreditCard size={16} className="text-purple-600" />
                      Tarjeta:
                    </span>
                    <span className="font-bold text-gray-900">
                      ${venta.pagos_mixtos.tarjeta.toFixed(2)}
                    </span>
                  </div>
                )}
                {venta.pagos_mixtos.transferencia > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <Smartphone size={16} className="text-orange-600" />
                      Transferencia:
                    </span>
                    <span className="font-bold text-gray-900">
                      ${venta.pagos_mixtos.transferencia.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Mostrar autorizaciones */}
          {mostrarAutorizaciones && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
              <p className="text-sm font-bold text-purple-900 mb-3">Números de Autorización:</p>
              <div className="space-y-2 text-sm">
                {venta.autorizaciones.tarjeta && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <Hash size={16} className="text-purple-600" />
                      Tarjeta:
                    </span>
                    <span className="font-bold text-gray-900 font-mono">
                      {venta.autorizaciones.tarjeta}
                    </span>
                  </div>
                )}
                {venta.autorizaciones.transferencia && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <Hash size={16} className="text-orange-600" />
                      Transferencia:
                    </span>
                    <span className="font-bold text-gray-900 font-mono">
                      {venta.autorizaciones.transferencia}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="border-t-2 pt-4 space-y-2">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {venta.productos.map((prod, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded border border-gray-200">
                  <span className="text-gray-900 font-medium">
                    {prod.cantidad}x {prod.nombre_producto || 'Producto'}
                  </span>
                  <span className="font-bold text-gray-900">
                    ${prod.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t-2 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-900">
                  ${venta.subtotal.toFixed(2)}
                </span>
              </div>
              {venta.descuento > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-red-700 font-medium">Descuento:</span>
                  <span className="font-bold text-red-700">
                    -${venta.descuento.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg md:text-xl font-bold pt-2 border-t-2">
                <span className="text-gray-900">TOTAL:</span>
                <span className="text-blue-600">${venta.total_venta.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 p-4 md:p-6 border-t flex gap-3">
          <button
            onClick={imprimirTicket}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold"
          >
            <Printer size={20} />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente: Historial de Ventas (sin cambios)
const HistorialVentas = ({ ventas, verDetalle }) => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2.5 md:p-3 rounded-lg">
          <Receipt className="text-white" size={24} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Historial de Ventas</h1>
      </div>
      
      {/* Vista móvil - Cards */}
      <div className="block md:hidden space-y-3">
        {ventas.map((venta) => (
          <div key={venta.id_venta} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-gray-900">{venta.numero_venta}</p>
                <p className="text-xs text-gray-600">
                  {new Date(venta.fecha_venta).toLocaleDateString()}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                venta.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-800' :
                venta.metodo_pago === 'tarjeta' ? 'bg-purple-100 text-purple-800' :
                venta.metodo_pago === 'transferencia' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {venta.metodo_pago.toUpperCase()}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t">
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg font-bold text-blue-600">
                  ${parseFloat(venta.total_venta).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => verDetalle(venta.id_venta)}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
              >
                <Eye size={16} />
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Vista desktop - Tabla */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventas.map((venta) => (
                <tr key={venta.id_venta} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {venta.numero_venta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(venta.fecha_venta).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    ${parseFloat(venta.total_venta).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                      venta.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-800' :
                      venta.metodo_pago === 'tarjeta' ? 'bg-purple-100 text-purple-800' :
                      venta.metodo_pago === 'transferencia' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {venta.metodo_pago === 'efectivo' && <DollarSign size={12} />}
                      {venta.metodo_pago === 'tarjeta' && <CreditCard size={12} />}
                      {venta.metodo_pago === 'transferencia' && <Smartphone size={12} />}
                      {venta.metodo_pago.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    {venta.usuario}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => verDetalle(venta.id_venta)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
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
    </div>
  );
};

// Componente: Detalle de Venta (sin cambios significativos)
const DetalleVenta = ({ venta, setVista }) => {
  const mostrarDesglose = venta.metodo_pago === 'mixto' && venta.pagos_mixtos;
  const mostrarAutorizaciones = venta.autorizaciones && (venta.autorizaciones.tarjeta || venta.autorizaciones.transferencia);
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 md:p-3 rounded-lg">
            <Receipt className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Detalle de Venta</h1>
            <p className="text-xs md:text-sm text-gray-600">{venta.numero_venta}</p>
          </div>
        </div>
        <button
          onClick={() => setVista('historial')}
          className="px-3 md:px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm md:text-base text-gray-700"
        >
          Volver
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-base md:text-lg">Productos</h3>
            <div className="space-y-3">
              {venta.productos.map((prod, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-semibold text-sm md:text-base text-gray-900">
                      {prod.nombre_producto}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {prod.cantidad} x ${parseFloat(prod.precio_unitario).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-sm md:text-base text-gray-900">
                    ${parseFloat(prod.subtotal).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-base md:text-lg">Información</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Fecha:</p>
                <p className="font-bold text-gray-900">
                  {new Date(venta.fecha_venta).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Vendedor:</p>
                <p className="font-bold text-gray-900">{venta.usuario}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Método de pago:</p>
                <p className="font-bold text-blue-600 uppercase">
                  {venta.metodo_pago}
                </p>
              </div>
            </div>
          </div>
          
          {mostrarDesglose && (
            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 md:p-6">
              <h3 className="font-bold text-blue-900 mb-4 text-base md:text-lg">
                Desglose de Pago
              </h3>
              <div className="space-y-2 text-sm">
                {venta.pagos_mixtos.efectivo > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <DollarSign size={16} className="text-green-600" />
                      Efectivo:
                    </span>
                    <span className="font-bold text-gray-900">
                      ${parseFloat(venta.pagos_mixtos.efectivo).toFixed(2)}
                    </span>
                  </div>
                )}
                {venta.pagos_mixtos.tarjeta > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <CreditCard size={16} className="text-purple-600" />
                      Tarjeta:
                    </span>
                    <span className="font-bold text-gray-900">
                      ${parseFloat(venta.pagos_mixtos.tarjeta).toFixed(2)}
                    </span>
                  </div>
                )}
                {venta.pagos_mixtos.transferencia > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-900 font-medium">
                      <Smartphone size={16} className="text-orange-600" />
                      Transferencia:
                    </span>
                    <span className="font-bold text-gray-900">
                      ${parseFloat(venta.pagos_mixtos.transferencia).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Mostrar autorizaciones en el detalle */}
          {mostrarAutorizaciones && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 md:p-6">
              <h3 className="font-bold text-purple-900 mb-4 text-base md:text-lg">
                Autorizaciones
              </h3>
              <div className="space-y-2 text-sm">
                {venta.autorizaciones.tarjeta && (
                  <div>
                    <p className="text-gray-700 font-medium mb-1">Tarjeta:</p>
                    <p className="font-bold text-gray-900 font-mono bg-white px-3 py-2 rounded border border-purple-200">
                      {venta.autorizaciones.tarjeta}
                    </p>
                  </div>
                )}
                {venta.autorizaciones.transferencia && (
                  <div>
                    <p className="text-gray-700 font-medium mb-1">Transferencia:</p>
                    <p className="font-bold text-gray-900 font-mono bg-white px-3 py-2 rounded border border-purple-200">
                      {venta.autorizaciones.transferencia}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-700 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-900">
                  ${parseFloat(venta.subtotal).toFixed(2)}
                </span>
              </div>
              {venta.descuento > 0 && (
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-red-700 font-medium">Descuento:</span>
                  <span className="font-bold text-red-700">
                    -${parseFloat(venta.descuento).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg md:text-xl font-bold pt-2 border-t-2">
                <span className="text-gray-900">TOTAL:</span>
                <span className="text-blue-600">
                  ${parseFloat(venta.total_venta).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ModuloVentas };