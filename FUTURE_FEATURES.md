# Future Features Roadmap

## Phase 1: Lead Tracking & Unique Quote Links (Week 1-2)

### What It Does:
- Every pricing quote creates a lead/deal in HubSpot
- Customer gets personalized booking link pre-filled with their quote
- Track conversion from quote → link clicked → booking completed

### Implementation:
1. **When AI sends pricing:**
   - Create HubSpot contact (if new)
   - Create HubSpot deal with quote details
   - Generate unique quote code (e.g., Q-2024-001)
   - Create Quote record in database
   - Send custom link: `mesamaids.com/booking?q=ABC123`

2. **Booking page reads quote:**
   - Pre-fill form with bedrooms, bathrooms, service type, add-ons
   - Quote already calculated
   - Customer just adds: date, time, address, payment

3. **Track conversions:**
   - Deal stages: `quote_sent` → `link_clicked` → `form_started` → `payment_added` → `closedwon`

### Files to Create:
- `integrations/hubspot-integration.js` - HubSpot API wrapper
- `integrations/quote-manager.js` - Quote creation/tracking
- `mesa-maids/src/app/api/quote/[code]/route.ts` - Fetch quote by code
- Update booking page to read quote parameter

### Environment Variables:
```env
HUBSPOT_API_KEY=your_key
MESA_MAIDS_DATABASE_URL=your_postgres_url
```

---

## Phase 2: Customer Recognition (Week 2-3)

### What It Does:
- Recognize returning customers by phone number
- Personalize responses based on history
- Know if they're recurring, past customer, or have open quote

### Examples:
```
New customer: "How much for 2bd/1ba?"
Bot: "For 2bd/1ba standard it's $200..."

Returning customer: "How much for 2bd/1ba?"
Bot: "Hey John! For 2bd/1ba it's $200. Same as last time?"

Recurring customer: "Can I book?"
Bot: "Hey Sarah! Want to schedule your usual bi-weekly clean?"
```

### Implementation:
1. **Customer lookup on every message:**
   - Query Mesa Maids database by phone
   - Get: name, email, total bookings, last service, recurring status
   
2. **Pass context to AI:**
   - Include customer history in prompt
   - AI personalizes greeting and response
   
3. **Smart suggestions:**
   - If recurring: "Want your usual clean?"
   - If returning: "Same as last time?"
   - If has quote: "Still thinking about that deep clean?"

### Files to Create:
- `integrations/customer-lookup.js` - Database/HubSpot lookup
- Update `server.js` to call lookup before AI generation
- Update prompt builder to use customer context

### Database Queries:
```sql
-- Get customer by phone
SELECT 
  c.id, c.first_name, c.email, c.is_recurring,
  (SELECT service_type FROM bookings WHERE customer_id = c.id ORDER BY service_date DESC LIMIT 1) as last_service,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = c.id) as total_bookings
FROM customers c
WHERE c.phone = $1
```

---

## Phase 3: Automated Follow-ups (Week 3-4)

### What It Does:
Automated SMS follow-ups based on customer behavior and booking status.

### A. Abandoned Quote Follow-up
**Trigger:** Quote sent, link not clicked after 2 hours
**Message:** 
```
"Hey, it's Sarah from Mesa Maids. Just wanted to follow up on that 2bd/1ba deep clean quote ($340). Still interested? Here's your link: mesamaids.com/booking?q=ABC123"
```

### B. Link Clicked But Not Booked
**Trigger:** Opened booking link but didn't complete within 24 hours
**Message:**
```
"Hey! I noticed you checked out the booking link but didn't finish. Any questions I can answer? Your quote is still good: mesamaids.com/booking?q=ABC123"
```

### C. Post-Clean Feedback Request
**Trigger:** Booking completed today, 6pm
**Message:**
```
"Hey [name]! Hope everything went well with today's cleaning. Would you mind leaving us a quick review? It really helps us out. mesamaids.com/review?b=123"
```

