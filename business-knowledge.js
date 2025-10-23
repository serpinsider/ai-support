// Business Knowledge Base for AI Agent

export const SERVICES = {
  'Standard Clean': {
    description: 'Basic cleaning of all rooms including bedrooms, bathrooms, kitchen, and common areas',
    includes: [
      'Vacuum and mop all floors',
      'Dust all surfaces',
      'Clean bathrooms (toilet, sink, shower, tub)',
      'Clean kitchen surfaces',
      'Make beds',
      'Take out trash'
    ],
    excludes: [
      'Inside fridge',
      'Inside oven',
      'Interior windows',
      'Inside cabinets',
      'Laundry',
      'Dishes'
    ],
    basePrice: 'Varies by size (Studio: $150, 1br: $160, 2br: $240, 3br: $320, 4br: $400)',
    duration: '2-4 hours depending on size'
  },
  
  'Deep Clean': {
    description: 'More thorough cleaning including baseboards, detailed dusting, and stain removal',
    includes: [
      'Everything in Standard Clean',
      'Baseboard cleaning',
      'Wall stain removal',
      'Tile and grout cleaning',
      'Detailed dusting of vents and fixtures',
      'More time on hard-to-reach areas'
    ],
    additionalCost: '+$100 on top of base price',
    recommended: 'First time customers or homes that haven\'t been cleaned in a while',
    duration: '3-6 hours depending on size'
  },
  
  'Super Clean': {
    description: 'Most comprehensive clean for heavily soiled homes',
    includes: [
      'Everything in Deep Clean',
      'Removes smoke and dust odors',
      'Wipe down doors and door frames',
      'Windowsills detailed cleaning',
      'Extra time for stubborn stains and grime'
    ],
    additionalCost: '+$250 on top of base price',
    recommended: 'Very dirty homes, hoarding situations, or homes with heavy smoke/pet odor',
    duration: '4-8 hours depending on condition'
  },
  
  'Move In/Out': {
    description: 'Comprehensive cleaning when moving in or out of a property',
    includes: [
      'Everything in Standard Clean',
      'Inside all cabinets (bedroom, bathroom, kitchen)',
      'Interior windows',
      'Baseboard cleaning',
      'Wall stain removal',
      'Detailed cleaning of empty spaces'
    ],
    optionalAddons: [
      'Inside fridge (+$40)',
      'Inside oven (+$40)',
      'Both fridge and oven in package (+$100 total instead of $80)'
    ],
    additionalCost: '+$150 on top of base price',
    note: 'Property should be empty or mostly empty for best results',
    duration: '3-6 hours depending on size'
  }
};

export const PRICING = {
  baseRates: {
    bedrooms: {
      'Studio': 70,
      '1': 80,
      '2': 120,
      '3': 160,
      '4': 200,
      '5': 240,
      '6+': 'Call for quote'
    },
    bathrooms: {
      '1': 80,
      '1.5': 100,
      '2': 120,
      '2.5': 140,
      '3': 160,
      '4+': 'Call for quote'
    }
  },
  
  addons: {
    'Inside fridge': 40,
    'Inside oven': 40,
    'Interior windows': 30,
    'Laundry': 30,
    'Dishes': 40,
    'Bedroom/bathroom cabinets': 40,
    'Kitchen cabinets': 40,
    'Basement cleaning': 100,
    'Pet hair removal': 20,
    'Organization': 40,
    'Extra hour': 80,
    'Washer/dryer cleaning': 80
  },
  
  discounts: {
    'Weekly': '10% off',
    'Bi-weekly': '5% off',
    'Monthly': '$10 off'
  }
};

export const POLICIES = {
  cancellation: {
    policy: '24 hours notice required for cancellation',
    fee: 'Same-day cancellations may incur a $50 fee'
  },
  
  payment: {
    when: 'Payment is collected after the cleaning is complete',
    methods: ['Credit/Debit Card', 'Zelle', 'CashApp'],
    note: 'We require a payment method on file before your appointment'
  },
  
  booking: {
    minimumNotice: '24 hours in advance preferred',
    sameDay: 'Same-day bookings accepted based on availability',
    recurring: 'Same cleaner and time slot when possible'
  },
  
  guarantee: {
    policy: 'If you\'re not satisfied, contact us within 24 hours',
    resolution: 'We\'ll send someone back to re-clean the area at no charge'
  }
};

export const AVAILABILITY = {
  businessHours: {
    monday: '8:00 AM - 6:00 PM',
    tuesday: '8:00 AM - 6:00 PM',
    wednesday: '8:00 AM - 6:00 PM',
    thursday: '8:00 AM - 6:00 PM',
    friday: '8:00 AM - 6:00 PM',
    saturday: '8:00 AM - 6:00 PM',
    sunday: '8:00 AM - 6:00 PM'
  },
  
  bookingWindow: 'Typically available within 2-5 business days',
  
  peakTimes: {
    note: 'Weekends and end-of-month are our busiest times',
    recommendation: 'Book 1-2 weeks in advance for preferred time slots'
  }
};

export const COMMON_QUESTIONS = {
  'Do I need to be home?': 'No, most clients provide a key or door code. We\'ll secure your home when we leave.',
  
  'What if I need to reschedule?': 'Just let us know at least 24 hours before your appointment. You can reschedule through your customer dashboard or by texting us.',
  
  'Do you bring supplies?': 'Yes, we bring all cleaning supplies and equipment. If you have specific products you\'d like us to use, just let us know.',
  
  'How long does it take?': 'Depends on home size and service type. Standard cleans typically take 2-4 hours. We\'ll give you an estimated time when you book.',
  
  'What areas do you serve?': 'We serve Brooklyn and surrounding areas. If you\'re unsure if we cover your area, just provide your zip code.',
  
  'Can I get the same cleaner each time?': 'Yes, for recurring services we try to assign the same cleaner to your home for consistency.',
  
  'What if something gets damaged?': 'We\'re insured and bonded. If any damage occurs (which is extremely rare), please let us know immediately and we\'ll address it.',
  
  'Do you do commercial cleaning?': 'Yes, we clean offices and small commercial spaces. Pricing is different from residential - we\'ll need to discuss your specific needs.',
  
  'Can I add services after booking?': 'Yes, you can add services through your dashboard or by contacting us before your appointment. We\'ll adjust your quote accordingly.'
};

export const CONTACT_INFO = {
  'Brooklyn Maids': {
    phone: '(347) 750-4380',
    email: 'hello@brooklynmaids.com',
    website: 'https://brooklynmaids.com',
    bookingUrl: 'https://brooklynmaids.com/booking',
    dashboardUrl: 'https://brooklynmaids.com/customer-dashboard'
  },
  'Mesa Maids': {
    phone: '(480) 520-0202',
    email: 'hello@mesamaids.com',
    website: 'https://mesamaids.com',
    bookingUrl: 'https://mesamaids.com/booking',
    dashboardUrl: 'https://mesamaids.com/customer-dashboard'
  },
  'St. Louis Maids': {
    phone: '(314) 310-0970',
    email: 'hello@stlouismaids.com',
    website: 'https://stlouismaids.com',
    bookingUrl: 'https://stlouismaids.com/booking',
    dashboardUrl: 'https://stlouismaids.com/customer-dashboard'
  }
};

