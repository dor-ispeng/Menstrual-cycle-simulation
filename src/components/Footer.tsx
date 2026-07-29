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
        </div>
      </div>
    </footer>
  )
}