### D. Recurring Customer Reminder
**Trigger:** 3 days before next scheduled clean
**Message:**
```
"Hey [name]! Your bi-weekly clean is scheduled for Friday at 10am. See you then!"
```

### E. Win-back Inactive Customers
**Trigger:** Monthly, for customers 90+ days since last booking
**Message:**
```
"Hey [name]! It's been a while since your last clean. We'd love to help you out again. Want to schedule something?"
```

### Implementation:
1. **Cron jobs in Mesa Maids:**
   - `/api/cron/quote-followups` - Runs hourly
   - `/api/cron/post-clean-feedback` - Runs daily 6pm
   - `/api/cron/recurring-reminders` - Runs daily
   - `/api/cron/winback-campaign` - Runs monthly

2. **Vercel cron configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/quote-followups",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/post-clean-feedback", 
      "schedule": "0 18 * * *"
    }
  ]
}
```

3. **Database tracking:**
   - Add fields: `followUpSent`, `feedbackRequested`, `lastContactDate`
   - Track all automated messages
   - Prevent duplicate follow-ups

### Files to Create:
- `mesa-maids/src/app/api/cron/quote-followups/route.ts`
- `mesa-maids/src/app/api/cron/post-clean-feedback/route.ts`
- `mesa-maids/src/app/api/cron/recurring-reminders/route.ts`
- `mesa-maids/src/app/api/cron/winback-campaign/route.ts`
- `integrations/followup-manager.js` - Shared follow-up logic

---

## Phase 4: Live Data Integration (Week 4-5)

### What It Does:
- Fetch live FAQ from Mesa Maids website
- Use real pricing calculator API
- Get actual service checklists
- Check real availability calendar

### Implementation:
1. **Create APIs on Mesa Maids:**
   - `/api/bot-quote` - Calculate exact quote
   - `/api/bot-faq` - Return FAQ data
   - `/api/bot-checklist/[type]` - Return service checklist
   - `/api/bot-availability` - Check calendar

2. **Bot calls APIs instead of static data:**
   - When customer asks price → Call quote API
   - When customer asks question → Check FAQ API
   - When customer asks "what's included" → Fetch checklist

3. **Benefits:**
   - Always accurate pricing
   - FAQ updates automatically propagate to bot
   - One source of truth

### Files to Create:
- `mesa-maids/src/app/api/bot-quote/route.ts`
- `mesa-maids/src/app/api/bot-faq/route.ts`
- `mesa-maids/src/app/api/bot-checklist/[type]/route.ts`
- Enable in `config/integration-settings.js`

---

## Phase 5: Direct Booking Creation (Week 5-6)

### What It Does:
Customer can complete entire booking via text message - no clicking links.

### Conversation Flow:
```
Customer: "Book me for Friday"
Bot: "Great! What time works? We have 9am, 12pm, or 3pm"
Customer: "9am"
Bot: "Perfect. What's your address?"
Customer: "[address]"
Bot: "And your email for confirmation?"
Customer: "[email]"
Bot: ✅ Creates booking
Bot: "All set! You're booked for Friday 9am at [address]. Confirmation sent to your email."
```

### Implementation:
1. **Multi-step conversation state:**
   - Track where customer is in booking flow
   - Store partial data (date, time, address, etc.)
   - Validate each step

2. **Booking creation API:**
   - Create booking in database
   - Create HubSpot deal (closedwon)
   - Send confirmation email/SMS
   - Add to calendar

3. **Error handling:**
   - Validate addresses
   - Check slot availability
   - Handle invalid dates/times
   - Allow customer to go back/restart

### Complexity:
- **High** - Requires state management across messages
- **Error-prone** - Many edge cases
- **User experience** - Customers might drop off mid-flow

### Recommendation:
Only build this if you see customers asking "can you just book me?" frequently. The quote link approach (Phase 1) is usually sufficient and simpler.

---

## Phase 6: Cold Outreach Campaign (Future)

### What It Does:
Automated cold outreach to businesses for commercial cleaning services.

### How It Works:
1. **Business Database:**
   - Upload list of target businesses (name, phone, industry, size)
   - Track: contacted, responded, converted, not interested
   
2. **Personalized Messages:**
   - AI generates personalized outreach based on business info
   - Different templates for: offices, restaurants, retail, medical, etc.
   - Mention specific business details (found online or provided)

3. **Drip Campaign:**
   - Initial message: "Hey [business name], we do commercial cleaning in [area]..."
   - Follow-up 1 (3 days): If no response
   - Follow-up 2 (1 week): Different angle
   - Mark as "not interested" after 3 attempts

4. **Conversation Handoff:**
   - If they respond interested → AI answers questions
   - When ready → Human takes over or AI books discovery call

### Example Messages:

**Initial:**
```
Hey [Business Name], 

