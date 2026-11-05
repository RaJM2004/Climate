import sqlite3

def run_migration():
    con = sqlite3.connect("backend/climate_intelligence.db")
    cur = con.cursor()
    
    # 1. population_indicators
    cur.execute("PRAGMA table_info(population_indicators)")
    cols = [r[1] for r in cur.fetchall()]
    if "is_demographic_breakdown_estimated" not in cols:
        cur.execute("ALTER TABLE population_indicators ADD COLUMN is_demographic_breakdown_estimated BOOLEAN DEFAULT 1")
        print("Added is_demographic_breakdown_estimated to population_indicators")
    if "data_source" not in cols:
        cur.execute("ALTER TABLE population_indicators ADD COLUMN data_source VARCHAR(100) DEFAULT 'Census of India 2011'")
        print("Added data_source to population_indicators")
        
    # 2. official_alerts
    cur.execute("PRAGMA table_info(official_alerts)")
    a_cols = [r[1] for r in cur.fetchall()]
    if "is_benchmark" not in a_cols:
        cur.execute("ALTER TABLE official_alerts ADD COLUMN is_benchmark BOOLEAN DEFAULT 1")
        print("Added is_benchmark to official_alerts")
    if "verification_status" not in a_cols:
        cur.execute("ALTER TABLE official_alerts ADD COLUMN verification_status VARCHAR(50) DEFAULT 'BENCHMARK_DEMONSTRATION'")
        print("Added verification_status to official_alerts")
        
    con.commit()
    con.close()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()

