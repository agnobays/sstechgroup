import { db } from '../db/database.js';
import { roundMoney } from './calculationService.js';

export interface QuestionnaireData {
  // Contact & Organization
  fullName?: string;
  email?: string;
  phone?: string;
  organization?: string;
  businessType?: string; // 'Startup / Small Business' | 'Corporate / SME' | 'School / College / University' | 'Non-Profit' | 'Enterprise'

  // Service & Requirements
  serviceRequired: string; // 'business_website' | 'education_website' | 'custom_app' | 'redesign' | 'hosting_maintenance' | 'api_automation' | 'other'
  projectGoals?: string;
  targetAudience?: string;
  pageCount?: string; // '1-3' | '4-7' | '8-15' | '15+'
  existingWebsite?: string;
  hasDomain?: boolean;
  
  // Specific Features Requested
  features?: string[]; // e.g. 'contact_form', 'cms', 'admissions_portal', 'user_auth', 'payments', 'database_integration', 'api_sync', 'multi_language', 'booking_calendar'
  
  // Add-on Selections
  needsHosting?: boolean;
  needsMaintenance?: boolean;
  needsDomain?: boolean;
  needsM365?: boolean;

  // Timeline & Budget
  desiredLaunchDate?: string;
  budgetRange?: string; // 'under_10k' | '10k_20k' | '20k_40k' | '40k_plus' | 'undisclosed'
  additionalNotes?: string;

  // Consents
  consentMarketing?: boolean;
  consentFollowup?: boolean;
}

export interface PackageRecord {
  id: number;
  key: string;
  name: string;
  starting_price: number;
  description: string;
  features_json: string;
  ideal_for: string;
}

export interface OptionalServiceRecord {
  id: number;
  key: string;
  name: string;
  price: number;
  billing_cycle: 'once_off' | 'monthly' | 'annual';
  description: string;
}

export interface PricingEvaluationResult {
  recommendedPackage: PackageRecord;
  isCustomScope: boolean;
  status: 'Ready for Customer' | 'Preliminary Estimate' | 'Pending Review';
  reasoning: string;
  lineItems: {
    description: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    tax_rate: number;
    line_total: number;
    billing_cycle: 'once_off' | 'monthly' | 'annual';
  }[];
  onceOffSubtotal: number;
  onceOffTotal: number;
  recurringMonthly: number;
  recurringAnnual: number;
  applicableAddOns: {
    name: string;
    price: number;
    billing_cycle: string;
  }[];
  assumptions: string[];
  outstandingQuestions: string[];
}

