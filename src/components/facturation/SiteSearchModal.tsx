'use client';

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useDebounce } from '@/hooks/useDebounce';

interface SiteResult {
  id: string;
  name: string;
  address?: {
    street?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  };
}

interface SiteSearchModalProps {
  organizationId: string;
  onSelect: (siteId: string) => void;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  width: 520px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #191F22;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9CA3AF;
  padding: 0;
  line-height: 1;
  &:hover { color: #191F22; }
`;

const SearchInput = styled.input`
  margin: 12px 16px;
  padding: 8px 12px;
  border: 1px solid #D9DEE1;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: #A0EBF0; }
`;

const ResultsList = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 0 16px 16px;
`;

const ResultItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  margin-bottom: 6px;
  transition: background 0.1s;

  &:hover {
    background: #F9FAFB;
    border-color: #A0EBF0;
  }
`;

const SiteName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #191F22;
`;

const SiteAddress = styled.div`
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
`;

const StatusText = styled.div`
  text-align: center;
  padding: 24px 16px;
  color: #9CA3AF;
  font-size: 13px;
`;

function formatAddress(addr?: SiteResult['address']): string {
  if (!addr) return '';
  return [addr.street, addr.zipCode, addr.city].filter(Boolean).join(', ');
}

export function SiteSearchModal({ organizationId, onSelect, onClose }: SiteSearchModalProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SiteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const debouncedSearch = useDebounce(search, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!organizationId) return;

    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      organizationId,
      limit: '20',
    });
    if (debouncedSearch) params.set('search', debouncedSearch);

    fetch(`/api/sophia/sites?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setResults(data.data);
          setCount(data.pagination?.count || data.data.length);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Site search error:', err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [organizationId, debouncedSearch]);

  return (
    <Overlay onClick={onClose} role="presentation">
      <Modal onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Rechercher un site">
        <Header>
          <Title id="site-search-title">Rechercher un site</Title>
          <CloseBtn onClick={onClose} aria-label="Fermer">&times;</CloseBtn>
        </Header>

        <SearchInput
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nom du site, adresse..."
          aria-label="Rechercher un site par nom ou adresse"
        />

        <ResultsList>
          {loading && <StatusText>Recherche en cours...</StatusText>}

          {!loading && results.length === 0 && (
            <StatusText>
              {debouncedSearch ? 'Aucun site trouve' : 'Tapez pour rechercher un site'}
            </StatusText>
          )}

          {!loading && results.map(site => (
            <ResultItem key={site.id} onClick={() => onSelect(site.id)}>
              <SiteName>{site.name}</SiteName>
              {site.address && (
                <SiteAddress>{formatAddress(site.address)}</SiteAddress>
              )}
            </ResultItem>
          ))}

          {!loading && results.length > 0 && (
            <StatusText>{count} site{count > 1 ? 's' : ''} trouve{count > 1 ? 's' : ''}</StatusText>
          )}
        </ResultsList>
      </Modal>
    </Overlay>
  );
}
