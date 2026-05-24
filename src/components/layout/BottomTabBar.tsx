'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Package, QrCode } from 'lucide-react';

const BottomTabBar = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: BarChart3 },
    { label: 'Inventory', href: '/inventory', icon: Package },
    { label: 'Verify', href: '/verify', icon: QrCode },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#151C2C]/80 backdrop-blur-md border-t border-[#1E293B] flex justify-around items-center z-50 md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              active ? 'text-[#00C853]' : 'text-[#94A3B8]'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
            {active && <div className="w-1 h-1 rounded-full bg-[#00C853] mt-0.5" />}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
