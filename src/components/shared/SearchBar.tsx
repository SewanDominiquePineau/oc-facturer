'use client';

import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #D9DEE1;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #A0EBF0;
  }

  &::placeholder {
    color: #9CA3AF;
  }
`;

const Icon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  font-size: 14px;
`;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }: SearchBarProps) {
  return (
    <Wrapper>
      <Icon>&#x1F50D;</Icon>
      <Input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Wrapper>
  );
}