We do commercial cleaning for offices in Mesa. Noticed you're on [Street Name]. 

Would you be interested in a quote for regular office cleaning? We work with businesses your size all the time.

Let me know if you'd like to hear more!
```

**Follow-up 1 (no response):**
```
Just following up from last week. We're offering 20% off for new commercial clients this month. 

Want a free quote for your office?
```

**If interested:**
```
Awesome! How many square feet is your office? And how often would you want service - daily, weekly, or bi-weekly?
```

### Implementation:

**Database Schema:**
```javascript
{
  businessName: "ABC Law Firm",
  phone: "+14805551234",
  address: "123 Main St, Mesa",
  industry: "Office/Legal",
  squareFeet: "2000",
  employees: "10-20",
  status: "not_contacted",
  contactedAt: null,
  respondedAt: null,
  interestedStatus: null,
  notes: ""
}
```

**Campaign Manager:**
```javascript
// Send initial outreach batch (50-100/day max)
async function sendOutreachBatch() {
  const businesses = await getUncontactedBusinesses(50);
  
  for (const business of businesses) {
    const message = generatePersonalizedOutreach(business);
    await sendSMS(business.phone, message);
    await markAsContacted(business.id);
    
    // Delay between sends to avoid spam detection
    await sleep(2000);
  }
}

// Check for responses and follow up
async function handleOutreachResponses() {
  const responses = await getOutreachResponses();
  
  for (const response of responses) {
    if (response.interested) {
      // AI engages with questions
      await handleCommercialInquiry(response);
    } else if (response.notInterested) {
      // Mark as DNC
      await markAsNotInterested(response.businessId);
    }
  }
}

// Follow-up campaign
async function sendFollowUps() {
  // After 3 days, no response
  const needsFollowUp = await getBusinessesForFollowUp();
  
  for (const business of needsFollowUp) {
    const followUpMessage = generateFollowUpMessage(business);
    await sendSMS(business.phone, followUpMessage);
    await updateFollowUpCount(business.id);
  }
}
```

### Files to Create:
- `integrations/cold-outreach-manager.js` - Campaign logic
- `mesa-maids/src/app/api/outreach/businesses/route.ts` - Manage business list
- `mesa-maids/src/app/api/outreach/send-batch/route.ts` - Send outreach batch
- `mesa-maids/src/app/api/cron/outreach-followups/route.ts` - Automated follow-ups
- Database table: `outreach_businesses`

### Admin Interface:
- Upload business list (CSV)
- View campaign stats (sent, responded, interested, converted)
- Manually mark businesses as DNC or interested
- Review conversations
- Adjust templates

### Compliance & Safety:
- Respect Do Not Contact (DNC) list
- Max sends per day (avoid spam flags)
- Unsubscribe option: "Reply STOP to opt out"
- Only send during business hours
- Track opt-outs immediately

### Metrics to Track:
- Messages sent
- Response rate
- Interest rate
- Conversion to quote/booking
- Cost per acquisition
- ROI per campaign

### Estimated Results:
- 100 businesses contacted
- 20% response rate = 20 responses
- 50% of responses interested = 10 leads
- 30% of leads convert = 3 new commercial clients
- Average commercial contract: $500-2000/month
- Monthly recurring revenue: $1500-6000

---

## Phase 7: Realtor Partnership Outreach (Future)

### What It Does:
Automated outreach to real estate agents for move-in/move-out cleaning partnerships.

### Why Realtors Are Different:
- They need reliable vendors for every closing
- Recurring business (multiple properties per month)
- Higher value clients (commission-based relationships)
- Can become referral partners vs one-time customers

### How It Works:

1. **Realtor Database:**
   - Upload list of local realtors (name, phone, brokerage, specialty)
   - Track: contacted, interested, active partnership, properties cleaned
   - Source: Zillow, Realtor.com scraping, MLS data, local associations

2. **Partnership Pitch:**
   - Focus on move-in/move-out cleaning
   - Offer: realtor discount, priority scheduling, direct billing
   - Value prop: makes their listings show-ready, helps closings go smooth

3. **Different Message Strategy:**
   - More professional tone (B2B vs B2C)
   - Emphasize reliability and quality
   - Offer partnership benefits

### Example Messages:

**Initial Outreach (Direct & Natural):**
```
Hey [Name], 

