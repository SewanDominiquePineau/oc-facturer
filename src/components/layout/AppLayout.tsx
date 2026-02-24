'use client';

import styled from 'styled-components';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const LayoutWrapper = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutWrapper>
      <Sidebar />
      <Main>
        <Topbar />
        <Content>{children}</Content>
      </Main>
    </LayoutWrapper>
  );
}
