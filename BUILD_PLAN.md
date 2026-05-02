# Double-Doozie Portfolio: Case Study Build Plan
### Jeffrey Greene — Growth Analytics Portfolio
**Site:** https://jeffgreenenyc.github.io/Double-Doozie/

---

## How to Use This Plan

This document is your single source of truth while building the three case studies for your portfolio. Read it from top to bottom once before touching any data. Then work through each case study in order — Funnel Leak Finder first, Lifecycle Segmentation second, Churn Early Warning third. The order matters because each project builds on skills from the previous one, and the final Capstone requires all three to exist.

Each case study section has numbered steps with time estimates. Do not skip steps. If something is unclear, the explicit code blocks are there to tell you exactly what to type — you do not need to improvise. Follow the checklist at the end of each section before moving to the next project.

A note on learning progression: Case Study 1 uses only SQL and Power BI (tools you already know). Case Study 2 introduces Python pandas (stretching into new territory). Case Study 3 uses Python's scikit-learn for machine learning (the hardest skill in this set). This ramp is intentional. Do not jump ahead.

---

## Shared Dataset Setup

### Why the Olist Brazilian E-Commerce Dataset

All three case studies use one dataset: the **Brazilian E-Commerce Public Dataset by Olist**, available at https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce. It contains 100,000 real anonymized orders from 2016–2018 across nine relational tables. This gives you:

- Multiple linked tables (just like a real company database)
- Order lifecycle data (purchase → payment → delivery → review)
- Customer, product, seller, and payment dimensions
- Enough rows to produce meaningful ML signals

Using one dataset across all three projects also demonstrates a real skill: the ability to extract multiple analytical views from a single data source — something you do every day in a real analytics role.

### Step 1 — Download the Dataset (15 minutes)

1. Go to https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
2. Click **Download** (you need a free Kaggle account)
3. Unzip the archive. You will have these nine CSV files:

| File | What It Contains |
|---|---|
| `olist_customers_dataset.csv` | Customer IDs, zip codes, city, state |
| `olist_orders_dataset.csv` | One row per order: status, purchase timestamp, delivery dates |
| `olist_order_items_dataset.csv` | One row per item within an order: product, seller, price, freight |
| `olist_order_payments_dataset.csv` | Payment method, installments, payment value |
| `olist_order_reviews_dataset.csv` | Review scores and comments |
| `olist_products_dataset.csv` | Product category, dimensions, weight |
| `olist_sellers_dataset.csv` | Seller IDs, city, state |
| `olist_geolocation_dataset.csv` | Zip code to lat/lng mapping |
| `product_category_name_translation.csv` | Portuguese → English category names |

### Step 2 — Load Into MySQL (30 minutes)

You already know MySQL. Use MySQL Workbench or the command line.

```sql
-- Create the database
CREATE DATABASE olist;
USE olist;

-- Create the orders table
CREATE TABLE orders (
    order_id VARCHAR(40),
    customer_id VARCHAR(40),
    order_status VARCHAR(20),
    order_purchase_timestamp DATETIME,
    order_approved_at DATETIME,
    order_delivered_carrier_date DATETIME,
    order_delivered_customer_date DATETIME,
    order_estimated_delivery_date DATETIME
);

-- Load orders data (adjust the path to where you saved your CSV files)
LOAD DATA INFILE 'C:/olist/olist_orders_dataset.csv'
INTO TABLE orders
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

-- Repeat CREATE TABLE + LOAD DATA INFILE for each of the other CSVs.
-- Column names for each table are listed in the per-project sections below.
```

> **Windows users:** MySQL may require you to place files in `C:\ProgramData\MySQL\MySQL Server 8.0\Uploads\`. Run `SHOW VARIABLES LIKE 'secure_file_priv';` to find the exact allowed path.

### Step 3 — Baseline Sanity Check (10 minutes)

Run these counts after loading. If any number is zero or suspiciously small, your LOAD DATA INFILE did not work correctly.

```sql
SELECT 'orders' AS tbl, COUNT(*) AS row_count FROM orders
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'products', COUNT(*) FROM products;
```

**Expected approximate counts:**
- orders: ~99,441
- customers: ~99,441
- order_items: ~112,650
- payments: ~103,886
- reviews: ~99,224
- products: ~32,951

---

## Repository Organization

Add these folders to your existing Double-Doozie repo. Each case study lives in its own folder so a recruiter can navigate directly to it.

```
Double-Doozie/
├── index.html                    ← your existing portfolio homepage
├── case-studies/
│   ├── funnel-leak-finder/
│   │   ├── sql/
│   │   │   └── funnel-analysis.sql
│   │   ├── screenshots/
│   │   │   ├── 01-funnel-overview.png
│   │   │   ├── 02-dropoff-bar-chart.png
│   │   │   ├── 03-revenue-at-risk.png
│   │   │   └── 04-executive-summary-slide.png
│   │   ├── funnel.pbix
│   │   └── README.md
│   │
│   ├── lifecycle-segmentation/
│   │   ├── sql/
│   │   │   └── rfm-scoring.sql
│   │   ├── notebooks/
│   │   │   └── rfm-segmentation.ipynb
│   │   ├── exports/
│   │   │   └── rfm_segments.csv
│   │   ├── screenshots/
│   │   │   ├── 01-rfm-quadrant.png
│   │   │   ├── 02-segment-heatmap.png
│   │   │   ├── 03-champion-profile.png
│   │   │   └── 04-at-risk-profile.png
│   │   └── README.md
│   │
│   └── churn-early-warning/
│       ├── notebooks/
│       │   └── churn-model.ipynb
│       ├── exports/
│       │   └── churn_risk_scores.csv
│       ├── screenshots/
│       │   ├── 01-confusion-matrix.png
│       │   ├── 02-feature-importance.png
│       │   ├── 03-risk-score-distribution.png
│       │   └── 04-model-card.png
│       └── README.md
│
└── capstone-command-center/
    ├── command-center.pbix
    ├── screenshots/
    └── README.md
