'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { getPublicExperts, getExpertiseAreas } from '@/lib/api-client';
import type { PublicExpertListItem } from '@nexthire/types';
import type { ExpertiseAreaResult } from '@nexthire/types';

const PAGE_SIZE = 12;

export default function FindExpertPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [areas, setAreas] = useState<ExpertiseAreaResult[]>([]);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  const [experts, setExperts] = useState<PublicExpertListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getExpertiseAreas()
      .then(setAreas)
      .catch(() => setAreas([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPublicExperts({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        expertiseAreaId: activeAreaId ?? undefined,
      });
      setExperts(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch {
      setError('We could not load the expert directory. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, activeAreaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleFilterClick = (areaId: string | null) => {
    setPage(1);
    setActiveAreaId(areaId);
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <section className={styles.hero}>
        <h1 className={styles.title}>Find Your Expert Mentor</h1>
        <p className={styles.subtitle}>
          Connect with industry leaders from top tech companies. Book 1-on-1 mock interviews,
          portfolio reviews, and get actionable feedback.
        </p>

        {/* Search Bar */}
        <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
          <div className={styles.searchInputWrapper}>
            <span className={styles.searchIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by professional title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterPill} ${activeAreaId === null ? styles.active : ''}`}
            onClick={() => handleFilterClick(null)}
          >
            All
          </button>
          {areas.map((area) => (
            <button
              key={area.id}
              className={`${styles.filterPill} ${activeAreaId === area.id ? styles.active : ''}`}
              onClick={() => handleFilterClick(area.id)}
            >
              {area.name}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Section */}
      <section className={styles.content}>
        {error && (
          <p role="alert" style={{ color: '#fca5a5', textAlign: 'center', marginBottom: '2rem' }}>
            {error}{' '}
            <button
              onClick={() => void load()}
              style={{
                background: 'none',
                border: 'none',
                color: '#fca5a5',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </p>
        )}

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading experts...</p>
        ) : experts.length === 0 && !error ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>
            No experts match your search yet. Try a different filter.
          </p>
        ) : (
          <div className={styles.expertGrid}>
            {experts.map((expert) => (
              <div key={expert.publicSlug} className={styles.expertCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.expertInfo}>
                    <h3 className={styles.expertName}>
                      {expert.professionalTitle}
                      <span className={styles.verifiedBadge} title="Verified Expert">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="none"
                        >
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </span>
                    </h3>
                    <p className={styles.expertTitle}>
                      {[expert.currentPosition, expert.currentCompany].filter(Boolean).join(' at ')}
                      {expert.currentPosition || expert.currentCompany ? ' · ' : ''}
                      {expert.yearsOfExperience} yrs experience
                    </p>
                  </div>
                </div>

                <p className={styles.bio}>{expert.professionalSummary}</p>

                <div className={styles.skills}>
                  {expert.primaryExpertise.map((area) => (
                    <span key={area.areaSlug} className={styles.skillTag}>
                      {area.areaName}
                    </span>
                  ))}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.price}>
                    <span className={styles.priceLabel}>{expert.city ?? 'Remote'}</span>
                    {expert.rating.average !== null && (
                      <span style={{ color: '#fcd34d', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                        ★ {expert.rating.average.toFixed(1)} ({expert.rating.count})
                      </span>
                    )}
                  </div>
                  <Link href={`/find-expert/${expert.publicSlug}`} className={styles.bookButton}>
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '3rem',
              alignItems: 'center',
            }}
          >
            <button
              className={styles.filterPill}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                opacity: page <= 1 ? 0.5 : 1,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className={styles.filterPill}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                opacity: page >= totalPages ? 0.5 : 1,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
