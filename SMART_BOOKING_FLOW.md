# Smart Booking Flow - Two Options for Customers

## The Customer Choice

After giving a price quote, bot asks:
```
"About $380! Want a booking link with this saved, or want me to book it for you now?"
```

Customer picks their preferred flow.

---

## Flow 1: Send Quote Link (Self-Service)

### Conversation:
```
Customer: "How much for 3bd/2ba deep?"

Bot: "About $380! Want a booking link with this saved, or want me to book it for you now?"

Customer: "Send me the link"

Bot: "Got it! Here's your link with 3bd/2ba deep clean saved: 

mesamaids.com/booking?q=Q7K2M9"
```

### What Happens:
1. Bot creates quote in system
2. Generates unique code (Q7K2M9)
3. Creates HubSpot contact + deal (stage: quote_sent)
4. Sends personalized link
5. When they click → form pre-filled
6. When they book → deal moves to closedwon

### Benefits:
- Customer books on their own time
- Form pre-filled (less friction)
- We track if they clicked but didn't book
- Can follow up on abandoned carts

---

## Flow 2: Direct Booking (Bot Does It)

### Full Conversation:
```
Customer: "How much for 3bd/2ba deep?"

Bot: "About $380! Want a booking link with this saved, or want me to book it for you now?"

Customer: "Book it for me"

Bot: "Sure! What date works for you?"

Customer: "Friday"

Bot: "Got it. What time? We have 8am, 10am, 12pm, 2pm, 4pm available."

Customer: "10am"

Bot: "Perfect. What's the address?"

Customer: "123 Main St, Mesa AZ 85201"

Bot: "And your email for confirmation?"

Customer: "john@email.com"

Bot: "Let me confirm everything:

- 3bd/2ba deep clean
- Friday at 10am  
- 123 Main St, Mesa
- $380 total

Sound good?"

Customer: "Yes"

Bot: Creates booking → "All set! You're booked for Friday 10am at 123 Main St. Confirmation sent to john@email.com. See you then!"
```

### What Happens:
1. Bot enters "booking mode"
2. Collects: date, time, address, email
3. Shows confirmation summary
4. Waits for "yes"
5. Creates booking in database
6. Creates HubSpot deal (closedwon immediately)
7. Sends confirmation email/SMS
8. Adds to calendar

### Benefits:
- Full automation - never leave text
- Captures customers who prefer texting over forms
- Higher conversion (no link drop-off)
- Instant gratification

---

## Implementation

### Part 1: Quote Link System (Build First - Simpler)

**Files to create:**

**In brooklyn-bot-ai:**
```javascript
// integrations/quote-creator.js
export async function createQuoteInMesaSystem(quoteData) {
  const response = await axios.post(
    'https://mesamaids.com/api/bot/create-quote',
    quoteData
  );
  return response.data; // { quoteCode, quoteId, hubspotDealId }
}
```

**In mesa-maids:**
```
src/app/api/bot/create-quote/route.ts
src/app/api/bot/quote/[code]/route.ts
```

**Database migration:**
```sql
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  quote_code VARCHAR(10) UNIQUE,
  phone_number VARCHAR(20),
  bedrooms VARCHAR(10),
  bathrooms VARCHAR(10),
  service_type VARCHAR(50),
  addons JSONB,
  total_price INTEGER,
  status VARCHAR(20) DEFAULT 'sent',
  hubspot_contact_id VARCHAR(50),
  hubspot_deal_id VARCHAR(50),
  link_clicked BOOLEAN DEFAULT false,
  link_clicked_at TIMESTAMP,
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Update booking page:**
- Read `?q=` parameter
- Fetch quote details
- Pre-fill form

**Estimated time:** 4-6 hours

---

### Part 2: Direct Booking (Build Second - More Complex)

**Add conversation state management:**

```javascript
// Track booking flow state
const bookingStates = new Map();

function startBookingFlow(conversationId, quoteDetails) {
  bookingStates.set(conversationId, {
    step: 'ask_date',
    quoteDetails,
    collectedData: {}
  });
}

function getBookingState(conversationId) {
  return bookingStates.get(conversationId);
}
```

**Multi-step conversation handler:**

```javascript
async function handleBookingFlow(message, conversationId) {
  const state = getBookingState(conversationId);
  
  switch(state.step) {
    case 'ask_date':
      // Parse date from message
      const date = parseDate(message.content);
      state.collectedData.date = date;
      state.step = 'ask_time';
      return "Got it. What time? We have 8am, 10am, 12pm, 2pm, 4pm available.";
      
    case 'ask_time':
      const time = parseTime(message.content);
      state.collectedData.time = time;
      state.step = 'ask_address';
      return "Perfect. What's the address?";
      
    case 'ask_address':
      state.collectedData.address = message.content;
      state.step = 'ask_email';
      return "And your email for confirmation?";
      
    case 'ask_email':
      state.collectedData.email = message.content;
      state.step = 'confirm';
      return buildConfirmationMessage(state);
      
    case 'confirm':
      if (message.content.toLowerCase().includes('yes')) {
        // Create the booking!
        const booking = await createBooking(state);
        bookingStates.delete(conversationId);
        return `All set! You're booked for ${state.collectedData.date} at ${state.collectedData.time}. Confirmation sent to ${state.collectedData.email}!`;
      } else {
        bookingStates.delete(conversationId);
        return "No problem! Text me anytime if you want to book.";
      }
  }
}
```

**Estimated time:** 1-2 days (lots of edge cases)

---

## Recommended Implementation Order:

### Week 1: Quote Link System
✅ Easier to build
✅ Lower risk (customer still books themselves)
✅ Gets you lead tracking immediately
✅ Can build direct booking on top of this later

Build:
1. Quote creation API
2. Quote retrieval API
3. Bot integration
4. Booking page pre-fill
5. HubSpot integration

### Week 2: Direct Booking (Optional)
Only if you see:
- Customers asking "can you just book me?"
- High drop-off at booking link
- Want full automation

Build:
1. Conversation state management
2. Multi-step data collection
3. Date/time/address parsing
4. Confirmation flow
5. Error handling
6. Booking creation integration

---

## My Recommendation:

**Start with Quote Link only.**

Why:
- 80% of the value, 20% of the complexity
- Customers can book when convenient
- You get full lead tracking
- Less error-prone
- Easier to test

**Add Direct Booking later** only if you see demand for it.

---

**Want me to build the Quote Link system first?** I can have it working in a few hours:
1. Create the database table
2. Build the APIs on Mesa Maids
3. Integrate with bot
4. Update booking page

Then you'll have personalized quote links with full tracking!
