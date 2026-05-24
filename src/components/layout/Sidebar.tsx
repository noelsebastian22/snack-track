'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Package, QrCode, LayoutDashboard, Settings } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const mainNavItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Inventory', href: '/inventory', icon: Package },
    { label: 'Verify', href: '/verify', icon: QrCode },
  ];

  const adminNavItems = [
    { label: 'Stock Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { label: 'Menu Manager', href: '/admin/products', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-[260px] bg-[#151C2C] border-r border-[#1E293B] flex flex-col z-40 overflow-y-auto">
      <div className="px-5 py-6 border-b border-[#1E293B]">
        <h1 className="text-lg font-black uppercase tracking-wider text-white">Snack-Track</h1>
        <p className="text-xs text-[#94A3B8] mt-1">Vendor POS</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Main</p>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#00C853]/10 text-[#00C853]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}

        <p className="px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Admin</p>
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#00C853]/10 text-[#00C853]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[#1E293B]">
        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Snack-Track v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
