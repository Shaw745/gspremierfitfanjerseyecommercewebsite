import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Store, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const AdminLayout = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-neutral-100 overflow-x-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#050505] text-white px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#CCFF00]" />
          <span className="text-base font-black tracking-tighter">GS PREMIER</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          data-testid="admin-menu-toggle"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 bg-[#050505] text-white flex flex-col
        w-64 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 lg:p-6 border-b border-neutral-800 mt-14 lg:mt-0">
          <Link to="/" className="flex items-center gap-2">
            <Store className="w-6 h-6 text-[#CCFF00]" />
            <span className="text-lg font-black tracking-tighter">GS PREMIER</span>
          </Link>
          <p className="text-xs text-neutral-500 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
          <ul className="space-y-1 lg:space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded transition-colors ${
                      isActive
                        ? 'bg-[#CCFF00] text-[#050505]'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                    data-testid={`admin-nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm lg:text-base">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 lg:p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-3 lg:px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-[#CCFF00] rounded-full flex items-center justify-center text-[#050505] font-bold text-sm">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 lg:px-4 py-2.5 w-full text-neutral-400 hover:bg-neutral-800 hover:text-white rounded transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <header className="bg-white border-b px-4 lg:px-8 py-3 lg:py-4 sticky top-14 lg:top-0 z-30">
          <h1 className="text-lg lg:text-2xl font-bold uppercase tracking-tight">{title}</h1>
        </header>
        <div className="p-4 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
