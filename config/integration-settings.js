// Integration Settings
// Configure connections to your live Mesa Maids website/APIs

export const INTEGRATION_CONFIG = {
  // Enable/disable live data fetching
  useLiveData: false,  // Set to true when APIs are ready
  
  // API endpoints
  mesaMaidsUrl: process.env.MESA_MAIDS_URL || 'https://mesamaids.com',
  
  // Which data sources to use live vs static
  dataSources: {
    faq: 'static',        // 'static' | 'live'
    pricing: 'static',    // 'static' | 'live' 
    checklist: 'static',  // 'static' | 'live'
    availability: 'static', // 'static' | 'live'
  },
  
  // Cache settings (to avoid hitting APIs too much)
  cache: {
    faqTTL: 3600,         // Cache FAQ for 1 hour
    pricingTTL: 3600,     // Cache pricing for 1 hour
    checklistTTL: 3600,   // Cache checklist for 1 hour
  },
  
  // Customer lookup
  customerLookup: {
    enabled: false,       // Enable customer history lookup
    source: 'hubspot',    // 'hubspot' | 'database' | 'none'
  }
};

// API endpoints you need to create on Mesa Maids site
export const REQUIRED_ENDPOINTS = {
  quote: '/api/submit-quote',           // POST - Calculate quote
  faq: '/api/faq',                      // GET - Fetch FAQ
  checklist: '/api/checklist/:type',    // GET - Service checklist
  availability: '/api/check-availability', // POST - Check availability
  customer: '/api/customer/:phone',     // GET - Lookup customer
};