We do move-out cleaning for realtors in Brooklyn. 

Would you be interested in a reliable cleaning partner for your closings? 

We offer realtor pricing and priority scheduling.

Let me know!
```

**If They Respond:**
```
Realtor: "Yeah, what's your pricing?"
Bot: "Move-outs start at $300-500 depending on size. Realtors get 10% off and priority scheduling."

Realtor: "What's included?"
Bot: "Full empty-home clean including inside cabinets, windows, baseboards. We make it show-ready."

Realtor: "How fast can you turn it around?"
Bot: "Usually 24-48 hours. If you text me the address and closing date, I'll get it scheduled."

Realtor: "Sounds good"
Bot: "Awesome! Just text me whenever you have a property that needs cleaning and we'll handle it."
```

**Follow-up 1 (no response after 3 days):**
```
Just following up from earlier this week. 

Still interested in move-out cleaning for your listings? 

Happy to send pricing.
```

**Follow-up 2 (no response after 1 week):**
```
Last follow-up, promise! 

If you ever need move-out cleaning for a closing, we're here. 

Reply anytime.
```

**After Partnership Established:**
```
Realtor: "Got a 3bd/2ba move-out at 123 Main St, closing Friday"
Bot: "Got it! 3bd/2ba move-out is $360 with your realtor discount. I'll schedule for Thursday. Confirm?"

Realtor: "Yes"
Bot: "Scheduled! We'll text you when it's done with before/after pics."
```

### Partnership Benefits to Offer:

**For Realtors:**
- Bulk discount (10-15% off)
- Priority scheduling
- After-hours availability
- Before/after photos
- Direct client billing option
- Quick turnaround (24-48hrs)
- Staging-ready cleaning

**For You:**
- Recurring business (agents close multiple homes/month)
- Higher volume
- Predictable revenue
- Premium pricing (less price sensitivity)
- Referral network (agents talk to other agents)

### Implementation:

**Database Schema:**
```javascript
{
  realtorName: "John Smith",
  phone: "+14805551234",
  email: "john@remax.com",
  brokerage: "RE/MAX",
  specialty: "Residential",
  averageClosingsPerMonth: "3-5",
  serviceArea: "Mesa, Gilbert, Chandler",
  status: "not_contacted",
  partnershipStatus: null,
  propertiesCleaned: 0,
  totalRevenue: 0,
  discountLevel: "standard_10",
  preferredContact: "text",
  notes: ""
}
```

**Partnership Tiers:**
```javascript
{
  "Silver": {
    requirement: "1-2 properties/month",
    discount: "10%",
    benefits: ["Priority scheduling", "Same-day quotes"]
  },
  "Gold": {
    requirement: "3-5 properties/month", 
    discount: "15%",
    benefits: ["All Silver", "After-hours availability", "Direct billing"]
  },
  "Platinum": {
    requirement: "6+ properties/month",
    discount: "20%",
    benefits: ["All Gold", "Dedicated account manager", "24hr turnaround guarantee"]
  }
}
```

**Campaign Manager:**
```javascript
// Initial outreach (slower pace than B2C)
async function sendRealtorOutreach() {
  const realtors = await getUncontactedRealtors(20); // 20/day max
  
  for (const realtor of realtors) {
    const message = generateRealtorPitch(realtor);
    await sendSMS(realtor.phone, message);
    await markAsContacted(realtor.id);
    
    // More spacing for B2B
    await sleep(5000);
  }
}