```

---

---

# Case Study 1: Funnel Leak Finder

**Difficulty:** Easy | **Tools:** SQL + Power BI | **Type:** Descriptive Analytics

---

## Overview

The Funnel Leak Finder answers one question: at which stage of the purchase journey do customers abandon the process, and how much revenue does that abandonment cost? You will trace orders through their lifecycle stages — from initial purchase through payment approval to shipment and delivery — and calculate a dollar value for every drop-off point. This is the most common type of analysis in e-commerce and retail analytics, and it demonstrates that you can translate raw order data into a business decision.

## Skills Demonstrated

- SQL: filtering, aggregation, GROUP BY, CASE WHEN, COALESCE, subqueries
- Funnel logic: defining stages, calculating stage-to-stage conversion rates
- Power BI: funnel chart, bar chart, card visuals, DAX measures
- Business communication: translating percentage drop-off into dollar impact
- Data validation: verifying row counts match expected totals

---

## Dataset & Setup

**Tables used:**
- `olist_orders_dataset.csv` → MySQL table `orders`
- `olist_order_payments_dataset.csv` → MySQL table `payments`

**Columns used from `orders`:**

| Column | Data Type | What It Means |
|---|---|---|
| `order_id` | VARCHAR(40) | Unique order identifier |
| `customer_id` | VARCHAR(40) | Links to customers table |
| `order_status` | VARCHAR(20) | One of: created, approved, invoiced, processing, shipped, delivered, unavailable, canceled |
| `order_purchase_timestamp` | DATETIME | When the customer clicked "buy" |
| `order_approved_at` | DATETIME | When payment was approved |
| `order_delivered_carrier_date` | DATETIME | When the seller handed to carrier |
| `order_delivered_customer_date` | DATETIME | When the customer received it |

**Columns used from `payments`:**

| Column | Data Type | What It Means |
|---|---|---|
| `order_id` | VARCHAR(40) | Links to orders table |
| `payment_value` | DECIMAL | Revenue amount for this order |

**Create tables in MySQL:**

```sql
CREATE TABLE orders (
    order_id VARCHAR(40),
    customer_id VARCHAR(40),
    order_status VARCHAR(20),
    order_purchase_timestamp DATETIME,
    order_approved_at DATETIME,
    order_delivered_carrier_date DATETIME,
    order_delivered_customer_date DATETIME,
    order_estimated_delivery_date DATETIME
);

CREATE TABLE payments (
    order_id VARCHAR(40),
    payment_sequential INT,
    payment_type VARCHAR(20),
    payment_installments INT,
    payment_value DECIMAL(10,2)
);

LOAD DATA INFILE '/path/to/olist_orders_dataset.csv'
INTO TABLE orders FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n' IGNORE 1 ROWS;

LOAD DATA INFILE '/path/to/olist_order_payments_dataset.csv'
INTO TABLE payments FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n' IGNORE 1 ROWS;
```

---

## Step-by-Step Build

### Step 1 — Understand the Order Status Values (20 minutes)

Before writing any funnel logic, see what statuses actually exist in the data.

```sql
-- Check all unique order statuses and their counts
SELECT
    order_status,
    COUNT(*) AS order_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS pct_of_total
FROM orders
GROUP BY order_status
ORDER BY order_count DESC;
```

**What you expect to see:** `delivered` will be the largest group (~97,000 rows). You will also see `shipped`, `canceled`, `processing`, `invoiced`, `unavailable`, and `created` in smaller numbers. Write these numbers down — you will reference them in your narrative.

**Sanity check:** The sum of all status counts should equal the total row count from your baseline check.

---

### Step 2 — Build the Funnel Stage Query (45 minutes)

The Olist dataset does not have a traditional "added to cart" → "checkout" funnel because it is a marketplace. Instead, you will model the order fulfillment funnel: Purchase → Payment Approved → Shipped → Delivered.

```sql
-- Funnel: count orders at each stage
-- Save this as funnel-analysis.sql
SELECT
    'Stage 1: Purchase Created' AS stage,
    1 AS stage_order,
    COUNT(DISTINCT order_id) AS orders_at_stage
FROM orders

UNION ALL

SELECT
    'Stage 2: Payment Approved',
    2,
    COUNT(DISTINCT order_id)
FROM orders
WHERE order_approved_at IS NOT NULL

UNION ALL

SELECT
    'Stage 3: Shipped to Carrier',
    3,
    COUNT(DISTINCT order_id)
FROM orders
WHERE order_delivered_carrier_date IS NOT NULL

UNION ALL

SELECT
    'Stage 4: Delivered to Customer',
    4,
    COUNT(DISTINCT order_id)
FROM orders
WHERE order_delivered_customer_date IS NOT NULL

ORDER BY stage_order;
```

**What you expect to see:** A 4-row result set with counts decreasing from top to bottom. The biggest drop will likely be between Stage 1 and Stage 2 (orders that never got approved) or between Stage 3 and Stage 4.

---

### Step 3 — Calculate Drop-Off Rates and Revenue at Risk (30 minutes)

```sql
-- Funnel with conversion rates and revenue at risk
WITH stage_counts AS (
    SELECT
        COUNT(DISTINCT o.order_id) AS stage1_created,
        SUM(CASE WHEN o.order_approved_at IS NOT NULL THEN 1 ELSE 0 END) AS stage2_approved,
        SUM(CASE WHEN o.order_delivered_carrier_date IS NOT NULL THEN 1 ELSE 0 END) AS stage3_shipped,
        SUM(CASE WHEN o.order_delivered_customer_date IS NOT NULL THEN 1 ELSE 0 END) AS stage4_delivered
    FROM orders o
),
revenue AS (
    SELECT
        AVG(payment_value) AS avg_order_value,
        SUM(payment_value) AS total_revenue
    FROM payments
    WHERE payment_value > 0
)
SELECT
    sc.stage1_created,
    sc.stage2_approved,
    sc.stage3_shipped,
    sc.stage4_delivered,
    -- Drop-off counts
    (sc.stage1_created - sc.stage2_approved) AS lost_at_approval,
    (sc.stage2_approved - sc.stage3_shipped) AS lost_at_shipping,
    (sc.stage3_shipped - sc.stage4_delivered) AS lost_at_delivery,
    -- Drop-off rates
    ROUND((sc.stage1_created - sc.stage2_approved) * 100.0 / sc.stage1_created, 2) AS pct_lost_at_approval,
    ROUND((sc.stage2_approved - sc.stage3_shipped) * 100.0 / sc.stage2_approved, 2) AS pct_lost_at_shipping,
    ROUND((sc.stage3_shipped - sc.stage4_delivered) * 100.0 / sc.stage3_shipped, 2) AS pct_lost_at_delivery,
    -- Revenue at risk (lost orders * average order value)
    r.avg_order_value,
    ROUND((sc.stage1_created - sc.stage2_approved) * r.avg_order_value, 2) AS revenue_at_risk_approval,
    ROUND((sc.stage2_approved - sc.stage3_shipped) * r.avg_order_value, 2) AS revenue_at_risk_shipping,
    ROUND((sc.stage3_shipped - sc.stage4_delivered) * r.avg_order_value, 2) AS revenue_at_risk_delivery
FROM stage_counts sc, revenue r;
```

**Sanity check:** The `avg_order_value` should be somewhere in the range of R$150–R$200 (Brazilian reais). If it shows something wildly different, check that your payments table loaded correctly.

---

### Step 4 — Add a Cancellation Breakdown by Category (30 minutes)

This is the "so what" layer that shows you can go beyond surface-level counts.

```sql
-- Load order_items and products tables first (create tables as shown in the shared setup section)
-- Then run:

