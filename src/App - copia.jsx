import React, { useState, useEffect } from 'react';
import { AlertCircle, Package, ShoppingCart,  LogOut, Menu, X, LayoutList, ChefHat, Utensils, DollarSign, Store, Factory, ShoppingBag, Wallet, Settings } from 'lucide-react';
import { ModuloCompras } from '././ModuloCompras';
import { ModuloInventario } from './ModuloInventario';
import { ModuloCatalogos } from './ModuloCatalogos';
import { ModuloProductos } from './ModuloProductos';
import { ModuloProduccion } from './ModuloProduccion';
import { ModuloVentas } from './ModuloVentas';
import { ModuloCaja } from './ModuloCaja';

// Configuración de la API
const API_URL = 'http://localhost/restaurant/backend';

// Context de Autenticación
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [permiso, setPermisos] = useState(null);
  
  React.useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload.data);
      } catch (error) {
        localStorage.removeItem('token');
        setToken(null);
      }
    }
  }, [token]);
  
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Componente de Login
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (!result.success) {
      setError(result.message || 'Error al iniciar sesión');
    }
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Restaurant</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestión</p>
        </div>
        
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="admin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Usuario: <span className="font-semibold">admin</span> | Contraseña: <span className="font-semibold">admin123</span></p>
        </div>
      </div>
    </div>
  );
};

// Layout Principal con Navegación Mejorada
const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [moduloActivo, setModuloActivo] = useState('inventario');
  
  const menuItems = [
    { id: 'inventario', nombre: 'Inventario', icon: Package, color: 'orange' },
    { id: 'compras', nombre: 'Compras', icon: ShoppingCart, color: 'blue' },
    { id: 'productos', nombre: 'Productos', icon: Factory, color: 'orange' },
    { id: 'produccion', nombre: 'Producción', icon: Factory, color: 'green' },
    { id: 'ventas', nombre: 'Ventas', icon: ShoppingBag, color: 'blue' },
    { id: 'caja', nombre: 'Caja', icon: Wallet, color: 'purple' },
    { id: 'catalogos', nombre: 'Catálogos', icon: Settings, color: 'purple' }
  ];
  console.log(children);
  //console.log(menuItems[0].id);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Primera fila: Logo y usuario */}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Restaurant</h1>
                <p className="text-xs text-gray-500">Sistema de Gestión</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-700">{user?.nombre_completo}</p>
                <p className="text-xs text-gray-500">{user?.rol}</p>
              </div>
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Salir
              </button>
              
              {/* Botón menú móvil */}
              <button
                onClick={() => setMenuAbierto(!menuAbierto)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {menuAbierto ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          
          {/* Segunda fila: Navegación de módulos (Desktop) */}
          <div className="hidden md:flex gap-2 pb-3 overflow-x-auto">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setModuloActivo(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    moduloActivo === item.id
                      ? `bg-${item.color}-500 text-white shadow-md`
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={moduloActivo === item.id ? {
                    backgroundColor: item.color === 'orange' ? '#f97316' : 
                                    item.color === 'blue' ? '#3b82f6' : 
                                    item.color === 'green' ? '#10b981' : 
                                    item.color === 'purple' ? '#a855f7' : '#6b7280'
                  } : {}}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.nombre}</span>
                </button>
              );
            })}
          </div>
          
          {/* Menú Móvil */}
          {menuAbierto && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setModuloActivo(item.id);
                      setMenuAbierto(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                      moduloActivo === item.id
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    {item.nombre}
                  </button>
                );
              })}
              <div className="pt-4 border-t border-gray-200">
                <div className="px-4 py-2 text-sm">
                  <p className="font-medium text-gray-700">{user?.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{user?.rol}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  Salir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {React.cloneElement(children, { moduloActivo })}
      </div>
    </div>
  );
};

// Componente Router de Módulos
const ModuloRouter = ({ moduloActivo }) => {
  const { token, user } = useAuth();
  
  switch (moduloActivo) {
    case 'inventario':
      return <ModuloInventario token={token} />;
    case 'compras':
      return <ModuloCompras token={token} />;
    case 'catalogo':
      return <ModuloCatalogos token={token} />;
    case 'productos':
      return <ModuloProductos token={token} />;
    case 'produccion':
      return <ModuloProduccion token={token} />;
    case 'ventas':
      return <ModuloVentas token={token} user={user} />;
    case 'caja':
      return <ModuloCaja token={token} user={user} />;
    default:
      return <ModuloInventario token={token} />;
  }
};

// App Principal
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Login />;
  }
  
  return (
    <MainLayout>
      <ModuloRouter />
    </MainLayout>
  );
};

export default App;