// Track partnership performance
async function trackRealtorPerformance() {
  const activePartners = await getActiveRealtorPartners();
  
  for (const partner of activePartners) {
    const stats = {
      propertiesThisMonth: await getPropertiesCount(partner.id),
      revenue: await getRevenueForRealtor(partner.id),
      averageJobSize: calculateAverage(partner.id)
    };
    
    // Upgrade tier if qualified
    if (stats.propertiesThisMonth >= 6 && partner.tier !== 'Platinum') {
      await upgradeTier(partner.id, 'Platinum');
      await sendUpgradeNotification(partner);
    }
  }
}

// Monthly relationship maintenance
async function sendMonthlyUpdate() {
  const activePartners = await getActiveRealtorPartners();
  
  for (const partner of activePartners) {
    const message = `Hey ${partner.name}! Quick update: We cleaned ${partner.propertiesLastMonth} properties for you last month. Thanks for the partnership! Let me know if you have any coming up.`;
    
    await sendSMS(partner.phone, message);
  }
}
```

### Files to Create:
- `integrations/realtor-outreach-manager.js`
- `mesa-maids/src/app/api/outreach/realtors/route.ts`
- `mesa-maids/src/app/api/outreach/realtor-stats/route.ts`
- `mesa-maids/src/app/api/cron/realtor-followups/route.ts`
- Database table: `realtor_partners`

### Admin Interface Features:
- Upload realtor list (CSV from MLS data)
- View partnership dashboard (active, tier, properties cleaned, revenue)
- Track which agent referred which property
- Commission tracking (if offering referral fees)
- Performance reports per realtor

### Conversation Flow:

**Phase 1: Outreach**
```
Bot: Initial pitch
Realtor: "Tell me more"
Bot: Explains services, pricing, benefits
Realtor: "Sounds good"
Bot: "Awesome! Can I get your email to send partnership details?"
→ Creates partnership record
→ Sends partnership agreement via email
```

**Phase 2: Active Partnership**
```
Realtor: "Got a 3bd/2ba move-out at 123 Main St, need it done by Friday"
Bot: Recognizes partner, applies discount
Bot: "Got it! 3bd/2ba move-out is $270 (with your 10% partner discount). I'll schedule for Thursday. Confirm?"
Realtor: "Yes"
Bot: Creates booking, sends confirmation
```

**Phase 3: Relationship Management**
```
Monthly: "Hey John! You sent us 4 properties last month. Thanks for the partnership!"
Quarterly: "Quick update - you're almost at Gold tier! 1 more property this quarter gets you 15% discount."
```

### Metrics to Track:
- Realtors contacted
- Partnership conversion rate
- Active partnerships
- Properties per partner
- Revenue per partner
- Referral tier distribution
- Average job size (realtors vs regular customers)
- Partnership retention rate

### Expected ROI:
- 100 realtors contacted
- 20% become partners = 20 active realtors
- Average 3 properties/month each = 60 jobs/month
- Average move-out: $350
- Monthly revenue: $21,000
- Even at 15% discount: $17,850/month
- **High-value recurring channel**

### Why This Is Powerful:
- One realtor = multiple customers/month
- Predictable pipeline
- Premium pricing (less negotiation)
- Word-of-mouth in realtor community
- Can become primary revenue source
- Realtors appreciate reliable vendors

---

## Phase 8: Business/Office Outreach (Future)

### Target Businesses That Need Cleaning:
- **Wellness studios** (yoga, pilates, gyms, spas)
- **Startups/coworking spaces** (WeWork-style spaces)
- **Medical offices** (dentists, chiropractors, clinics)
- **Professional offices** (law firms, accounting, insurance)
- **Retail stores** (boutiques, showrooms)
- **Restaurants** (post-close deep cleaning)
- **Salons/barbershops**

### Simple Outreach Message:
```
Hey [Business Name],