SELECT
    p.product_category_name,
    COUNT(DISTINCT o.order_id) AS canceled_orders,
    SUM(pay.payment_value) AS revenue_lost
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN payments pay ON o.order_id = pay.order_id
WHERE o.order_status = 'canceled'
GROUP BY p.product_category_name
ORDER BY canceled_orders DESC
LIMIT 15;
```

This tells you which product categories are driving cancellations — a direct input to a merchandising recommendation.

---

### Step 5 — Export Results and Build in Power BI (90 minutes)

1. In MySQL Workbench, run your Step 2 query. Click **Export** → save as `funnel_stages.csv`
2. Run your Step 3 query. Export as `funnel_dropoff.csv`
3. Run your Step 4 query. Export as `funnel_cancellations_by_category.csv`
4. Open Power BI Desktop → **Get Data** → **Text/CSV** → load all three files
5. **Build Visualization 1 (Funnel Chart):**
   - Insert → Funnel chart
   - Values field: `orders_at_stage`
   - Category field: `stage`
   - Title: "Order Fulfillment Funnel — 100K Orders"
6. **Build Visualization 2 (Drop-Off Bar Chart):**
   - Insert → Clustered bar chart
   - Y-axis: stage names (`lost_at_approval`, `lost_at_shipping`, `lost_at_delivery`)
   - X-axis: drop-off counts
   - Add data labels showing the revenue at risk values
   - Title: "Orders Lost Per Stage (Revenue Impact)"
7. **Build Visualization 3 (Card Visuals):**
   - Add three card visuals showing: Total Revenue at Risk, Largest Drop-Off Stage, Average Order Value
8. **Build Visualization 4 (Cancellations by Category Bar Chart):**
   - Horizontal bar chart with `product_category_name` on Y-axis, `canceled_orders` on X-axis
9. Format the dashboard: consistent color scheme, add a text box with a one-sentence headline finding
10. Save as `funnel.pbix`

---

### Step 6 — Validate Your Findings (15 minutes)

Cross-check: take the total from `stage4_delivered` and add `lost_at_approval + lost_at_shipping + lost_at_delivery`. Does the sum approximately equal `stage1_created`? It should be within 1–2% (small rounding from the CASE WHEN logic). If it is off by more than 5%, re-examine your WHERE clauses.

---

## Deliverables Checklist

- [ ] `case-studies/funnel-leak-finder/sql/funnel-analysis.sql` — all four SQL queries in one file with comments
- [ ] `case-studies/funnel-leak-finder/funnel.pbix` — Power BI dashboard file
- [ ] `case-studies/funnel-leak-finder/screenshots/01-funnel-overview.png`
- [ ] `case-studies/funnel-leak-finder/screenshots/02-dropoff-bar-chart.png`
- [ ] `case-studies/funnel-leak-finder/screenshots/03-revenue-at-risk-cards.png`
- [ ] `case-studies/funnel-leak-finder/screenshots/04-cancellations-by-category.png`
- [ ] `case-studies/funnel-leak-finder/README.md` — case study write-up (see narrative outline below)
- [ ] Entry added to `index.html` linking to this case study

---

## Visualizations to Include

1. **Funnel Chart** — Shows 4-stage order funnel from created to delivered. The visual taper makes drop-off instantly visible.
2. **Drop-Off Bar Chart** — Horizontal bars for each lost stage, with revenue at risk annotated directly on the bars. The key message: this is not just a count problem, it is a dollar problem.
3. **KPI Card Row** — Three summary cards: Total Revenue at Risk (sum of all three stages), Biggest Leak Stage (the one stage with the most lost orders), and Average Order Value used in the calculation.
4. **Cancellations by Category Bar Chart** — Answers the "where do we fix it first" question by showing which product categories have the most canceled orders.

---

## Screenshots to Capture

1. **Full dashboard overview** — Entire Power BI canvas showing all four visuals together. This is the hero image for the HTML page.
2. **Funnel chart close-up** — Just the funnel visual, zoomed in so stage labels are readable.
3. **Drop-off bar chart with revenue annotations** — Cropped to show the bar chart with dollar values clearly visible on the bars.
4. **Cancellations by category close-up** — The horizontal bar chart showing top 10 categories.
5. **SQL query in MySQL Workbench** — A screenshot of your Step 3 query running in MySQL Workbench with results visible. This proves you wrote the SQL yourself.

---

## Narrative Outline for the Case Study HTML Page

**Problem section:**
> "Every order on a marketplace platform passes through multiple stages before revenue is recognized. When an order stalls between stages — payment not approved, shipment delayed, delivery failed — that is lost revenue with a specific dollar value. This analysis quantifies exactly where and how much Olist loses in its 100,000-order dataset."

**What I Built section:**
> "Using MySQL, I mapped the order lifecycle across four stages and calculated the conversion rate between each stage. I then multiplied drop-off counts by average order value to produce a revenue-at-risk figure. The result is a Power BI dashboard any operations manager could act on in a weekly review meeting."

**Key Insights section (fill in with your actual numbers after running the queries):**
> "The largest drop occurs between [Stage X] and [Stage Y], where approximately [N] orders — representing R$[X] in revenue — fail to advance. Cancellations are concentrated in [top category], which accounts for [%] of all cancellations."

**Recommendation section:**
> "The single highest-ROI intervention is [specific action tied to the largest leak stage]. If [stage name] conversion improves by just 5%, that recovers approximately R$[X] in revenue annually, assuming the current order volume holds."

**Next Iteration section:**
> "A natural extension of this analysis is to segment the funnel by seller quality or product category to determine whether the leak is platform-wide or concentrated in a subset of sellers. That segmentation is developed in Case Study 2."

---

## Time Estimate

| Task | Estimated Hours |
|---|---|
| Dataset download and MySQL setup | 0.75 hr |
| Writing and running all SQL queries | 1.5 hr |
| Exporting CSVs and building Power BI dashboard | 2.0 hr |
| Formatting, screenshots, and validation | 1.0 hr |
| Writing the README and HTML case study page | 1.5 hr |
| **Total** | **~7 hours** |

---

## Stretch Goals

- Break the funnel out by **month** to show whether drop-off rates are getting better or worse over time (add `DATE_FORMAT(order_purchase_timestamp, '%Y-%m')` to your GROUP BY)
- Add a **seller performance dimension** — which sellers have the highest order-to-ship failure rate?
- Add a **payment type filter** to the Power BI dashboard (credit card vs. boleto vs. voucher) to see if payment method correlates with approval failure rate

---

---

# Case Study 2: Lifecycle Segmentation

**Difficulty:** Medium | **Tools:** SQL + Python (pandas) | **Type:** Diagnostic Analytics

---

## Overview

Lifecycle Segmentation answers the question: who are my best customers, and who is slipping away? You will score every customer using the RFM framework — Recency (how recently they purchased), Frequency (how often they purchase), and Monetary (how much they spend) — and group customers into named segments like Champions, Loyal Customers, At Risk, and Lost. This is one of the most widely used techniques in CRM and lifecycle marketing. Doing it in Python demonstrates you can move beyond SQL for analytical work.

## Skills Demonstrated

- SQL: aggregation, GROUP BY, date functions, subqueries, window functions
- Python pandas: read_csv, groupby, cut/qcut for binning, merge, value_counts
- RFM methodology: scoring logic, segment definition, business interpretation
- Data visualization: matplotlib/seaborn heatmap and scatter plot
- Jupyter Notebooks: structured, documented analysis workflow

---

## Dataset & Setup

**Tables used:**
- `olist_orders_dataset.csv` → already loaded as `orders`
- `olist_order_payments_dataset.csv` → already loaded as `payments`
- `olist_customers_dataset.csv` → load as `customers`

**Columns used from `customers`:**

| Column | Data Type | What It Means |
|---|---|---|
| `customer_id` | VARCHAR(40) | Links to orders table |
| `customer_unique_id` | VARCHAR(40) | The true customer identifier (one person can have multiple customer_ids) |
| `customer_city` | VARCHAR(50) | City |
| `customer_state` | VARCHAR(4) | State abbreviation |

> **Important:** In the Olist schema, `customer_id` is per-order, not per-person. To count real unique customers, you must use `customer_unique_id`. This is a common trap — catching it shows analytical maturity.

**Create and load the customers table:**

```sql
CREATE TABLE customers (
    customer_id VARCHAR(40),
    customer_unique_id VARCHAR(40),
    customer_zip_code_prefix VARCHAR(10),
    customer_city VARCHAR(50),
    customer_state VARCHAR(4)
);

