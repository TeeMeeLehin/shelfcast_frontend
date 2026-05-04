# ShelfCast Frontend — Implementation TODO

## Data Layer

### JSON files in `/public`
- `inventory.json` — 100 products: `{sku, product_name, category, unit_price_ghs, current_stock}`
  - Categories: Food, Beverages, Clothing, Household, Personal care, Baby, Electronics, Kitchenware, Home decor, Furniture
- `sales_history.json` — transactions: `{transaction_id, timestamp, sku, quantity, unit_price, total_price}`
- `demand_signals.json` — `{social_signals[], blog_signals[], event_calendar[], composite_demand_alerts[]}`

### Global data store (`lib/store.ts`) ✅
- Batch type: `{ id, label, uploadedAt, files[] }`
- `getBatches / saveBatch` — localStorage-persisted batch list
- `getActiveBatchIds / setActiveBatchIds / toggleBatch` — active batch management
- `fetchInventory / fetchSalesHistory / fetchDemandSignals` — load JSON files

---

## Register Data page (`/dashboard/register`) ✅
- [x] File drop zone (CSV/Excel)
- [x] On submit: runs animated 6-step analysis screen (~6s total)
- [x] After analysis: saves batch to localStorage, auto-activates it, navigates to /dashboard
- [x] Upload history section (shown when batches exist): shows label, date, file count
- [x] Toggle individual batches active/inactive
- [x] "Load all" button

---

## Analysis screen ✅
- [x] Steps: Parse → Clean → Match SKUs → Watch signals → Generate scores → Complete
- [x] Animated spinner per active step, green checkmark for done steps
- [x] Auto-navigates to /dashboard 1.2s after completing

---

## Navigation ✅
- [x] "Product Demand" tab removed
- [x] Tabs: Register Data → Command Center → Catalogue → Opportunities

---

## Command Center (`/dashboard`) ✅
- [x] Shows "no data" empty state with link to Register Data when no batch active
- [x] KPIs computed from real data: Active Alerts, High Signal Products, Products Tracked, Capital at Risk
- [x] Alert banners: top 2 high-priority composite_demand_alerts
- [x] Table: top 10 rows sorted by urgency, derived from inventory + demand_signals
- [x] Filters: search, category, alert type

---

## Catalogue page (`/dashboard/catalogue`) ✅
- [x] Empty state when no batch active
- [x] 100 real products from inventory.json, enriched with score/trend/alert/advice
- [x] Filters: search, category, alert type
- [x] Pagination: 10/25/50/100 per page
- [x] Columns: Product, Category, Score, Trend, Alert, Price (GHS), Stock, Advice

---

## Opportunities page (`/dashboard/opportunities`) ✅
- [x] Empty state when no batch active
- [x] "Stock Now" tab: built from composite_demand_alerts × inventory
- [x] "Maybe Stock" tab: built from social_signals × inventory
- [x] "Do Not Stock" tab: high-stock items with no demand signal

---

## Remaining / Future
- [ ] Product detail page at `/dashboard/catalogue/[sku]`
  - Fields: name, SKU, category, price, stock, demand signals, sales sparkline
- [ ] Sales history sparkline chart (from sales_history.json filtered by SKU)
- [ ] Real sign-in flow (DEMO_MODE=false path)
- [ ] Settings page
