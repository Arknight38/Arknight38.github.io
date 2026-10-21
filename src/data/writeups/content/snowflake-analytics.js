// Project article grounded in available project material.
export const snowflakeAnalytics = {
  id: "snowflake-analytics",
  title: "Yelp Analytics: Snowflake Data Warehouse",
  subtitle: "Cloud data pipeline analyzing restaurant reviews.",
  date: "2025",
  categories: ["data", "closed"],
  tags: ["snowflake", "sql", "python", "analytics"],
  readTime: "2 min",
  featured: false,
  content: `## Overview

Yelp Analytics is a restaurant-review analysis project organized around Snowflake, SQL, and Python. Its documented scope combines a staged data pipeline with sentiment, competitor, geographic, and review-grouping queries. The aim is to turn raw review records into reusable analytical views.

## Data pipeline

The documented flow separates raw CSV input, staging tables, cleaned data, and analytical views. Those layers have different purposes: staging preserves an ingestion boundary, cleaning establishes consistent records, and views give downstream queries a reusable interpretation. Separating them makes transformations easier to inspect than embedding every step in one final query.

## Analysis features

The project description lists sentiment analysis, competitor comparisons, proximity search, and review clustering. Each asks a different question of the same underlying records. Sentiment concerns the language of a review, competitor analysis compares businesses, and geographic queries add location as a constraint. The implementation details and evaluation of these analyses remain to be documented from source.

## Snowflake features

The existing project notes identify VARIANT data, user-defined functions, stored procedures, time travel, and zero-copy cloning. These span representation, reusable computation, orchestration, and data-history workflows. Their precise role in this project needs the corresponding SQL before it can be explained in depth; they are not evidence of measured scale or query performance.

## Python integration

Python provides a connector-based query path alongside SQL. The documented example opens a Snowflake connection and executes a query against an analytical view. This boundary would also be a useful place to define repeatable inputs and exported results, although a complete automated workflow has not yet been established in this writeup.

## Concepts explored

The central concepts are staged transformation, reusable query logic, and the relationship between a warehouse and an external analysis client. A useful result needs both an understandable query and a clear account of which records and transformations produced it.

## Things to do next

The next step is to make the analysis reproducible: document the source transformations, provide representative queries, and define a small dataset with expected outputs. Sentiment and clustering need evaluation criteria, while performance claims need recorded measurements. Those additions would turn the current project outline into a source-backed technical case study.
`,
};