LOAD DATA INFILE '/path/to/olist_customers_dataset.csv'
INTO TABLE customers FIELDS TERMINATED BY ','
ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
```

---

## Step-by-Step Build

### Step 1 — Build the RFM Base Table in SQL (45 minutes)

```sql
-- RFM base query
-- Reference date: use the maximum purchase date in the dataset as "today"
-- Save as rfm-scoring.sql

SELECT
    c.customer_unique_id,
    MAX(o.order_purchase_timestamp) AS last_purchase_date,
    COUNT(DISTINCT o.order_id) AS frequency,
    SUM(p.payment_value) AS monetary,
    DATEDIFF(
        (SELECT MAX(order_purchase_timestamp) FROM orders),
        MAX(o.order_purchase_timestamp)
    ) AS recency_days
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN payments p ON o.order_id = p.order_id
WHERE o.order_status = 'delivered'
  AND p.payment_value > 0
GROUP BY c.customer_unique_id;
```

**Sanity check:** You should get approximately 96,000–98,000 rows (unique customers with delivered orders). Each row should have `recency_days >= 0`, `frequency >= 1`, and `monetary > 0`. Run `SELECT MIN(recency_days), MAX(recency_days), MIN(monetary), MAX(monetary) FROM rfm_base;` — if you see negative recency or zero monetary values, your WHERE clause has a problem.

**Export:** In MySQL Workbench, save this query result as `rfm_base.csv`. This CSV is what you will load into Python.

---

### Step 2 — Set Up Your Python Environment (20 minutes)

If you do not already have Python and Jupyter installed:
1. Download Anaconda from https://www.anaconda.com/download (free, installs Python + Jupyter)
2. Open Anaconda Navigator → launch Jupyter Notebook
3. Navigate to your `lifecycle-segmentation/notebooks/` folder
4. Click **New → Python 3** to create a new notebook
5. Rename it `rfm-segmentation.ipynb`

Install required libraries (run in a notebook cell):
```python
# Run this once to install libraries
import subprocess
subprocess.run(["pip", "install", "pandas", "matplotlib", "seaborn"])
```

---

### Step 3 — Load the Data and Inspect It (15 minutes)

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the CSV you exported from MySQL
df = pd.read_csv('../exports/rfm_base.csv')

# Inspect the data
print(df.shape)          # Should show (~96000, 5)
print(df.dtypes)         # Check column types
print(df.head(10))       # Look at first 10 rows
print(df.describe())     # Statistics: min, max, mean, quartiles

# Check for missing values
print(df.isnull().sum())  # Should all be 0 after the WHERE clause filters
```

---

### Step 4 — Assign RFM Scores (45 minutes)

RFM scoring assigns each customer a score from 1–5 on each dimension. The logic:
- **Recency:** LOWER days = BETTER (recent buyer). Score 5 = most recent quintile.
- **Frequency:** HIGHER count = BETTER. Score 5 = most frequent quintile.
- **Monetary:** HIGHER spend = BETTER. Score 5 = highest spend quintile.

```python
# Assign quintile scores (1-5) for each RFM dimension

# Recency: lower days = better, so reverse the scoring with labels reversed
df['R_score'] = pd.qcut(df['recency_days'], q=5, labels=[5, 4, 3, 2, 1])

# Frequency: higher = better
df['F_score'] = pd.qcut(df['frequency'].rank(method='first'), q=5, labels=[1, 2, 3, 4, 5])

# Monetary: higher = better
df['M_score'] = pd.qcut(df['monetary'].rank(method='first'), q=5, labels=[1, 2, 3, 4, 5])

# Convert scores to integers
df['R_score'] = df['R_score'].astype(int)
df['F_score'] = df['F_score'].astype(int)
df['M_score'] = df['M_score'].astype(int)

# Create composite RFM score (concatenated string for segment lookup)
df['RFM_group'] = df['R_score'].astype(str) + df['F_score'].astype(str) + df['M_score'].astype(str)

# Create numeric RFM total for sorting
df['RFM_total'] = df['R_score'] + df['F_score'] + df['M_score']

# Sanity check: all scores should be 1-5
print(df[['R_score','F_score','M_score']].describe())
print(df['RFM_total'].value_counts().sort_index())
```

> **Why `rank(method='first')` for F and M scores?** Frequency and monetary columns often have many duplicate values (most customers ordered once). `pd.qcut` fails when there are too many duplicates. Using `.rank(method='first')` assigns unique ranks before splitting into quintiles, avoiding this error.

---

### Step 5 — Assign Named Segments (30 minutes)

```python
# Define a function that maps R_score + F_score combinations to segment names
# This is a simplified but industry-standard mapping

def assign_segment(row):
    r = row['R_score']
    f = row['F_score']
    m = row['M_score']
    
    if r >= 4 and f >= 4:
        return 'Champions'
    elif r >= 3 and f >= 3:
        return 'Loyal Customers'
    elif r >= 4 and f <= 2:
        return 'New Customers'
    elif r >= 3 and f <= 2 and m >= 3:
        return 'Potential Loyalists'
    elif r == 3 and f >= 3:
        return 'Customers Needing Attention'
    elif r <= 2 and f >= 3:
        return 'At Risk'
    elif r == 1 and f >= 4:
        return 'Cannot Lose Them'
    elif r <= 2 and f <= 2:
        return 'Lost'
    else:
        return 'Hibernating'

df['segment'] = df.apply(assign_segment, axis=1)

# See the distribution of segments
segment_counts = df['segment'].value_counts()
print(segment_counts)

# Calculate average R, F, M per segment (this becomes your segment profile cards)
segment_profiles = df.groupby('segment').agg(
    customer_count=('customer_unique_id', 'count'),
    avg_recency_days=('recency_days', 'mean'),
    avg_frequency=('frequency', 'mean'),
    avg_monetary=('monetary', 'mean'),
    total_revenue=('monetary', 'sum')
).round(2).sort_values('total_revenue', ascending=False)

print(segment_profiles)
```

