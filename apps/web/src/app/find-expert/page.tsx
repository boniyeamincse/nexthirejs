'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

// Mock data for the UI
const EXPERTS = [
  {
    id: 1,
    name: 'Sarah Chen',
    title: 'Senior Software Engineer at Google',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    rating: 4.9,
    reviews: 124,
    price: 150,
    skills: ['System Design', 'React', 'Frontend Interviews'],
    bio: 'Former technical interviewer at Meta and current Senior SWE at Google. I specialize in helping frontend engineers nail their architecture and behavioral rounds.',
    verified: true,
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    title: 'Engineering Manager at Netflix',
    avatar: 'https://i.pravatar.cc/150?u=michael',
    rating: 5.0,
    reviews: 89,
    price: 180,
    skills: ['Engineering Management', 'Behavioral', 'Node.js'],
    bio: '10+ years of engineering leadership. I will mock interview you exactly how we do it at FAANG, complete with actionable feedback to help you land the offer.',
    verified: true,
  },
  {
    id: 3,
    name: 'Aisha Patel',
    title: 'Staff Data Scientist at Spotify',
    avatar: 'https://i.pravatar.cc/150?u=aisha',
    rating: 4.8,
    reviews: 56,
    price: 135,
    skills: ['Machine Learning', 'Python', 'SQL'],
    bio: 'Passionate about helping data professionals transition into big tech. I conduct realistic ML system design and data manipulation mock interviews.',
    verified: true,
  },
  {
    id: 4,
    name: 'David Kim',
    title: 'Product Designer at Airbnb',
    avatar: 'https://i.pravatar.cc/150?u=david',
    rating: 4.9,
    reviews: 210,
    price: 120,
    skills: ['UX Design', 'Portfolio Review', 'Figma'],
    bio: 'I help designers craft compelling portfolios and master the app critique interview. My mentees have landed roles at Apple, Airbnb, and Stripe.',
    verified: false,
  },
  {
    id: 5,
    name: 'Elena Sokolov',
    title: 'Principal Engineer at Stripe',
    avatar: 'https://i.pravatar.cc/150?u=elena',
    rating: 5.0,
    reviews: 142,
    price: 200,
    skills: ['Backend Architecture', 'Go', 'Distributed Systems'],
    bio: 'Specializing in hardcore distributed systems design. If you are aiming for Staff or Principal levels, my mock interviews will push you to your limits.',
    verified: true,
  },
  {
    id: 6,
    name: 'Marcus Johnson',
    title: 'Product Manager at Amazon',
    avatar: 'https://i.pravatar.cc/150?u=marcus',
    rating: 4.7,
    reviews: 78,
    price: 140,
    skills: ['Product Strategy', 'Execution', 'Amazon Leadership Principles'],
    bio: 'Learn how to answer behavioral questions using the STAR method and ace the Amazon Leadership Principles. I provide a detailed rubric after every session.',
    verified: false,
  },
];

const FILTERS = [
  'All',
  'Software Engineering',
  'Product Management',
  'Design',
  'Data Science',
  'System Design',
];

export default function FindExpertPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

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
        <div className={styles.searchContainer}>
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
              placeholder="Search by role, company, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.searchButton}>Search</button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={`${styles.filterPill} ${activeFilter === filter ? styles.active : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Section */}
      <section className={styles.content}>
        <div className={styles.expertGrid}>
          {EXPERTS.map((expert) => (
            <div key={expert.id} className={styles.expertCard}>
              <div className={styles.cardHeader}>
                <Image
                  src={expert.avatar}
                  alt={expert.name}
                  width={72}
                  height={72}
                  className={styles.avatar}
                  unoptimized // For pravatar.cc mock images
                />
                <div className={styles.expertInfo}>
                  <h3 className={styles.expertName}>
                    {expert.name}
                    {expert.verified && (
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
                    )}
                  </h3>
                  <p className={styles.expertTitle}>{expert.title}</p>
                  <div className={styles.rating}>
                    <span className={styles.star}>★</span>
                    <span>{expert.rating}</span>
                    <span>({expert.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <p className={styles.bio}>{expert.bio}</p>

              <div className={styles.skills}>
                {expert.skills.map((skill) => (
                  <span key={skill} className={styles.skillTag}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.price}>
                  <span className={styles.priceAmount}>${expert.price}</span>
                  <span className={styles.priceLabel}>per session</span>
                </div>
                <Link href={`/find-expert/${expert.id}`} className={styles.bookButton}>
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
