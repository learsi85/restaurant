import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Calendar, AlertCircle, CheckCircle, Eye, CreditCard, Smartphone } from 'lucide-react';
import { usePermisos } from './App';

const API_URL = 'http://localhost/restaurant/backend';

// Componente Principal - Módulo de Caja
const ModuloCaja = ({ token, user }) => {
  const [cajaActual, setCajaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [vista, setVista] = useState('actual');
  const [historial, setHistorial] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null);
  const { tienePermiso } = usePermisos();
    
  // Validar permisos específicos
  const puedeVer = tienePermiso('caja', 'ver');
  const puedeAbrir = tienePermiso('caja', 'abrir');
  const puedeCerrar = tienePermiso('caja', 'cerrar');
  const puedeHistorial = tienePermiso('caja', 'historial');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  useEffect(() => {
    cargarCajaActual();
  }, []);
  
  const cargarCajaActual = async () => {
    try {
      const response = await fetch(`${API_URL}/caja/actual`, { headers });
      const data = await response.json();
      //console.log(data.data);
      if (data.success && data.data.caja_abierta !== false) {
        setCajaActual(data.data);
      } else {
        setCajaActual(null);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };
  
  const cargarHistorial = async () => {
    try {
      const response = await fetch(`${API_URL}/caja/historial`, { headers });
      const data = await response.json();
      if (data.success) setHistorial(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const verDetalleCaja = async (id) => {
    try {
      const response = await fetch(`${API_URL}/caja/a/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setCajaSeleccionada(data.data);
        setVista('detalle');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500 p-3 rounded-lg">
            <Wallet className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Control de Caja</h1>
            <p className="text-sm text-gray-600">Gestiona apertura, cierre y arqueo de caja</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {(puedeAbrir || puedeCerrar) && (
            <button
              onClick={() => setVista('actual')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                vista === 'actual' ? 'bg-purple-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Caja Actual
            </button>
          )}
          {puedeHistorial && (
            <button
              onClick={() => {
                setVista('historial');
                cargarHistorial();
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                vista === 'historial' ? 'bg-purple-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Historial
            </button>
          )}
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
      
      {vista === 'actual' && (
        <CajaActual
          caja={cajaActual}
          headers={headers}
          cargarCajaActual={cargarCajaActual}
          mostrarMensaje={mostrarMensaje}
          user={user}
          puedeAbrir={puedeAbrir}
          puedeCerrar={puedeCerrar}
        />
      )}
      
      {vista === 'historial' && (
        <HistorialCaja
          historial={historial}
          verDetalleCaja={verDetalleCaja}
          puedeHistorial={puedeHistorial}
        />
      )}
      
      {vista === 'detalle' && cajaSeleccionada && (
        <DetalleCaja
          caja={cajaSeleccionada}
          setVista={setVista}
        />
      )}
    </div>
  );
};

// Componente: Caja Actual
const CajaActual = ({ caja, headers, cargarCajaActual, mostrarMensaje, user, puedeAbrir, puedeCerrar }) => {
  const [showModalAbrir, setShowModalAbrir] = useState(false);
  const [showModalCerrar, setShowModalCerrar] = useState(false);
  
  if (!caja && puedeAbrir) {
    return <ModalAbrirCaja headers={headers} cargarCajaActual={cargarCajaActual} mostrarMensaje={mostrarMensaje} user={user} puedeAbrir={puedeAbrir} />;
  }
  
  const montoEsperado = caja.monto_esperado || 0;
  
  return (
    <div className="space-y-6">
      {/* Estado de Caja */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Unlock size={24} />
              <h2 className="text-2xl font-bold">Caja Abierta</h2>
            </div>
            <p className="text-green-100">
              Abierta por: {caja.caja.usuario_apertura}
            </p>
            <p className="text-green-100 text-sm">
              {new Date(caja.caja.fecha_apertura).toLocaleString('es-MX')}
            </p>
          </div>
          {puedeCerrar && (
            <button
              onClick={() => setShowModalCerrar(true)}
              className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2"
            >
              <Lock size={20} />
              Cerrar Caja
            </button>
          )}
        </div>
      </div>
      
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto Inicial</p>
              <p className="text-2xl font-bold text-gray-900">${parseFloat(caja.caja.monto_inicial).toFixed(2)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas en Efectivo</p>
              <p className="text-2xl font-bold text-green-600">${parseFloat(caja.ventas.efectivo || 0).toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-purple-600">${parseFloat(caja.ventas.total_ventas || 0).toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Wallet className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Efectivo Esperado</p>
              <p className="text-2xl font-bold text-orange-600">${montoEsperado.toFixed(2)}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <DollarSign className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Desglose de Ventas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Desglose de Ventas por Método de Pago</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Efectivo</p>
                <p className="text-lg font-bold text-green-600">${parseFloat(caja.ventas.efectivo || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <CreditCard className="text-purple-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Tarjeta</p>
                <p className="text-lg font-bold text-purple-600">${parseFloat(caja.ventas.tarjeta || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <Smartphone className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Transferencia</p>
                <p className="text-lg font-bold text-orange-600">${parseFloat(caja.ventas.transferencia || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Número de Ventas:</span>
            <span className="text-2xl font-bold text-gray-900">{caja.ventas.numero_ventas || 0}</span>
          </div>
        </div>
      </div>
      
      {showModalCerrar && (
        <ModalCerrarCaja
          caja={caja}
          headers={headers}
          onClose={() => setShowModalCerrar(false)}
          cargarCajaActual={cargarCajaActual}
          mostrarMensaje={mostrarMensaje}
          puedeCerrar={puedeCerrar}
        />
      )}
    </div>
  );
};

// Modal: Abrir Caja
const ModalAbrirCaja = ({ headers, cargarCajaActual, mostrarMensaje, user, puedeAbrir }) => {
  const [montoInicial, setMontoInicial] = useState('');
  const [notas, setNotas] = useState('');
  const [abriendo, setAbriendo] = useState(false);
  
  const abrirCaja = async () => {
    if (!montoInicial || parseFloat(montoInicial) < 0) {
      mostrarMensaje('Ingresa un monto inicial válido', 'error');
      return;
    }
    
    setAbriendo(true);
    
    try {
      const response = await fetch(`${API_URL}/caja/abrir`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          monto_inicial: parseFloat(montoInicial),
          notas
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('Caja abierta correctamente', 'success');
        await cargarCajaActual();
      } else {
        mostrarMensaje(data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al abrir caja', 'error');
    } finally {
      setAbriendo(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-red-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Caja Cerrada</h2>
          <p className="text-gray-600 mt-2">Abre la caja para comenzar a registrar ventas</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Inicial en Efectivo *
            </label>
            <input
              type="number"
              step="0.01"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Cuenta el efectivo que hay en caja al inicio del turno
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="2"
              placeholder="Información adicional sobre la apertura..."
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Usuario:</strong> {user.nombre_completo}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Fecha:</strong> {new Date().toLocaleString('es-MX')}
            </p>
          </div>
          {puedeAbrir && (
            <button
              onClick={abrirCaja}
              disabled={abriendo}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {abriendo ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Abriendo Caja...
                </>
              ) : (
                <>
                  <Unlock size={20} />
                  Abrir Caja
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal: Cerrar Caja
const ModalCerrarCaja = ({ caja, headers, onClose, cargarCajaActual, mostrarMensaje, puedeCerrar }) => {
  const [montoFinal, setMontoFinal] = useState('');
  const [notas, setNotas] = useState('');
  const [cerrando, setCerrando] = useState(false);
  
  const montoEsperado = caja.monto_esperado || 0;
  const diferencia = montoFinal ? parseFloat(montoFinal) - montoEsperado : 0;
  
  const cerrarCaja = async () => {
    if (!montoFinal || parseFloat(montoFinal) < 0) {
      mostrarMensaje('Ingresa el monto final', 'error');
      return;
    }
    
    setCerrando(true);
    
    try {
      const response = await fetch(`${API_URL}/caja/cerrar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          monto_final: parseFloat(montoFinal),
          notas
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('Caja cerrada correctamente', 'success');
        onClose();
        await cargarCajaActual();
      } else {
        mostrarMensaje(data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al cerrar caja', 'error');
    } finally {
      setCerrando(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Cerrar Caja</h2>
          <p className="text-sm text-gray-600 mt-1">Cuenta el efectivo en caja y cierra el turno</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Monto Inicial:</span>
              <span className="font-semibold">${parseFloat(caja.caja.monto_inicial).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ventas en Efectivo:</span>
              <span className="font-semibold text-green-600">+${parseFloat(caja.ventas.efectivo || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="font-medium">Efectivo Esperado:</span>
              <span className="font-bold text-lg">${montoEsperado.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Monto Final */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Final en Caja (Contado) *
            </label>
            <input
              type="number"
              step="0.01"
              value={montoFinal}
              onChange={(e) => setMontoFinal(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
              autoFocus
            />
          </div>
          
          {/* Diferencia */}
          {montoFinal && (
            <div className={`rounded-lg p-4 ${
              Math.abs(diferencia) < 0.01 ? 'bg-green-50 border border-green-200' :
              diferencia > 0 ? 'bg-blue-50 border border-blue-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Diferencia:</p>
                  <p className="text-xs text-gray-600">
                    {Math.abs(diferencia) < 0.01 ? 'Cuadra perfecto' :
                     diferencia > 0 ? 'Sobra efectivo' : 'Falta efectivo'}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${
                  Math.abs(diferencia) < 0.01 ? 'text-green-600' :
                  diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)}
                </p>
              </div>
            </div>
          )}
          
          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notas de Cierre</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="2"
              placeholder="Observaciones sobre el cierre..."
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          {puedeCerrar && (
            <button
              onClick={cerrarCaja}
              disabled={cerrando}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {cerrando ? 'Cerrando...' : (
                <>
                  <Lock size={20} />
                  Cerrar Caja
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Historial de Cajas
const HistorialCaja = ({ historial, verDetalleCaja, puedeHistorial }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-black">
      {puedeHistorial && (
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apertura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cierre</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto Inicial</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Ventas</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferencia</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {historial.map(caja => (
              <tr key={caja.id_caja} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  {new Date(caja.fecha_apertura).toLocaleDateString('es-MX')}
                </td>
                <td className="px-6 py-4 text-sm">
                  {caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleDateString('es-MX') : '-'}
                </td>
                <td className="px-6 py-4 text-right font-semibold">
                  ${parseFloat(caja.monto_inicial).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-green-600">
                  ${parseFloat(caja.total_ventas || 0).toFixed(2)}
                </td>
                <td className={`px-6 py-4 text-right font-semibold ${
                  caja.diferencia > 0 ? 'text-blue-600' : caja.diferencia < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {caja.diferencia !== null ? `$${parseFloat(caja.diferencia).toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    caja.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {caja.estado.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {caja.estado === 'cerrada' && (
                    <button
                      onClick={() => verDetalleCaja(caja.id_caja)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye size={16} />
                      Ver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Detalle de Caja
const DetalleCaja = ({ caja, setVista }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Detalle de Caja</h2>
        <button
          onClick={() => setVista('historial')}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Apertura</p>
            <p className="font-semibold">{new Date(caja.fecha_apertura).toLocaleString('es-MX')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cierre</p>
            <p className="font-semibold">{caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString('es-MX') : '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monto Inicial</p>
            <p className="text-xl font-bold">${parseFloat(caja.monto_inicial).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monto Final</p>
            <p className="text-xl font-bold">${caja.monto_final ? parseFloat(caja.monto_final).toFixed(2) : '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Ventas</p>
            <p className="text-xl font-bold text-green-600">${parseFloat(caja.total_ventas || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Diferencia</p>
            <p className={`text-xl font-bold ${caja.diferencia > 0 ? 'text-blue-600' : caja.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${caja.diferencia ? parseFloat(caja.diferencia).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {caja.ventas_detalle && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Desglose de Ventas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Efectivo</p>
                <p className="font-bold text-green-600">${parseFloat(caja.ventas_detalle.efectivo || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tarjeta</p>
                <p className="font-bold text-purple-600">${parseFloat(caja.ventas_detalle.tarjeta || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transferencia</p>
                <p className="font-bold text-orange-600">${parseFloat(caja.ventas_detalle.transferencia || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ModuloCaja };