We do commercial cleaning for [business type] in [area].

Would you be interested in a quote for regular cleaning?

Let me know!
```

### Conversation:
```
Business: "Yeah, how much?"
Bot: "How many square feet?"

Business: "1500 sq ft"
Bot: "For 1500 sq ft, weekly cleaning is about $300/month."

Business: "What's included?"
Bot: "Floors, bathrooms, trash, surfaces, kitchen area. Takes 2-3 hours per visit."

Business: "Sounds good"
Bot: "Awesome! Want to schedule a walkthrough?"
```

---

## Phase 9: Cross-Promotion Partnerships (Future)

### Partner With Complementary Businesses:

**Type 1: Customer Overlap (Revenue Share)**

**Laundromats:**
- Their customers = people who need services
- Offer: "Get 10% off Mesa Maids cleaning - mention [Laundromat Name]"
- We pay laundromat: $20-30 per booking referral
- They display our flyers, we send customers to them

**Wellness Studios (Yoga, Pilates, Gyms):**
- Members = homeowners who value clean spaces
- Cross-promote: "Studio members get 15% off Mesa Maids"
- We offer: "Customers get free week at [Studio Name]"
- Co-marketing on social media

**Home Organization Services:**
- They organize, we clean
- Bundle: "Book organizing + cleaning, save 20%"
- Split revenue 50/50 or refer to each other

**Moving Companies:**
- Every move = potential move-in/move-out clean
- Offer their customers: "Book cleaning with your move, get 10% off"
- They get: $30-50 per referral

**Real Estate Staging Companies:**
- They stage, we clean
- Partner on listings together
- Share client base

**Home Improvement/Contractors:**
- Post-construction cleaning
- "Had work done? We clean up after contractors"
- Revenue share on referrals

**Type 2: Local Business Networks**

**Coffee Shops/Cafes:**
- Leave flyers with promo code
- "Mention [Cafe Name], get $20 off first clean"
- We buy coffee for the staff monthly

**Neighborhood Facebook Groups:**
- Partner with group admins
- Exclusive group member discount
- Word-of-mouth marketing

**HOA Partnerships:**
- Offer resident discount
- Become "preferred vendor"
- Regular presence at HOA events

### Implementation:

**Partnership Database:**
```javascript
{
  businessName: "Zen Yoga Studio",
  businessType: "Wellness",
  phone: "+14805551234",
  contactName: "Owner Name",
  partnershipType: "cross_promotion",
  deal: {
    theyOffer: "10% off Mesa Maids to members",
    weOffer: "Free week pass to Zen Yoga for customers",
    revenue_share: null
  },
  OR
  deal: {
    theyRefer: "Customers to us",
    wePay: "$25 per booking",
    revenue_share: "per_booking"
  },
  startDate: "2025-01-01",
  bookingsGenerated: 0,
  revenueGenerated: 0,
  status: "active"
}
```

**Outreach Messages:**

**To Laundromat:**
```
Hey [Name],

We do residential cleaning in Mesa. 

Wanted to reach out about a partnership - we could offer your customers 10% off cleaning services, and we'd pay you $25 for each booking.

Would you be interested in a simple referral partnership?
```

**To Yoga Studio:**
```
Hey [Name],

We do home cleaning in Mesa and thought about partnering with [Studio Name].

Idea: Your members get 15% off cleaning, our customers get a free week pass to your studio.

Cross-promote to each other's customers?

Let me know!
```

**To Moving Company:**
```
Hey [Name],

We do move-in/move-out cleaning. 

