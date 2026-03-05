'use client';

import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #E5E7EB;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ $active: boolean; disabled?: boolean }>`
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${p => (p.disabled ? '#9CA3AF' : p.$active ? '#191F22' : '#333F44')};
  border-bottom: 2px solid ${p => (p.$active ? '#A0EBF0' : 'transparent')};
  margin-bottom: -2px;
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.15s;

  &:hover:not(:disabled) {
    color: #191F22;
    border-bottom-color: ${p => (p.$active ? '#A0EBF0' : '#D9DEE1')};
  }
`;

interface TabBarProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: string; disabled?: boolean }[];
}

export function TabBar<T extends string>({ value, onChange, tabs }: TabBarProps<T>) {
  return (
    <Wrapper>
      {tabs.map(tab => (
        <Tab
          key={tab.value}
          $active={value === tab.value}
          disabled={tab.disabled}
          onClick={() => !tab.disabled && onChange(tab.value)}
        >
          {tab.label}
        </Tab>
      ))}
    </Wrapper>
  );
}
