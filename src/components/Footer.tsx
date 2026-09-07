import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer style={{ marginTop: 'auto' }}>
      <div className={styles.scallop} />
      <div className={styles.band}>
        <div className={styles.content}>
          <p className={styles.label}>KEY NOTE</p>
          <p className={styles.body}>
            This is not a diagnostic tool — it is solely for education and empowerment. If you
            have personal health concerns, please consult a professional medical provider. Visuals
            are simplified and may not be anatomically precise; hormone levels and cycle timing
            vary between individuals.
          </p>

          {/* Attribution — left-aligned, appears on every page that renders
              Footer (Home, Purpose, Sources). The Model page has no Footer by
              design: it's a full-viewport canvas with its own timeline bar. */}
          <div className={styles.attribution}>
            <p className={styles.attributionName}>Created and developed by Doris Peng</p>
            <p className={styles.attributionDesc}>
              An independent educational project exploring menstrual-cycle physiology through
              interactive modeling.
            </p>
            {/* Legal links live in the footer by convention — it's where people
                look for them, and it keeps the 4-item nav uncluttered. The Model
                page renders no Footer, so TimelineBar carries its own copy of
                these links. */}
            <p className={styles.attributionLinks}>
              <Link href="/privacy" className={styles.attributionLink}>Privacy Policy</Link>
              <span aria-hidden="true" className={styles.attributionSep}>·</span>
              <Link href="/terms" className={styles.attributionLink}>Terms of Use</Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
