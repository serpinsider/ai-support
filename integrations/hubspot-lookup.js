// HubSpot Customer Lookup Integration
import axios from 'axios';

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const HUBSPOT_API = 'https://api.hubapi.com';

/**
 * Look up customer by phone number in HubSpot
 * Find their most recent quote/deal for context
 */
export async function getCustomerContext(phoneNumber) {
  if (!HUBSPOT_API_KEY) {
    console.log('HubSpot API key not configured');
    return null;
  }

  try {
    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const searchPhone = cleanPhone.length === 10 ? `+1${cleanPhone}` : `+${cleanPhone}`;

    // Search for contact by phone
    const contactResponse = await axios({
      method: 'post',
      url: `${HUBSPOT_API}/crm/v3/objects/contacts/search`,
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        filterGroups: [{
          filters: [{
            propertyName: 'phone',
            operator: 'EQ',
            value: searchPhone
          }]
        }],
        properties: ['firstname', 'lastname', 'email', 'phone', 'createdate'],
        limit: 1
      }
    });

    if (!contactResponse.data.results.length) {
      console.log(`No HubSpot contact found for ${phoneNumber}`);
      return null;
    }

    const contact = contactResponse.data.results[0];
    console.log(`Found HubSpot contact: ${contact.properties.firstname} ${contact.properties.lastname}`);

    // Get recent deals for this contact
    const dealsResponse = await axios({
      method: 'get',
      url: `${HUBSPOT_API}/crm/v3/objects/deals/search`,
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        filterGroups: [{
          filters: [{
            propertyName: 'associations.contact',
            operator: 'EQ',
            value: contact.id
          }]
        }],
        properties: [
          'dealname', 'amount', 'dealstage', 'createdate',
          'bedrooms', 'bathrooms', 'service_type', 'frequency',
          'cleaning_type', 'hs_object_id'
        ],
        sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
        limit: 3
      }
    });

    const recentDeals = dealsResponse.data.results || [];
    const mostRecentDeal = recentDeals[0];

    if (mostRecentDeal) {
      console.log(`Found recent deal: ${mostRecentDeal.properties.dealname}`);
      
      return {
        contact: {
          id: contact.id,
          firstName: contact.properties.firstname,
          lastName: contact.properties.lastname,
          email: contact.properties.email,
          phone: contact.properties.phone
        },
        recentQuote: {
          id: mostRecentDeal.id,
          bedrooms: mostRecentDeal.properties.bedrooms,
          bathrooms: mostRecentDeal.properties.bathrooms,
          serviceType: mostRecentDeal.properties.service_type || mostRecentDeal.properties.cleaning_type,
          frequency: mostRecentDeal.properties.frequency,
          amount: mostRecentDeal.properties.amount,
          dealStage: mostRecentDeal.properties.dealstage,
          createdAt: mostRecentDeal.properties.createdate
        },
        isExistingCustomer: true,
        hasRecentQuote: true
      };
    }

    return {
      contact: {
        id: contact.id,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname,
        email: contact.properties.email,
        phone: contact.properties.phone
      },
      isExistingCustomer: true,
      hasRecentQuote: false
    };

  } catch (error) {
    console.log('Error looking up customer in HubSpot:', error.message);
    return null;
  }
}

/**
 * Get property details from HubSpot context for prompt
 */
export function formatContextForPrompt(customerContext) {
  if (!customerContext) {
    return "No previous customer information available.";
  }

  let context = `Customer: ${customerContext.contact.firstName} ${customerContext.contact.lastName}`;
  
  if (customerContext.hasRecentQuote) {
    const quote = customerContext.recentQuote;
    context += `\nRecent quote: ${quote.bedrooms} bed/${quote.bathrooms} bath ${quote.serviceType}`;
    if (quote.frequency) {
      context += ` (${quote.frequency})`;
    }
    if (quote.amount) {
      context += ` - $${quote.amount}`;
    }
  }
  
  return context;
}
