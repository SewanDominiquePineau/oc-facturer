'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SidebarWrapper = styled.nav`
  width: 220px;
  background: #fff;
  border-right: 1px solid #D9DEE1;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
`;

const Logo = styled.div`
  padding: 0 16px 24px;
  font-size: 18px;
  font-weight: 700;
  color: #191F22;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 8px;
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin: 2px 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${p => (p.$active ? '#191F22' : '#333F44')};
  background: ${p => (p.$active ? '#CCE0FF' : 'transparent')};
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: ${p => (p.$active ? '#CCE0FF' : '#F9FAFB')};
  }
`;

const navItems = [
  { href: '/validation-bdc', label: 'Validation BDC', icon: '1' },
  { href: '/a-facturer', label: 'A Facturer', icon: '2' },
];

const BottomSection = styled.div`
  margin-top: auto;
  border-top: 1px solid #E5E7EB;
  padding-top: 8px;
`;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarWrapper>
      <Logo>OC Facturation</Logo>
      {navItems.map(item => (
        <NavItem key={item.href} href={item.href} $active={pathname === item.href}>
          {item.label}
        </NavItem>
      ))}
      <BottomSection>
        <NavItem href="/aide" $active={pathname === '/aide'}>
          Aide
        </NavItem>
      </BottomSection>
    </SidebarWrapper>
  );
}
