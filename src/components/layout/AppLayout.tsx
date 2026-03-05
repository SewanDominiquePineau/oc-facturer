'use client';

import styled from 'styled-components';
import { SophiaTopBar } from './SophiaTopBar';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const RootWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const BodyWrapper = styled.div`
  display: flex;
  flex: 1;
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
    <RootWrapper>
      <SophiaTopBar />
      <BodyWrapper>
        <Sidebar />
        <Main>
          <Topbar />
          <Content>{children}</Content>
        </Main>
      </BodyWrapper>
    </RootWrapper>
  );
}
