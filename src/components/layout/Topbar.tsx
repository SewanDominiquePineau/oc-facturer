'use client';

import styled from 'styled-components';
import { usePathname } from 'next/navigation';

const TopbarWrapper = styled.header`
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #D9DEE1;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333F44;
  transition: background 0.15s;

  &:hover {
    background: #F3F4F6;
  }
`;

const OrgSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #F3F4F6;
  }
`;

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      stroke="#333F44"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const OrgName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #191F22;
`;

const Spacer = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #191F22;
  margin: 0;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6366F1;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 4px;
`;

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 2L3 6V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V6L18 2H6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" />
    <path
      d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const titles: Record<string, string> = {
  '/validation-bdc': 'Validation BDC',
  '/a-facturer': 'A Facturer',
  '/aide': 'Aide',
};

export function Topbar() {
  const pathname = usePathname();
  const title = titles[pathname] || 'OC Facturer';

  return (
    <TopbarWrapper>
      <IconButton aria-label="Menu">
        <HamburgerIcon />
      </IconButton>

      <OrgSection>
        <HomeIcon />
        <OrgName>Sewan</OrgName>
      </OrgSection>

      <Spacer />
      <PageTitle>{title}</PageTitle>
      <Spacer />

      <RightSection>
        <IconButton aria-label="Recherche">
          <SearchIcon />
        </IconButton>
        <IconButton aria-label="Panier">
          <CartIcon />
        </IconButton>
        <Avatar title="Dominique Pineau">DP</Avatar>
      </RightSection>
    </TopbarWrapper>
  );
}
