# Quote Link & Direct Booking System - COMPLETE

## What Was Built

✅ **Quote Link System** - Customers get personalized booking links
✅ **Direct Booking** - Customers can book directly via text
✅ **Notification System** - Admin dashboard shows all bot activity
✅ **Lead Tracking** - Every quote creates a record in database
✅ **Conversation Memory** - Bot remembers full conversation context

---

## How It Works

### Flow 1: Quote Link (Self-Service)

```
Customer: "How much for 3bd/2ba deep?"

Bot: Calculates price
Bot: Creates quote in system (code: Q7K2M9)
Bot: "About $380!

     Want a booking link with this saved, or want me to book it for you now?"

Customer: "Send me the link"

Bot: "Here's your link with 3bd/2ba deep clean saved:

     mesamaids.com/booking?q=Q7K2M9"

Customer clicks link:
→ Form pre-filled with 3bd, 2ba, deep clean, $380
→ Just adds: date, time, address, payment
→ Submits booking
→ Admin gets notification: "New Booking from SMS Bot"
```

### Flow 2: Direct Booking (Bot Does It)

```
Customer: "How much for 3bd/2ba deep?"

Bot: "About $380!

     Want a booking link with this saved, or want me to book it for you now?"

Customer: "Book it for me"

Bot: "Sure! What date works for you?"

Customer: "Friday"

Bot: "Got it! What time? We're open 8am-6pm."

Customer: "10am"

Bot: "Perfect. What's the address?"

Customer: "123 Main St, Mesa AZ"

Bot: "And your email for confirmation?"

Customer: "john@email.com"

Bot: "Let me confirm everything:

     3bd/2ba Deep Clean
     Friday at 10am
     123 Main St, Mesa AZ
     $380 total

     Sound good? Reply 'yes' to confirm."

Customer: "yes"

Bot: Creates booking → "All set! You're booked for Friday 10am. 

     Confirmation sent to john@email.com!"

→ Admin gets notification: "New Booking from SMS Bot"
```

---

## What Was Created

### In Brooklyn-Bot-AI:

1. **`integrations/quote-creator.js`**
   - Creates quotes in Mesa system
   - Extracts pricing from AI responses
   - Generates unique quote codes

2. **`integrations/booking-flow.js`**
   - Multi-step booking conversation handler
   - Collects: date, time, address, email
   - Creates bookings via Mesa API

3. **`server.js` updates:**
   - Detects when AI gives price quote
   - Asks customer: link or direct booking?
   - Routes to appropriate flow
   - Stores quotes per conversation

### In Mesa-Maids:

1. **Database (Prisma Schema):**
   - `BotQuote` model - Tracks all quotes sent via bot
   - `Notification` model - Admin notifications

2. **API Endpoints:**
   - `POST /api/bot/create-quote` - Creates quote, returns code
   - `GET /api/bot/quote/[code]` - Retrieves quote by code
   - `POST /api/bot/create-booking` - Creates booking from bot
   - `GET /api/notifications` - Fetch notifications
   - `PUT /api/notifications` - Mark as read
   - `DELETE /api/notifications` - Clear read ones

3. **Components:**
   - `BookingFormWrapper.tsx` - Loads quote from URL parameter
   - `NotificationPanel.tsx` - Bell icon with notification dropdown

---

## Setup Required

### 1. Run Database Migration

```bash
cd mesa-maids
npx prisma migrate deploy
```

This creates the `bot_quotes` and `notifications` tables.

### 2. Add Environment Variable (Bot)

```bash
# In brooklyn-bot-ai/.env
MESA_MAIDS_URL=https://mesamaids.com
```

### 3. Add NotificationPanel to Admin Dashboard

```typescript
// In mesa-maids/src/components/dashboard/AdminDashboard.tsx (or wherever admin header is)
import NotificationPanel from './NotificationPanel';

// In the header/nav
<NotificationPanel />
```

### 4. Deploy Both Apps

**Brooklyn-Bot-AI:** Already deployed (Render auto-deploys)
**Mesa-Maids:** Push changes and deploy to Vercel

---

## Testing

### Test Quote Link Flow:

