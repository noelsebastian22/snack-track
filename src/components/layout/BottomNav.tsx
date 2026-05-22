'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, BarChart3, QrCode } from 'lucide-react';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: BarChart3 },
    { label: 'Inventory', href: '/inventory', icon: Package },
    { label: 'Verify', href: '/verify', icon: QrCode },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-secondary h-12 flex items-center justify-around z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors min-h-[48px] ${
              isActive ? 'text-primary' : 'text-secondary'
            }`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
