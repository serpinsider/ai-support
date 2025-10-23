# Integration with Live Mesa Maids Data

## What I Just Fixed

### ✅ Issue 1: Conversation Memory (FIXED)

The AI now:
- **Extracts context** automatically (property size, service type, add-ons)
- **Remembers** what was discussed earlier
- **Understands** follow-up questions like "what if it was standard" means same property
- **Tracks** add-ons mentioned and removed

**Example (now fixed):**
```
Customer: "How much for 2bed/1bath deep with fridge and oven?"
AI: "$290 total" ✓

Customer: "What if it was standard?"
AI: "For 2bed/1bath standard (without fridge/oven) it's $200" ✓
    (Used to say 3bed/2bath - WRONG)

Customer: "Add the fridge back"
AI: "2bed/1bath standard with fridge is $240" ✓
```

### 🔄 Issue 2: Live Data Integration (READY TO IMPLEMENT)

I created a framework to connect to your live Mesa Maids website. **Not active yet** - needs API endpoints on your site.

---

## How Conversation Memory Works Now

The AI now automatically extracts and tracks:

```javascript
{
  bedrooms: '2',              // From conversation
  bathrooms: '1',             // From conversation
  serviceType: 'Deep Clean',  // Tracks current service type
  addons: ['insideFridge', 'insideOven']  // What they asked for
}
```

When customer says "what if standard?" - it knows they mean same property (2bd/1ba).

---

## Setting Up Live Data Integration

### Step 1: Create API Endpoints on Mesa Maids Site

You need to add these endpoints to your Mesa Maids website (`/mesa-maids/src/app/api/`):

#### A. Quote API
**File:** `mesa-maids/src/app/api/bot-quote/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { bedrooms, bathrooms, serviceType, addons } = await request.json();
  
  // Use your existing quote calculation logic
  const quote = calculateQuote(bedrooms, bathrooms, serviceType, addons);
  
  return NextResponse.json({
    success: true,
    bedrooms,
    bathrooms,
    serviceType,
    basePrice: quote.basePrice,
    addonsPrice: quote.addonsPrice,
    totalPrice: quote.totalPrice,
    breakdown: quote.breakdown
  });
}
```

#### B. FAQ API
**File:** `mesa-maids/src/app/api/bot-faq/route.ts`

```typescript
import { NextResponse } from 'next/server';

// Your FAQ data (or fetch from database)
const FAQ = {
  'Do I need to be home?': 'No, most clients provide a key or code...',
  'What areas do you serve?': 'Mesa and surrounding Phoenix areas...',
  // ... all your FAQs
};

export async function GET() {
  return NextResponse.json({ success: true, faq: FAQ });
}
```

#### C. Checklist API
**File:** `mesa-maids/src/app/api/bot-checklist/[type]/route.ts`

```typescript
import { NextResponse } from 'next/server';

const CHECKLISTS = {
  'standard': ['Vacuum floors', 'Dust surfaces', 'Clean bathrooms', ...],
  'deep': ['All standard items', 'Baseboards', 'Detailed dusting', ...],
  // ...
};

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  const checklist = CHECKLISTS[params.type.toLowerCase()];
  return NextResponse.json({ success: true, checklist });
}
```

### Step 2: Enable Integration in Bot

Edit `brooklyn-bot-ai/config/integration-settings.js`:

```javascript
export const INTEGRATION_CONFIG = {
  useLiveData: true,  // Changed from false
  
  mesaMaidsUrl: 'https://mesamaids.com',
  
  dataSources: {
    faq: 'live',        // Use live FAQ
    pricing: 'live',    // Use live pricing
    checklist: 'live',  // Use live checklist
  }
};
```

### Step 3: Update Environment Variable

Add to Render environment variables:
```
MESA_MAIDS_URL=https://mesamaids.com
```

### Step 4: Deploy

```bash
git add -A
git commit -m "Enable live data integration"
git push
```

---

## What Live Integration Enables

### Real-Time Pricing
Instead of hardcoded prices, the AI fetches actual quotes from your site:
```
Customer: "How much for 3bd/2ba deep?"
Bot → Calls mesamaids.com/api/bot-quote
Bot → Gets real calculation: $340
Bot → "It's $340 for a 3bd/2ba deep clean"
```

### Live FAQ
If you update FAQ on your website, bot automatically uses new answers:
```javascript
// Before: FAQ hardcoded in bot
// After: FAQ fetched from mesamaids.com/api/bot-faq
```

### Service Checklists
Customer asks "What's in a deep clean?" → Bot fetches from your site

### Customer History (Future)
Look up customer's previous bookings:
```javascript
const customer = await lookupCustomer(phone);
// Returns: { name: 'John', lastBooking: '2024-10-01', recurring: true }
```

AI can say: "Welcome back John! Want to book your usual bi-weekly clean?"

---

## Testing Live Integration

### Test Quote API:
```bash
curl -X POST https://mesamaids.com/api/bot-quote \
  -H "Content-Type: application/json" \
  -d '{
    "bedrooms": "3",
    "bathrooms": "2",
    "serviceType": "Deep Clean",
    "addons": ["insideFridge"]
  }'
```

Should return:
```json
{
  "success": true,
  "basePrice": 340,
  "addonsPrice": 40,
  "totalPrice": 380,
  "breakdown": {...}
}
```

### Test FAQ API:
```bash
curl https://mesamaids.com/api/bot-faq
```

---

## Current Status

### ✅ Working Now:
- Conversation memory and context tracking
- Extracting property details from messages
- Following conversation flow correctly
- Understanding follow-up questions

### 🔧 Ready to Enable (needs API endpoints):
- Live pricing from your website
- Live FAQ updates
- Service checklists
- Customer lookup

### 📝 Future Enhancements:
- Check real availability calendar
- Create bookings directly from chat
- Send custom service links
- Personalized responses based on customer history

---

## Quick Test

Text Mesa number and try this conversation:

```
You: "How much for 2 bed 1 bath deep clean?"
Bot: "$290"

You: "What if standard?"
Bot: "$200 for 2bed/1bath standard" ✓ (remembers property size)

You: "Add inside fridge"
Bot: "$240 for 2bed/1bath standard with fridge" ✓ (remembers everything)
```

This should work now! The live data integration just needs API endpoints on your Mesa site.

---

## Need Help?

**Conversation memory not working?**
- Check Render logs - you should see "EXTRACTED CONTEXT" in the logs
- Make sure conversation history is being fetched

**Want to enable live data?**
- Create the API endpoints on Mesa Maids site first
- Test them with curl
- Then enable in integration-settings.js