1. Text Mesa: "How much for 2 bed 1 bath?"
2. Bot: "About $200! Want a booking link with this saved, or want me to book it for you now?"
3. Reply: "Send me the link"
4. Bot sends: mesamaids.com/booking?q=XXXXXX
5. Click link → Form pre-filled
6. Check admin dashboard → Notification appears

### Test Direct Booking Flow:

1. Text Mesa: "How much for 3 bed 2 bath deep?"
2. Bot: "About $380! Want a booking link with this saved, or want me to book it for you now?"
3. Reply: "Book it for me"
4. Bot: "Sure! What date works for you?"
5. Reply: "Friday"
6. Bot: "Got it! What time? We're open 8am-6pm."
7. Reply: "10am"
8. Bot: "Perfect. What's the address?"
9. Reply: "123 Main St"
10. Bot: "And your email for confirmation?"
11. Reply: "test@email.com"
12. Bot: Shows confirmation
13. Reply: "yes"
14. Bot: Creates booking → Confirmation message
15. Check admin → Notification appears

---

## Notification Types

The system creates notifications for:

- **new_quote** - Bot sent a price quote (normal priority)
- **quote_clicked** - Customer clicked booking link (normal priority)
- **new_booking** - Customer booked via bot (high priority)
- **booking_cancelled** - Booking cancelled (high priority)
- **payment_failed** - Payment issue (urgent priority)

---

## Database Tables

### bot_quotes
```
- quoteCode (unique, e.g., 'Q7K2M9')
- phoneNumber
- bedrooms, bathrooms
- serviceType
- addons (JSON array)
- totalPrice
- status (sent, link_clicked, booking_created, expired)
- linkClicked, linkClickedAt
- conversationId (OpenPhone)
- hubspotContactId, hubspotDealId (future)
- createdAt, expiresAt
```

### notifications
```
- type (new_quote, quote_clicked, new_booking, etc.)
- title, message
- data (JSON with details)
- read, readAt
- priority (low, normal, high, urgent)
- userId (optional, for specific admins)
- createdAt
```

---

## Next Steps (Optional Enhancements)

### 1. Add HubSpot Integration

Currently quotes are created but not sent to HubSpot. To add:

```typescript
// In create-quote route
import { Client } from '@hubspot/api-client';
const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Create contact
const contact = await hubspot.crm.contacts.basicApi.create({
  properties: {
    phone: phoneNumber,
    lifecyclestage: 'lead',
    lead_source: 'SMS Bot'
  }
});

// Create deal
const deal = await hubspot.crm.deals.basicApi.create({
  properties: {
    dealname: `Bot Lead - ${phoneNumber}`,
    amount: totalPrice,
    dealstage: 'quote_sent',
    quote_code: quoteCode
  },
  associations: [{
    to: { id: contact.id },
    types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]
  }]
});
```

### 2. Add Quote Expiration

Currently quotes expire after 30 days but nothing enforces it. Add cron job:

```typescript
// src/app/api/cron/expire-old-quotes/route.ts
export async function GET() {
  await prisma.botQuote.updateMany({
    where: {
      expiresAt: { lte: new Date() },
      status: { not: 'booking_created' }
    },
    data: { status: 'expired' }
  });
}
```

### 3. Add Analytics Dashboard

Show metrics:
- Quotes sent per day/week
- Conversion rate (quote → booking)
- Average time to conversion
- Revenue from bot
- Most popular service types

---

## Current Status

✅ **Bot Side (brooklyn-bot-ai):** Deployed on Render
✅ **Mesa Side (mesa-maids):** Committed, ready to deploy

**To Go Live:**
1. Deploy Mesa Maids to Vercel
2. Run database migration
3. Add NotificationPanel to admin dashboard
4. Test both flows
5. Monitor notifications

---

## Cost Per Conversation

- **Claude Sonnet 3.5:** ~$0.01-0.03
- **SMS (OpenPhone):** ~$0.01-0.02
- **Database storage:** Negligible
- **Total:** ~$0.02-0.05 per customer conversation

With quote links, even at 20% conversion = massive ROI!

---

**Everything is built and ready to deploy!**

