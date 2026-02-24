'use client';

import styled from 'styled-components';
import { usePathname } from 'next/navigation';

const TopbarWrapper = styled.header`
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #D9DEE1;
  display: flex;
  align-items: center;
  padding: 0 24px;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #191F22;
`;

const titles: Record<string, string> = {
  '/validation-bdc': 'Validation BDC',
  '/a-facturer': 'A Facturer',
};

export function Topbar() {
  const pathname = usePathname();
  const title = titles[pathname] || 'OC Facturer';

  return (
    <TopbarWrapper>
      <PageTitle>{title}</PageTitle>
    </TopbarWrapper>
  );
}