export function evaluateQuestionnaireAndCalculatePrice(data: QuestionnaireData): PricingEvaluationResult {
  // Load current verified packages and optional services from database
  const packages = db.prepare('SELECT * FROM packages WHERE is_active = 1 ORDER BY sort_order ASC').all() as PackageRecord[];
  const optionalServices = db.prepare('SELECT * FROM optional_services WHERE is_active = 1').all() as OptionalServiceRecord[];

  const landingPkg = packages.find((p) => p.key === 'landing_page') || packages[0];
  const starterPkg = packages.find((p) => p.key === 'starter') || packages[1] || packages[0];
  const businessPkg = packages.find((p) => p.key === 'business') || packages[2] || packages[0];
  const proPkg = packages.find((p) => p.key === 'professional') || packages[3] || packages[0];
  const customPkg = packages.find((p) => p.key === 'custom_app') || packages[4] || packages[0];

  let selectedPkg = businessPkg;
  let isCustom = false;
  let status: 'Ready for Customer' | 'Preliminary Estimate' | 'Pending Review' = 'Ready for Customer';
  const assumptions: string[] = [];
  const outstandingQuestions: string[] = [];
  const reasoningPoints: string[] = [];

  const service = data.serviceRequired || '';
  const features = data.features || [];
  const pageCount = data.pageCount || '4-7';

  // Rule 1: High complexity / custom engineering indicators
  const customIndicators = [
    'custom_app',
    'api_automation',
    'admissions_portal',
    'user_auth',
    'payments',
    'database_integration',
    'api_sync',
  ];

  const hasCustomRequirements =
    service === 'custom_app' ||
    service === 'api_automation' ||
    features.some((f) => customIndicators.includes(f)) ||
    pageCount === '15+';

  if (hasCustomRequirements) {
    selectedPkg = customPkg;
    isCustom = true;
    status = 'Preliminary Estimate'; // Rule: custom projects without rigid catalog bounds require scope assessment
    reasoningPoints.push(
      'Your project entails custom application logic, multi-user access or backend workflow automation that exceeds standard website templates.'
    );
    assumptions.push('Starting estimate based on baseline Custom Web Application architecture (R25,000+).');
    outstandingQuestions.push('Detailed API data structures and third-party integration credentials to be reviewed during discovery.');
  } else if (service === 'education_website' || pageCount === '8-15' || features.includes('multi_language')) {
    selectedPkg = proPkg;
    reasoningPoints.push(
      'Recommended Professional Website package: caters to multi-department institutional structures, extended page counts (up to 12 pages), and structured document archives.'
    );
  } else if (service === 'landing_page' || pageCount === '1' || data.budgetRange === 'under_5k') {
    selectedPkg = landingPkg;
    reasoningPoints.push(
      'Recommended Landing Page / Launchpad package (from R 2,500): ideal for a high-impact single-page digital presence, startup launches, and direct WhatsApp lead capture.'
    );
  } else if (pageCount === '1-3' && features.length <= 2 && service !== 'education_website') {
    selectedPkg = starterPkg;
    reasoningPoints.push(
      'Recommended Starter Website package: ideal for a clean, professional 1-3 page online profile with responsive layouts and direct lead capture.'
    );
  } else {
    selectedPkg = businessPkg;
    reasoningPoints.push(
      'Recommended Business Website package: our most popular tier for growing companies needing up to 7 structured pages, showcase galleries, and targeted service enquiry funnels.'
    );
  }

  // Build once-off package line item
  const lineItems: PricingEvaluationResult['lineItems'] = [
    {
      description: `${selectedPkg.name} — Implementation & Architecture`,
      quantity: 1,
      unit_price: selectedPkg.starting_price,
      discount_percent: 0,
      tax_rate: 0, // Note: Tax treatment verified per company settings
      line_total: selectedPkg.starting_price,
      billing_cycle: 'once_off',
    },
  ];

  // Optional Add-ons calculations
  let onceOffSubtotal = selectedPkg.starting_price;
  let recurringMonthly = 0;
  let recurringAnnual = 0;
  const applicableAddOns: PricingEvaluationResult['applicableAddOns'] = [];

  // 1. Hosting
  if (data.needsHosting) {
    const hosting = optionalServices.find((s) => s.key === 'hosting');
    if (hosting) {
      recurringMonthly = roundMoney(recurringMonthly + hosting.price);
      applicableAddOns.push({ name: hosting.name, price: hosting.price, billing_cycle: 'monthly' });
    }
  }

  // 2. Maintenance
  if (data.needsMaintenance) {
    const maintenance = optionalServices.find((s) => s.key === 'maintenance');
    if (maintenance) {
      recurringMonthly = roundMoney(recurringMonthly + maintenance.price);
      applicableAddOns.push({ name: maintenance.name, price: maintenance.price, billing_cycle: 'monthly' });
    }
  }

  // 3. Domain Registration
  if (data.needsDomain || !data.hasDomain) {
    const domain = optionalServices.find((s) => s.key === 'domain');
    if (domain) {
      recurringAnnual = roundMoney(recurringAnnual + domain.price);
      applicableAddOns.push({ name: domain.name, price: domain.price, billing_cycle: 'annual' });
    }
  }

  // 4. Microsoft 365
  if (data.needsM365) {
    const m365 = optionalServices.find((s) => s.key === 'm365');
    if (m365) {
      lineItems.push({
        description: `${m365.name} (DNS & mailbox configuration)`,
        quantity: 1,
        unit_price: m365.price,
        discount_percent: 0,
        tax_rate: 0,
        line_total: m365.price,
        billing_cycle: 'once_off',
      });
      onceOffSubtotal = roundMoney(onceOffSubtotal + m365.price);
      applicableAddOns.push({ name: m365.name, price: m365.price, billing_cycle: 'once_off' });
    }
  }

  const onceOffTotal = onceOffSubtotal;

  assumptions.push('Content assets (copy, high-resolution logos, brand imagery) provided by client unless arranged.');
  assumptions.push('Domain registration renewal charged annually; hosting and maintenance charged on a 30-day notice cycle.');

  const fullReasoning = reasoningPoints.join(' ') +
    (applicableAddOns.length > 0
      ? ` Selected options: ${applicableAddOns.map((a) => `${a.name} (R${a.price}/${a.billing_cycle})`).join(', ')}.`
      : '');

  return {
    recommendedPackage: selectedPkg,
    isCustomScope: isCustom,
    status,
    reasoning: fullReasoning,
    lineItems,
    onceOffSubtotal,
    onceOffTotal,
    recurringMonthly,
    recurringAnnual,
    applicableAddOns,
    assumptions,
    outstandingQuestions,
  };
}
