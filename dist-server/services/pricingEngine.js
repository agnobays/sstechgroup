import { db } from '../db/database.js';
import { roundMoney } from './calculationService.js';
export function evaluateQuestionnaireAndCalculatePrice(data) {
    // Load current verified packages and optional services from database
    const packages = db.prepare('SELECT * FROM packages WHERE is_active = 1 ORDER BY sort_order ASC').all();
    const optionalServices = db.prepare('SELECT * FROM optional_services WHERE is_active = 1').all();
    const starterPkg = packages.find((p) => p.key === 'starter') || packages[0];
    const businessPkg = packages.find((p) => p.key === 'business') || packages[1];
    const proPkg = packages.find((p) => p.key === 'professional') || packages[2];
    const customPkg = packages.find((p) => p.key === 'custom_app') || packages[3];
    let selectedPkg = businessPkg;
    let isCustom = false;
    let status = 'Ready for Customer';
    const assumptions = [];
    const outstandingQuestions = [];
    const reasoningPoints = [];
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
    const hasCustomRequirements = service === 'custom_app' ||
        service === 'api_automation' ||
        features.some((f) => customIndicators.includes(f)) ||
        pageCount === '15+';
    if (hasCustomRequirements) {
        selectedPkg = customPkg;
        isCustom = true;
        status = 'Preliminary Estimate'; // Rule: custom projects without rigid catalog bounds require scope assessment
        reasoningPoints.push('Your project entails custom application logic, multi-user access or backend workflow automation that exceeds standard website templates.');
        assumptions.push('Starting estimate based on baseline Custom Web Application architecture (R25,000+).');
        outstandingQuestions.push('Detailed API data structures and third-party integration credentials to be reviewed during discovery.');
    }
    else if (service === 'education_website' || pageCount === '8-15' || features.includes('multi_language')) {
        selectedPkg = proPkg;
        reasoningPoints.push('Recommended Professional Website package: caters to multi-department institutional structures, extended page counts (up to 12 pages), and structured document archives.');
    }
    else if (pageCount === '1-3' && features.length <= 2 && service !== 'education_website') {
        selectedPkg = starterPkg;
        reasoningPoints.push('Recommended Starter Website package: ideal for a clean, professional 1-3 page online profile with responsive layouts and direct lead capture.');
    }
    else {
        selectedPkg = businessPkg;
        reasoningPoints.push('Recommended Business Website package: our most popular tier for growing companies needing up to 7 structured pages, showcase galleries, and targeted service enquiry funnels.');
    }
    // Build once-off package line item
    const lineItems = [
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
    const applicableAddOns = [];
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
