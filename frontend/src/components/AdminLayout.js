import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AdminLayout = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  if (!isAuthenticated || !user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#050505] text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-neutral-800">
          <Link to="/" className="flex items-center gap-2">
            <Store className="w-6 h-6 text-[#CCFF00]" />
            <span className="text-lg font-black tracking-tighter">GS PREMIER</span>
          </Link>
          <p className="text-xs text-neutral-500 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      isActive
                        ? 'bg-[#CCFF00] text-[#050505]'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                    data-testid={`admin-nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-[#CCFF00] rounded-full flex items-center justify-center text-[#050505] font-bold">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-neutral-400 hover:bg-neutral-800 hover:text-white rounded transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <header className="bg-white border-b px-8 py-4">
          <h1 className="text-2xl font-bold uppercase tracking-tight">{title}</h1>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
