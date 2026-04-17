export const snowflakeAnalytics = {
  id: 'snowflake-analytics',
  title: 'Yelp Analytics: Snowflake Data Warehouse',
  subtitle: 'Cloud data pipeline analyzing restaurant reviews.',
  date: '2025',
  categories: ['data', 'closed'],
  tags: ['snowflake', 'sql', 'python', 'analytics'],
  readTime: '7 min',
  featured: false,
  content: `## Overview

Cloud data warehouse pipeline analyzing Yelp restaurant reviews using Snowflake. Multi-phase SQL architecture with sentiment analysis.

## Architecture

### Data Pipeline
\`\`\`
Raw Data (CSV) → Staging Tables → Cleaned Data → Analytics Views
\`\`\`

### Key Features
- Sentiment analysis with SQL
- Competitor analysis queries
- Geographic proximity search
- Review clustering

## Technical Details

### Snowflake Features Used
- Semi-structured data (VARIANT)
- User-defined functions (UDFs)
- Stored procedures
- Time travel
- Zero-copy cloning

### Python Integration
\`\`\`python
import snowflake.connector

ctx = snowflake.connector.connect(
    user=USER,
    password=PASSWORD,
    account=ACCOUNT
)

# Execute queries
cs = ctx.cursor()
cs.execute("SELECT * FROM analytics.top_rated_restaurants")
\`\`\`

## What I Learned

- Cloud data warehouse concepts
- SQL optimization at scale
- ETL pipeline design
- Python/Snowflake integration
- Production data analysis`
};