---

### Step 6 — Build the Visualizations (60 minutes)

**Visualization 1: RFM Scatter (Quadrant Chart)**

```python
fig, ax = plt.subplots(figsize=(10, 8))

# Map segments to colors
color_map = {
    'Champions': '#2ecc71',
    'Loyal Customers': '#27ae60',
    'New Customers': '#3498db',
    'Potential Loyalists': '#1abc9c',
    'Customers Needing Attention': '#f39c12',
    'At Risk': '#e74c3c',
    'Cannot Lose Them': '#c0392b',
    'Lost': '#7f8c8d',
    'Hibernating': '#95a5a6'
}

for segment, group in df.groupby('segment'):
    ax.scatter(
        group['F_score'],
        group['R_score'],
        label=segment,
        alpha=0.5,
        s=20,
        color=color_map.get(segment, '#333333')
    )

ax.set_xlabel('Frequency Score (1=Low, 5=High)', fontsize=12)
ax.set_ylabel('Recency Score (1=Old, 5=Recent)', fontsize=12)
ax.set_title('Customer Lifecycle Segments — RFM Quadrant', fontsize=14)
ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
plt.tight_layout()
plt.savefig('../screenshots/01-rfm-quadrant.png', dpi=150, bbox_inches='tight')
plt.show()
```

**Visualization 2: Segment Heatmap**

```python
# Pivot: average monetary value for each R_score x F_score combination
heatmap_data = df.groupby(['R_score', 'F_score'])['monetary'].mean().unstack()

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    heatmap_data,
    annot=True,
    fmt='.0f',
    cmap='YlOrRd',
    ax=ax,
    cbar_kws={'label': 'Avg. Revenue (R$)'}
)
ax.set_title('Average Revenue by Recency x Frequency Score', fontsize=13)
ax.set_xlabel('Frequency Score')
ax.set_ylabel('Recency Score')
plt.tight_layout()
plt.savefig('../screenshots/02-segment-heatmap.png', dpi=150, bbox_inches='tight')
plt.show()
```

**Visualization 3: Segment Bar Chart (Count by Segment)**

```python
fig, ax = plt.subplots(figsize=(10, 6))
segment_counts.sort_values().plot(kind='barh', ax=ax, color='steelblue')
ax.set_title('Customer Count by Segment', fontsize=13)
ax.set_xlabel('Number of Customers')
ax.set_ylabel('Segment')
for i, v in enumerate(segment_counts.sort_values()):
    ax.text(v + 100, i, str(v), va='center')
plt.tight_layout()
plt.savefig('../screenshots/03-segment-bar-count.png', dpi=150, bbox_inches='tight')
plt.show()
```

---

### Step 7 — Export Segment Profiles and Save (15 minutes)

```python
# Export the full segmented customer list
df.to_csv('../exports/rfm_segments.csv', index=False)

# Export the summary profile table
segment_profiles.to_csv('../exports/rfm_segment_profiles.csv')

print("Files saved successfully.")
print(f"Total customers segmented: {len(df):,}")
```

---

## Deliverables Checklist

- [ ] `case-studies/lifecycle-segmentation/sql/rfm-scoring.sql`
- [ ] `case-studies/lifecycle-segmentation/notebooks/rfm-segmentation.ipynb`
- [ ] `case-studies/lifecycle-segmentation/exports/rfm_base.csv`
- [ ] `case-studies/lifecycle-segmentation/exports/rfm_segments.csv`
- [ ] `case-studies/lifecycle-segmentation/exports/rfm_segment_profiles.csv`
- [ ] `case-studies/lifecycle-segmentation/screenshots/01-rfm-quadrant.png`
- [ ] `case-studies/lifecycle-segmentation/screenshots/02-segment-heatmap.png`
- [ ] `case-studies/lifecycle-segmentation/screenshots/03-segment-bar-count.png`
- [ ] `case-studies/lifecycle-segmentation/screenshots/04-segment-profiles-table.png`
- [ ] `case-studies/lifecycle-segmentation/README.md`

---

## Visualizations to Include

1. **RFM Quadrant Scatter Plot** — R_score on Y-axis, F_score on X-axis, colored by segment. High-right = Champions, low-left = Lost. Makes the concept immediately visible.
2. **Segment Heatmap** — Average revenue per cell in an R×F matrix. Shows which combinations are most valuable. This is the "money chart" — recruiters love seeing heatmaps because they imply you understand two-dimensional analysis.
3. **Segment Count Bar Chart** — Horizontal bars showing how many customers fall into each segment. Contextualizes scale (e.g., "At Risk has 8,000 customers — that is 8% of the base").
4. **Segment Profile Cards** — A printed/formatted table (or styled Jupyter output) showing the average recency, frequency, and monetary values for each segment. Take a screenshot of this output — it tells the same story as a chart but more precisely.

---

## Screenshots to Capture

1. **RFM quadrant scatter plot** — Full chart with legend visible. This is the hero visual for this case study.
2. **Segment heatmap** — The R×F grid with monetary values annotated in each cell.
3. **Segment count bar chart** — The horizontal bars showing distribution across segments.
4. **Segment profiles table** — The `segment_profiles` DataFrame printed in Jupyter, showing customer count, avg recency, avg frequency, avg monetary, and total revenue for each segment.
5. **Jupyter notebook structure** — A screenshot showing the full notebook with section headers and code cells visible (collapsed or expanded). This demonstrates clean, documented work.

---

## Narrative Outline for the Case Study HTML Page

**Problem section:**
> "A flat customer list is not useful. A segmented customer list tells you who to email, who to win back, who to reward, and who to stop spending money on. This project segments 96,000 Olist customers using the industry-standard RFM framework — the same logic used by every major retail loyalty program."

**What I Built section:**
> "I wrote a SQL query to calculate each customer's recency, frequency, and monetary values from the raw order data. I then used Python and pandas to assign quintile scores, label each customer into one of nine behavioral segments, and visualize the distribution. The output is a segmentation file that a CRM team could import tomorrow."

**Key Insights section (fill in with your actual numbers):**
> "Champions — the top [N] customers by RFM total — represent only [X]% of the base but account for [Y]% of total revenue. The At Risk segment contains [N] customers who averaged [X] orders historically but have not purchased in [Y] days. A targeted win-back campaign for this group has the highest expected ROI because their previous behavior shows purchase intent."

**Recommendation section:**
> "Prioritize three segments for immediate action: (1) At Risk — send a win-back offer within 30 days; (2) Champions — enroll in a loyalty reward to defend retention; (3) New Customers with high monetary scores — trigger a second-purchase sequence within 14 days of their first order."

