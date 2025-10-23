// Mesa Maids Business Knowledge Base
// Edit this file to update what the AI knows about your business

export const BUSINESS_INFO = {
  name: 'Mesa Maids',
  phone: '(480) 520-0202',
  email: 'hello@mesamaids.com',
  website: 'https://mesamaids.com',
  bookingUrl: 'https://mesamaids.com/booking',
  dashboardUrl: 'https://mesamaids.com/customer-dashboard',
  serviceArea: 'Mesa, AZ and surrounding areas'
};

export const SERVICES = {
  'Standard Clean': {
    description: 'Basic cleaning of all rooms including bedrooms, bathrooms, kitchen, and common areas',
    basePrice: 'Varies by size',
    examples: 'Studio: $150, 1br: $160, 2br: $240, 3br: $320, 4br: $400',
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
    duration: '2-4 hours'
  },
  
  'Deep Clean': {
    description: 'More thorough cleaning with baseboards, detailed dusting, and stain removal',
    additionalCost: '+$100 on top of base price',
    includes: [
      'Everything in Standard Clean',
      'Baseboard cleaning',
      'Wall stain removal', 
      'Tile and grout cleaning',
      'Detailed dusting of vents and fixtures',
      'More time on hard-to-reach areas'
    ],
    doesNOTinclude: [
      'Inside fridge (that\'s a $40 add-on)',
      'Inside oven (that\'s a $40 add-on)',
      'Inside microwave (that\'s a $20 add-on)'
    ],
    recommended: 'First time customers or homes that haven\'t been cleaned in a while',
    duration: '3-6 hours'
  },
  
  'Super Clean': {
    description: 'Most comprehensive clean for heavily soiled homes',
    additionalCost: '+$250 on top of base price',
    includes: [
      'Everything in Deep Clean',
      'Removes smoke and dust odors',
      'Wipe down doors and door frames',
      'Windowsills detailed cleaning',
      'Extra time for stubborn stains and grime'
    ],
    recommended: 'Very dirty homes, hoarding situations, or homes with heavy smoke/pet odor',
    duration: '4-8 hours'
  },
  
  'Move In/Out': {
    description: 'Comprehensive cleaning when moving in or out of a property',
    additionalCost: '+$150 on top of base price',
    includes: [
      'Everything in Standard Clean',
      'Inside all cabinets (bedroom, bathroom, kitchen)',
      'Interior windows',
      'Baseboard cleaning',
      'Wall stain removal',
      'Detailed cleaning of empty spaces'
    ],
    addons: [
      'Inside fridge (+$40)',
      'Inside oven (+$40)',
      'Both fridge and oven package (+$100 total)'
    ],
    note: 'Property should be empty or mostly empty for best results',
    duration: '3-6 hours'
  }
};

export const PRICING = {
  // IMPORTANT: Pricing formula is BEDROOMS + BATHROOMS + SERVICE FEE + ADD-ONS
  // Example: 2bd ($120) + 1ba ($80) = $200 base, Deep Clean = +$100 = $300 total
  
  baseRates: {
    bedrooms: {
      'Studio': 70,
      '1': 80,
      '2': 120,
      '3': 160,
      '4': 200,
      '5': 240,
      '6': 280
    },
    bathrooms: {
      '1': 80,
      '1.5': 100,
      '2': 120,
      '2.5': 140,
      '3': 160,
      '4': 200,
      '5': 240,
      '6': 280
    }
  },
  
  addons: {
    'Inside fridge': 40,
    'Inside oven': 40,
    'Inside microwave': 20,
    'Interior windows': 30,
    'Laundry': 30,
    'Dishes': 40,
    'Bedroom/bathroom cabinets': 40,
    'Kitchen cabinets': 40,
    'Basement cleaning': 100,
    'Pet hair removal': 20,
    'Organization': 40,
    'Extra hour': 80,
    'Washer/dryer cleaning': 80,
    'Baseboard cleaning': 40,
    'Wall stain removal': 20,
    'Tile and grout': 40,
    'Hardwood': 40,
    'Office cleaning': 50,
    'Townhouse': 100,
    'Stairs': 100
  },
  
  specialPricing: {
    extraTimeRate: 60, // per hour if place needs more time
    firstTimeDiscount: 25, // $25 off first 3 cleans
    largePropertyDiscount: '10% off for 3 bedrooms or more'
  },
  
  addonNotes: {
    'Inside fridge': 'Standard wipes outside, addon cleans inside',
    'Inside oven': 'Standard wipes outside, addon cleans inside', 
    'Inside microwave': 'Standard wipes outside, addon cleans inside',
    'Townhouse': 'May be $100 extra based on stairs',
    'Basement': '$100',
    'Stairs': '$100',
    'Office': '$50'
  },
  
  discounts: {
    'Weekly': '10% off',
    'Bi-weekly': '5% off',
    'Monthly': '$10 off'
  }
};

export const POLICIES = {
  cancellation: {
    notice: '24 hours required',
    fee: 'Same-day cancellations may incur a $50 fee'
  },
  
  payment: {
    when: 'Payment collected after cleaning is complete',
    methods: ['Credit/Debit Card', 'Zelle', 'CashApp'],
    note: 'We require a payment method on file before your appointment'
  },
  
  booking: {
    minimumNotice: '24 hours preferred',
    sameDay: 'Same-day bookings accepted based on availability',
    recurring: 'Same cleaner and time slot when possible'
  },
  
  guarantee: {
    policy: 'If you\'re not satisfied, contact us within 24 hours',
    resolution: 'We\'ll send someone back to re-clean at no charge'
  }
};

export const AVAILABILITY = {
  businessHours: {
    'Every day': '8:00 AM - 6:00 PM (7 days a week)'
  },
  
  scheduling: 'We can usually accommodate most day/time requests. Check mesamaids.com/booking for available slots.',
  
  bookingWindow: 'Usually available within a few days',
  
  peakTimes: 'Weekends are busiest - book ahead for preferred times'
};

export const FAQ = {
  'Do I need to be home?': 'No, most clients provide a key or door code. We\'ll secure your home when we leave.',
  
  'Do you bring supplies?': 'Yes, we bring all cleaning supplies and equipment. If you have specific products you\'d like us to use, just let us know.',
  
  'How long does it take?': 'Standard cleans take 2-4 hours depending on home size. We\'ll give you an estimated time when you book.',
  
  'Can I get the same cleaner?': 'Yes, for recurring services we assign the same cleaner for consistency.',
  
  'What if something gets damaged?': 'We\'re insured and bonded. If any damage occurs, let us know immediately and we\'ll address it.',
  
  'Do you clean commercial spaces?': 'Yes, we clean offices and small commercial spaces. Pricing is different - we\'ll discuss your specific needs.',
  
  'Can I add services after booking?': 'Yes, add services through your dashboard or contact us before your appointment.',
  
  'What if I need to reschedule?': 'Just let us know 24 hours before. You can reschedule through your dashboard or text us.',
  
  'What areas do you serve?': 'Mesa and surrounding areas in the Phoenix metro. If unsure, just ask!'
};

