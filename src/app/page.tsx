"use client";

import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={`${styles.headerContainer} container`}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>AI</div>
            <div className={styles.logoText}>Knowledge System</div>
          </div>
        </div>
      </header>

      <main className={styles.dashboard}>
        {/* Layer 1: Input */}
        <div className={`${styles.layer} ${styles.layerInput}`}>
          <div className={styles.layerHeader}>
            <h2 className={styles.layerTitle}>Input layer</h2>
            <p className={styles.layerSubtitle}>How resources enter the system</p>
          </div>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardInput}`}>Paste a URL</div>
            <div className={`${styles.card} ${styles.cardInput}`}>Upload document</div>
            <div className={`${styles.card} ${styles.cardInput}`}>Paste text / notes</div>
            <div className={`${styles.card} ${styles.cardInput}`}>Video link</div>
          </div>
        </div>

        <div className={styles.arrowDown}>↓</div>

        {/* Layer 2: Processing */}
        <div className={`${styles.layer} ${styles.layerProcessing}`}>
          <div className={styles.layerHeader}>
            <h2 className={styles.layerTitle}>Processing layer</h2>
            <p className={styles.layerSubtitle}>AI enrichment — runs automatically on every resource</p>
          </div>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardProcessing}`}>Summary<br/>generation</div>
            <div className={`${styles.card} ${styles.cardProcessing}`}>Auto-tagging<br/>& classification</div>
            <div className={`${styles.card} ${styles.cardProcessing}`}>Semantic<br/>embedding</div>
            <div className={`${styles.card} ${styles.cardProcessing}`}>Relationship<br/>detection</div>
          </div>
        </div>

        <div className={styles.arrowDown}>↓</div>

        {/* Layer 3: Storage */}
        <div className={`${styles.layer} ${styles.layerStorage}`}>
          <div className={styles.layerHeader}>
            <h2 className={styles.layerTitle}>Storage layer</h2>
            <p className={styles.layerSubtitle}>Everything lives here, indexed and connected</p>
          </div>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardStorage}`}>Resource records + metadata</div>
            <div className={`${styles.card} ${styles.cardStorage}`}>Vector index</div>
            <div className={`${styles.card} ${styles.cardStorage}`}>Full-text index</div>
            <div className={`${styles.card} ${styles.cardStorage}`}>Relation graph</div>
          </div>
        </div>

        <div className={styles.arrowDown}>↓</div>

        {/* Layer 4: Views */}
        <div className={`${styles.layer} ${styles.layerViews}`}>
          <div className={styles.layerHeader}>
            <h2 className={styles.layerTitle}>Views layer</h2>
            <p className={styles.layerSubtitle}>Different ways to surface the same data</p>
          </div>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardViews}`}>
              Timeline
              <span>Chronological log</span>
            </div>
            <div className={`${styles.card} ${styles.cardViews}`}>
              Topic view
              <span>Grouped by theme</span>
            </div>
            <div className={`${styles.card} ${styles.cardViews}`}>
              Map view
              <span>Connected graph</span>
            </div>
            <div className={`${styles.card} ${styles.cardViews}`}>
              Search view
              <span>Keyword + semantic</span>
            </div>
            <div className={`${styles.card} ${styles.cardViews}`} style={{ flex: 0.5 }}>
              Ask<br/>AI<br/>mode
            </div>
          </div>
        </div>

        <div className={styles.arrowDown}>↓</div>

        {/* Layer 5: Collaboration */}
        <div className={`${styles.layer} ${styles.layerCollab}`}>
          <div className={styles.layerHeader}>
            <h2 className={styles.layerTitle}>Collaboration layer</h2>
            <p className={styles.layerSubtitle}>Built for ~20 people working together</p>
          </div>
          <div className={styles.grid}>
            <div className={`${styles.card} ${styles.cardCollab}`}>Shared workspaces</div>
            <div className={`${styles.card} ${styles.cardCollab}`}>Comments + notes</div>
            <div className={`${styles.card} ${styles.cardCollab}`}>Activity feed</div>
            <div className={`${styles.card} ${styles.cardCollab}`}>Contributor tracking</div>
          </div>
        </div>
      </main>
    </div>
  );
}