Want to partner? We could offer your customers cleaning packages with their moves, and pay you $30-50 per referral.

Interested?
```

### Campaign Strategy:

**Month 1:** Test 10 partnerships (2 laundromats, 3 wellness, 3 moving, 2 contractors)
**Month 2:** Expand to 30 partners if working
**Month 3:** 50+ active partnerships

### Expected Results:

**Conservative (50 partners × 2 bookings/month):**
- 100 bookings/month from partnerships
- Average booking: $250
- Revenue: $25,000/month
- Cost (revenue share): $2,500-5,000
- **Net: $20,000-22,500/month**

**Plus:**
- Brand awareness in community
- Word-of-mouth growth
- Recurring customer base
- Lower acquisition cost than ads

### Files to Create:
- `integrations/partnership-manager.js`
- `mesa-maids/src/app/api/partnerships/route.ts`
- `mesa-maids/src/app/api/partnerships/track-referral/route.ts`
- Database table: `business_partnerships`
- Admin dashboard: Partnership performance

---

## Phase 10: Multi-Location Support (Future)

### What It Does:
Same bot handles Brooklyn Maids, Mesa Maids, STL Maids - detects which number they texted.

### Implementation:
1. **Detect business from phone number:**
```javascript
const businessConfig = {
  '+14805200202': 'mesa-maids',
  '+13477504380': 'brooklyn-maids', 
  '+13143100970': 'stl-maids'
};

const business = businessConfig[messageData.to];
```

2. **Load appropriate config:**
```javascript
import { buildSystemPrompt } from `./config/${business}/prompt-builder.js`;
import { BUSINESS_INFO } from `./config/${business}/knowledge.js`;
```

3. **Separate configs per business:**
```
config/
├── mesa-maids/
│   ├── knowledge.js
│   └── personality.js
├── brooklyn-maids/
│   ├── knowledge.js
│   └── personality.js
└── stl-maids/
    ├── knowledge.js
    └── personality.js
```

---

## Implementation Priority

### Must Have (Before Launch):
1. ✅ Natural conversational tone
2. ✅ Conversation memory
3. ✅ Accurate pricing
4. ✅ FAQ usage

### High Priority (First Month):
1. Lead tracking (Phase 1)
2. Unique quote links (Phase 1)
3. Customer recognition (Phase 2)

### Medium Priority (Month 2):
1. Abandoned quote follow-ups (Phase 3)
2. Post-clean feedback (Phase 3)
3. Live data integration (Phase 4)

### Low Priority (Month 3+):
1. Recurring reminders (Phase 3)
2. Win-back campaigns (Phase 3)
3. Direct booking creation (Phase 5)
4. Multi-location support (Phase 6)

---

## Metrics to Track

### Conversion Funnel:
- Conversations started
- Quotes sent
- Links clicked
- Forms started
- Bookings completed
- Conversion rate at each stage

### Bot Performance:
- Average response time
- Questions answered automatically
- Escalations to human
- Customer satisfaction (ask for rating)

### ROI:
- Leads generated
- Bookings from bot
- Revenue attributed to bot
- Time saved (vs manual responses)
- After-hours conversions (bot never sleeps)

---

## Estimated Timeline

- **Phase 1:** 1-2 weeks
- **Phase 2:** 1 week
- **Phase 3:** 1-2 weeks
- **Phase 4:** 1 week
- **Phase 5:** 2 weeks
- **Total:** 6-8 weeks for everything

## Estimated Costs

- Development: Already built (just needs integration)
- OpenPhone: ~$20/mo (you already have)
- Claude API: ~$10-30/mo (depends on volume)
- Hosting (Render): $7/mo or free
- **Total new costs:** ~$15-55/mo

## Expected ROI

Conservative estimate:
- 50 conversations/month
- 20% conversion rate = 10 bookings
- Average booking: $250
- Revenue: $2,500/mo
- Cost: $50/mo
- **ROI: 50x**

Plus:
- 24/7 availability
- Instant responses
- Consistent quality
- Time saved for your team