**Next Iteration section:**
> "The logical next step is building a model that predicts which active customers will enter the At Risk segment before they do — rather than responding after the fact. That is the goal of Case Study 3: Churn Early Warning."

---

## Time Estimate

| Task | Estimated Hours |
|---|---|
| MySQL table setup and RFM base query | 1.0 hr |
| Python environment setup (first time) | 0.5 hr |
| Building and validating RFM scoring code | 2.0 hr |
| Building 3 visualizations in Python | 2.0 hr |
| Exporting outputs and screenshots | 0.5 hr |
| Writing README and HTML page | 1.5 hr |
| **Total** | **~7.5 hours** |

---

## Stretch Goals

- Add a **geographic dimension**: does the RFM profile differ between customers in São Paulo vs. Rio de Janeiro vs. other states? Use `customer_state` from the customers table.
- Build a **Power BI RFM dashboard** showing the segment breakdown as a treemap (size = customer count, color = average monetary value)
- Experiment with **K-Means clustering** in Python as an alternative to rules-based RFM segmentation — compare whether the clusters align with your manual segments

---

---

# Case Study 3: Churn Early Warning

**Difficulty:** Hard | **Tools:** Python + scikit-learn | **Type:** Predictive Analytics

---

## Overview

Churn Early Warning answers the hardest business question: which customers are about to stop buying before they actually do? You will build a binary classification model that takes customer behavioral features as input and outputs a probability score of churning. This project demonstrates machine learning skills — the hardest technical skill in this portfolio — and shows you can communicate model outputs in business terms (risk scores, confusion matrix, feature importance).

## Skills Demonstrated

- Feature engineering: creating predictive variables from raw transactional data
- Python scikit-learn: train/test split, logistic regression, XGBoost, model evaluation
- Model evaluation: confusion matrix, precision, recall, F1 score, ROC-AUC
- Data visualization: matplotlib confusion matrix heatmap, feature importance bar chart, score distribution histogram
- Business translation: turning a probability score into an actionable risk tier

---

## Dataset & Setup

**Tables used:** All previously loaded tables — `orders`, `customers`, `payments`, `reviews`

**You will also load `olist_order_reviews_dataset.csv`:**

| Column | Data Type | What It Means |
|---|---|---|
| `review_id` | VARCHAR(40) | Unique review identifier |
| `order_id` | VARCHAR(40) | Links to orders |
| `review_score` | INT | 1–5 star rating |
| `review_creation_date` | DATETIME | When review was submitted |

```sql
CREATE TABLE reviews (
    review_id VARCHAR(40),
    order_id VARCHAR(40),
    review_score INT,
    review_comment_title VARCHAR(255),
    review_comment_message TEXT,
    review_creation_date DATETIME,
    review_answer_timestamp DATETIME
);

LOAD DATA INFILE '/path/to/olist_order_reviews_dataset.csv'
INTO TABLE reviews FIELDS TERMINATED BY ','
ENCLOSED BY '"' LINES TERMINATED BY '\n' IGNORE 1 ROWS;
```

---

## Conceptual Explanation: What Is "Churn" in This Dataset?

The Olist dataset does not have a "churned" flag. You must **define churn** and then **engineer the label**. Here is the definition you will use:

> A customer has churned if they made at least one order before a cutoff date AND did NOT make any order in the 90 days following that cutoff.

**Cutoff date:** Use `2018-06-01` as your reference point. This gives you two windows:
- **Observation window:** everything before `2018-06-01` — use this to build features
- **Outcome window:** `2018-06-01` to `2018-08-31` — use this to label churned vs. active

This approach is called a **train/label split** and is the correct way to build churn models on transactional data. Every customer who had at least one order before the cutoff is in your model population. Their churn label is whether they returned in the 90-day outcome window.

---

## Step-by-Step Build

### Step 1 — Build the Feature Table in SQL (60 minutes)

Each row is one customer. The columns are behavioral features measured up to the cutoff date.

```sql
-- Save as churn-features.sql
-- Reference date: 2018-06-01

SELECT
    c.customer_unique_id,

    -- Recency: days since last purchase (as of cutoff)
    DATEDIFF('2018-06-01', MAX(o.order_purchase_timestamp)) AS recency_days,

    -- Frequency: total number of orders before cutoff
    COUNT(DISTINCT o.order_id) AS order_count,

    -- Monetary: total spend before cutoff
    SUM(p.payment_value) AS total_spend,

    -- Average order value
    AVG(p.payment_value) AS avg_order_value,

    -- Review behavior: average review score (proxy for satisfaction)
    AVG(r.review_score) AS avg_review_score,

    -- Days between first and last order (customer lifespan)
    DATEDIFF(
        MAX(o.order_purchase_timestamp),
        MIN(o.order_purchase_timestamp)
    ) AS customer_lifespan_days,

    -- Payment method diversity (count of distinct payment types used)
    COUNT(DISTINCT p.payment_type) AS distinct_payment_types,

    -- Churn label: 1 = churned (no orders in outcome window), 0 = retained
    MAX(CASE
        WHEN o.order_purchase_timestamp >= '2018-06-01'
         AND o.order_purchase_timestamp < '2018-09-01'
        THEN 0 ELSE 1
    END) AS churned

FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN payments p ON o.order_id = p.order_id
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_purchase_timestamp < '2018-06-01'
  AND o.order_status = 'delivered'
  AND p.payment_value > 0
GROUP BY c.customer_unique_id
HAVING COUNT(DISTINCT o.order_id) >= 1;
```

**Sanity check after exporting as `churn_features.csv`:**
- Row count should be in the range of 50,000–80,000 (customers active before the cutoff)
- `churned` column should be either 0 or 1
- Run `SELECT churned, COUNT(*) FROM churn_features GROUP BY churned;` — expect ~85–95% churned (this is normal for e-commerce; most customers do not repeat)
- If you see >99% churn, check your date window — the dataset ends in late 2018, so a June cutoff with a 90-day window captures real repeat buyers

---

### Step 2 — Load Data and Explore in Python (30 minutes)

Open or create `churn-model.ipynb` in your `churn-early-warning/notebooks/` folder.

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    confusion_matrix, classification_report,
    roc_auc_score, ConfusionMatrixDisplay
)
from sklearn.preprocessing import StandardScaler

# Load the feature table
df = pd.read_csv('../exports/churn_features.csv')

print(df.shape)
print(df.dtypes)
print(df.isnull().sum())   # Check for missing values
print(df['churned'].value_counts(normalize=True))  # Check class balance
print(df.describe())
```

**Expected output for class balance:** Something like `1 (churned): 0.87, 0 (retained): 0.13`. This class imbalance is important — it means accuracy alone is a misleading metric. A model that always predicts "churned" would be 87% accurate but completely useless. You will address this with `class_weight='balanced'` in the next step.

---

### Step 3 — Prepare Features for Modeling (20 minutes)

```python
# Handle missing values (avg_review_score will have nulls for customers who never reviewed)
df['avg_review_score'] = df['avg_review_score'].fillna(df['avg_review_score'].median())

