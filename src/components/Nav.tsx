'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSimulationStore } from '@/store/simulation'
import { conditions } from '@/data/conditions'
import styles from './Nav.module.css'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/purpose', label: 'Purpose' },
  { href: '/model', label: 'Model' },
  { href: '/sources', label: 'Sources' },
]

export default function Nav() {
  const pathname = usePathname()
  const isModelPage = pathname === '/model'

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const { condition, setCondition } = useSimulationStore()

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand} onClick={closeMobileMenu}>
          <Image
            src="/logo-new.png"
            alt="The Menstrual Cycle logo"
            width={218}
            height={193}
            className={styles.logo}
            priority
          />
          <span className={styles.wordmark}>
            The Menstrual
            <br />
            Cycle
          </span>
        </Link>

        <div className={styles.desktopLinks}>
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href
            const linkClassName = `${styles.link} ${isActive ? styles.linkActive : ''}`

            if (item.href === '/model' && isModelPage) {
              return (
                <div
                  key={item.href}
                  className={styles.modelLinkWrap}
                  onMouseEnter={() => setModelDropdownOpen(true)}
                  onMouseLeave={() => setModelDropdownOpen(false)}
                >
                  <span className={linkClassName} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {item.label}
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {modelDropdownOpen && (
                    <div className={styles.modelDropdown}>
                      <p className={styles.modelDropdownLabel}>Simulation</p>
                      {conditions.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setCondition(c.id)
                            setModelDropdownOpen(false)
                          }}
                          className={styles.modelDropdownItem}
                        >
                          {c.label}
                          {condition === c.id && <span className={styles.check}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link key={item.href} href={item.href} className={linkClassName}>
                {item.label}
              </Link>
            )
          })}
        </div>

        <button
          className={styles.hamburger}
          aria-label="Menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
