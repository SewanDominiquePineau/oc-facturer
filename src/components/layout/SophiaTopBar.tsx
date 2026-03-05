'use client';

import styled from 'styled-components';

const TopBarWrapper = styled.div`
  height: 36px;
  background: #1B2A4A;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 13px;
  color: #fff;
  flex-shrink: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SophiaLabel = styled.span`
  font-weight: 600;
  margin-right: 4px;
  color: #fff;
`;

const NavLink = styled.a<{ $active?: boolean }>`
  color: ${p => (p.$active ? '#fff' : 'rgba(255,255,255,0.7)')};
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: ${p => (p.$active ? 600 : 400)};
  background: ${p => (p.$active ? 'rgba(255,255,255,0.12)' : 'transparent')};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const ExternalLink = styled.a`
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const ExternalIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.5 1.5L5.5 6.5M10.5 1.5H7.5M10.5 1.5V4.5M5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V9.5C1.5 10.0523 1.94772 10.5 2.5 10.5H8.5C9.05228 10.5 9.5 10.0523 9.5 9.5V7"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function SophiaTopBar() {
  return (
    <TopBarWrapper>
      <LeftSection>
        <SophiaLabel>Sophia :</SophiaLabel>
        <NavLink href="https://sophia.sewan.fr/live" target="_blank" rel="noopener noreferrer">
          LIVE V3
        </NavLink>
        <NavLink href="https://sophia.sewan.fr/go" $active>
          GO V4
        </NavLink>
      </LeftSection>
      <RightSection>
        <ExternalLink href="https://sophia.sewan.fr/docs" target="_blank" rel="noopener noreferrer">
          Documentation
        </ExternalLink>
        <ExternalLink href="https://sophia.sewan.fr/partners" target="_blank" rel="noopener noreferrer">
          Espace Partenaires <ExternalIcon />
        </ExternalLink>
        <ExternalLink href="https://sophia.sewan.fr/production" target="_blank" rel="noopener noreferrer">
          Production <ExternalIcon />
        </ExternalLink>
        <ExternalLink href="https://sophia.sewan.fr/support" target="_blank" rel="noopener noreferrer">
          Support <ExternalIcon />
        </ExternalLink>
      </RightSection>
    </TopBarWrapper>
  );
}