# Define feature columns and target
feature_cols = [
    'recency_days',
    'order_count',
    'total_spend',
    'avg_order_value',
    'avg_review_score',
    'customer_lifespan_days',
    'distinct_payment_types'
]

X = df[feature_cols]
y = df['churned']

# Train/test split: 80% train, 20% test, stratified to preserve class balance
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {X_train.shape[0]:,} rows")
print(f"Test set: {X_test.shape[0]:,} rows")
print(f"Churn rate in test set: {y_test.mean():.2%}")

# Scale features (required for logistic regression; good practice for all models)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

---

### Step 4 — Train Logistic Regression (Baseline Model) (30 minutes)

Start with the simplest model. This is good practice — always establish a baseline before reaching for complex models.

```python
# Logistic regression with class_weight='balanced' to handle imbalance
lr_model = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
lr_model.fit(X_train_scaled, y_train)

# Predict on test set
y_pred_lr = lr_model.predict(X_test_scaled)
y_prob_lr = lr_model.predict_proba(X_test_scaled)[:, 1]

# Evaluate
print("=== Logistic Regression Results ===")
print(classification_report(y_test, y_pred_lr, target_names=['Retained', 'Churned']))
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob_lr):.4f}")
```

**What to look for:** Focus on **recall for the Churned class** (shown in the classification report as recall next to "Churned"). A high recall means the model catches most churners — which is what you want. Precision will be lower because the model also flags some retained customers as churners, but that is acceptable.

---

### Step 5 — Train Gradient Boosting Model (45 minutes)

```python
# Gradient Boosting — more powerful, handles non-linear patterns
gb_model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=4,
    random_state=42
)
gb_model.fit(X_train, y_train)   # GBM does not require scaling

y_pred_gb = gb_model.predict(X_test)
y_prob_gb = gb_model.predict_proba(X_test)[:, 1]

print("=== Gradient Boosting Results ===")
print(classification_report(y_test, y_pred_gb, target_names=['Retained', 'Churned']))
print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob_gb):.4f}")
```

> **Note:** GradientBoostingClassifier is part of scikit-learn and does not require installing XGBoost separately. It uses the same boosting principle. If you want to try XGBoost later, install it with `pip install xgboost` and replace `GradientBoostingClassifier` with `xgb.XGBClassifier`. For the portfolio, either works fine.

---

### Step 6 — Build the Visualizations (60 minutes)

**Visualization 1: Confusion Matrix**

```python
fig, ax = plt.subplots(figsize=(6, 5))
cm = confusion_matrix(y_test, y_pred_gb)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['Retained', 'Churned'])
disp.plot(ax=ax, colorbar=False, cmap='Blues')
ax.set_title('Confusion Matrix — Gradient Boosting Model', fontsize=13)
plt.tight_layout()
plt.savefig('../screenshots/01-confusion-matrix.png', dpi=150, bbox_inches='tight')
plt.show()
```

**Visualization 2: Feature Importance**

```python
feature_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': gb_model.feature_importances_
}).sort_values('importance', ascending=True)

fig, ax = plt.subplots(figsize=(8, 5))
ax.barh(feature_importance['feature'], feature_importance['importance'], color='steelblue')
ax.set_title('Feature Importance — What Drives Churn Prediction', fontsize=13)
ax.set_xlabel('Importance Score')
plt.tight_layout()
plt.savefig('../screenshots/02-feature-importance.png', dpi=150, bbox_inches='tight')
plt.show()
```

**Visualization 3: Churn Risk Score Distribution**

```python
fig, ax = plt.subplots(figsize=(9, 5))
ax.hist(y_prob_gb[y_test == 0], bins=40, alpha=0.6, label='Retained', color='#2ecc71')
ax.hist(y_prob_gb[y_test == 1], bins=40, alpha=0.6, label='Churned', color='#e74c3c')
ax.axvline(x=0.5, color='black', linestyle='--', linewidth=1.2, label='Decision Threshold (0.5)')
ax.set_title('Churn Probability Score Distribution by Actual Outcome', fontsize=13)
ax.set_xlabel('Predicted Churn Probability')
ax.set_ylabel('Number of Customers')
ax.legend()
plt.tight_layout()
plt.savefig('../screenshots/03-risk-score-distribution.png', dpi=150, bbox_inches='tight')
plt.show()
```

---

### Step 7 — Assign Risk Tiers and Export Scores (20 minutes)

```python
# Assign risk tiers based on churn probability
risk_df = df[['customer_unique_id']].copy()
risk_df['churn_probability'] = y_prob_gb  # Note: index alignment — see below

# IMPORTANT: Re-run the feature prep to get X_test aligned with the original df
# Or use a full-dataset prediction (recommended for export):
y_prob_full = gb_model.predict_proba(df[feature_cols])[:, 1]
risk_df = df[['customer_unique_id', 'recency_days', 'order_count', 'total_spend', 'churned']].copy()
risk_df['churn_probability'] = y_prob_full

def assign_risk_tier(prob):
    if prob >= 0.80:
        return 'High Risk'
    elif prob >= 0.60:
        return 'Medium Risk'
    elif prob >= 0.40:
        return 'Low Risk'
    else:
        return 'Safe'

risk_df['risk_tier'] = risk_df['churn_probability'].apply(assign_risk_tier)

# Summary by tier
print(risk_df['risk_tier'].value_counts())
print(risk_df.groupby('risk_tier')['total_spend'].mean().round(2))

# Export
risk_df.to_csv('../exports/churn_risk_scores.csv', index=False)
print("Churn risk scores exported.")
```

---

## Deliverables Checklist

- [ ] `case-studies/churn-early-warning/notebooks/churn-model.ipynb`
- [ ] `case-studies/churn-early-warning/sql/churn-features.sql`
- [ ] `case-studies/churn-early-warning/exports/churn_features.csv`
- [ ] `case-studies/churn-early-warning/exports/churn_risk_scores.csv`
- [ ] `case-studies/churn-early-warning/screenshots/01-confusion-matrix.png`
- [ ] `case-studies/churn-early-warning/screenshots/02-feature-importance.png`
- [ ] `case-studies/churn-early-warning/screenshots/03-risk-score-distribution.png`
- [ ] `case-studies/churn-early-warning/screenshots/04-model-summary-card.png`
- [ ] `case-studies/churn-early-warning/README.md`

---

## Visualizations to Include

1. **Confusion Matrix Heatmap** — Shows true positives, false positives, true negatives, false negatives in a 2×2 grid. Annotate it with plain-English labels: "Correctly Identified Churners", "Missed Churners", etc.
2. **Feature Importance Bar Chart** — Horizontal bars showing which input variables have the most predictive power. This is the most business-relevant visual because it answers "what actually causes churn?"
3. **Risk Score Distribution Histogram** — Overlapping histograms of churn probability for retained vs. churned customers. A good model will show clear separation between the two distributions. This is the visual proof that the model works.
4. **Model Summary Card** — A simple table (print it in Jupyter and screenshot it) showing: Algorithm, ROC-AUC, Precision, Recall, F1 for the Churned class. A recruiter who reviews ML portfolios will look for this immediately.

---

## Screenshots to Capture

1. **Confusion matrix heatmap** — Annotated with what each quadrant means in plain English.
2. **Feature importance bar chart** — With `recency_days` likely at the top (it almost always is in churn models).
3. **Risk score distribution** — The overlapping histogram showing model separation.
4. **Model summary output** — The printed `classification_report()` output in Jupyter, showing precision, recall, F1 for both classes.
5. **Notebook table of contents view** — The collapsed notebook showing your section structure. Demonstrates clean, professional documentation.

---

## Narrative Outline for the Case Study HTML Page

**Problem section:**
> "By the time a customer's purchase frequency drops off, the cost of winning them back has already risen. The goal is to identify customers likely to churn while they are still active — so retention spend is targeted and timely. This project builds a binary classification model to score every customer with a churn probability."

**What I Built section:**
> "I engineered seven behavioral features from the Olist transaction history — recency, frequency, monetary value, review scores, customer lifespan, and payment diversity. I defined churn as no purchase in the 90 days following a June 2018 cutoff, then trained a Gradient Boosting classifier on 80% of the data and evaluated it on the held-out 20%. The model outputs a probability score and a risk tier (High / Medium / Low / Safe) for every customer."

**Key Insights section (fill in with your actual numbers):**
> "The model achieves a ROC-AUC of [X], meaning it correctly separates churners from retained customers [X]% better than random chance. Recency was the strongest predictor — customers who have not purchased in 90+ days have a median churn probability of [X]%. Low review scores (below 3 stars) added [X] percentage points of churn probability above the baseline."

**Recommendation section:**
> "The High Risk tier contains [N] customers with an average lifetime spend of R$[X]. A targeted retention campaign for this group — even a modest 10% save rate — recovers an estimated R$[X] in revenue. The model should be re-run monthly on new order data to keep risk scores current."

**Next Iteration section:**
> "Future model improvements: (1) Add delivery time as a feature — late deliveries correlate with low review scores and likely churn; (2) Test a recency-weighted feature that counts orders in the last 30/60/90 days separately; (3) Tune the decision threshold to optimize for recall over precision, depending on the cost structure of the retention campaign."

---

## Time Estimate

| Task | Estimated Hours |
|---|---|
| SQL feature engineering and export | 1.5 hr |
| Python data loading, exploration, cleaning | 1.0 hr |
| Training and evaluating both models | 2.0 hr |
| Building 3 visualizations | 2.0 hr |
| Exporting risk scores and documentation | 0.5 hr |
| Writing README and HTML page | 2.0 hr |
| **Total** | **~9 hours** |

---

## Stretch Goals

- **Threshold tuning:** Instead of using 0.5 as the decision threshold, plot a precision-recall curve and pick the threshold that maximizes F1 score. Add a line to your screenshots showing this analysis.
- **SHAP values:** Install `shap` (`pip install shap`) and generate a SHAP summary plot — it shows not just which features matter, but how their values (high vs. low) affect the prediction direction.
- **Time-series validation:** Instead of a random train/test split, use an earlier cutoff date for training (e.g., March 2018) and a later one for testing (June 2018). This is more realistic because in production you always train on past data and predict on future customers.

---

---

# Capstone: Growth Ops Command Center

After completing all three case studies, you will have three separate analytical outputs: a funnel dashboard in Power BI, a segmented customer file, and a churn risk score file. The Capstone ties them together into a single executive-facing dashboard — a "command center" that a VP of Growth or a Chief Revenue Officer could open every Monday morning to see the state of the business.

The command center pulls one KPI from each case study: **Funnel Conversion Rate** (what percentage of orders are reaching delivery), **Segment Health Score** (the ratio of Champions and Loyal Customers to At Risk and Lost customers), and **Churn Risk Exposure** (the total revenue represented by High Risk customers as a percentage of total customer value). These three numbers, shown side-by-side in a single Power BI report, tell the complete growth story: are we converting new customers, are we retaining them, and are we catching those who are about to leave?

The Capstone is intentionally saved for last because it is not a new analysis — it is a synthesis of existing analyses. You cannot build it until the underlying work exists. When you do build it, load the three exported CSVs (`funnel_dropoff.csv`, `rfm_segments.csv`, `churn_risk_scores.csv`) directly into a new Power BI file and build a three-KPI summary page with drill-through links to the individual dashboards. Add a text box with a one-paragraph "executive briefing" that could be sent in a Monday morning email. Save it as `command-center.pbix`.

---

# Suggested Timeline

This timeline assumes you are working part-time on the portfolio — roughly 8–12 hours per week alongside your certification coursework.

| Week | Focus | Target Deliverable |
|---|---|---|
| Week 1 | Dataset download, MySQL setup, baseline sanity checks | Olist loaded into MySQL with all 6 tables; row counts verified |
| Week 2 | Funnel Leak Finder — SQL queries + Power BI build | `funnel.pbix` complete; 4 screenshots captured |
| Week 3 | Funnel Leak Finder — write-up + HTML page | Case Study 1 live on the portfolio site |
| Week 4 | Lifecycle Segmentation — SQL base query + Python setup | `rfm_base.csv` exported; Jupyter notebook running |
| Week 5 | Lifecycle Segmentation — RFM scoring + visualizations | 4 charts complete; `rfm_segments.csv` exported |
| Week 6 | Lifecycle Segmentation — write-up + HTML page | Case Study 2 live on the portfolio site |
| Week 7 | Churn Early Warning — feature engineering + model training | Both models trained and evaluated; `classification_report` printed |
| Week 8 | Churn Early Warning — visualizations + risk scores | 4 screenshots captured; `churn_risk_scores.csv` exported |
| Week 9 | Churn Early Warning — write-up + HTML page | Case Study 3 live on the portfolio site |
| Week 10 | Capstone: Growth Ops Command Center | `command-center.pbix` complete; portfolio fully linked |

**Total estimated calendar time:** 10 weeks at ~10 hours/week = ~100 hours of focused work. This is a realistic estimate for someone balancing this portfolio with the Google Data Analytics certification and a full-time job. The time estimates within each case study are for focused working sessions, not calendar days.

One final note: do not wait until everything is perfect to commit to GitHub. Commit after every completed SQL query, every saved notebook, every screenshot. A recruiter who sees regular commit history understands you built this incrementally and professionally — exactly how real analytics work is done.

---

*Build plan version 1.0 — Jeffrey Greene | Double-Doozie Growth Analytics Portfolio*
*Reference dataset: Brazilian E-Commerce by Olist — https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce*
