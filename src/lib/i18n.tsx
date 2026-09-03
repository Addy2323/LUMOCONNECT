'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type LumoLocale = 'sw' | 'en'

const STORAGE_KEY = 'lumo_language'

const sw: Record<string, string> = {
  'Home': 'Mwanzo',
  'Discover': 'Tafuta',
  'My Deals': 'Dili Zangu',
  'Earnings': 'Mapato',
  'Account': 'Akaunti',
  'Marketplace': 'Soko la Fursa',
  'Subscriptions': 'Uanachama',
  'Partner Portal': 'Sehemu ya Mshirika wa Mauzo',
  'Partner Workspace': 'Eneo la Mshirika wa Mauzo',
  'Partner account': 'Akaunti ya Mshirika wa Mauzo',
  'Verified partner': 'Mshirika wa Mauzo aliyethibitishwa',
  'Partner Support': 'Msaada kwa Washirika wa Mauzo',
  'Business Hub': 'Kituo cha Biashara',
  'Sign In': 'Ingia',
  'Sign Out': 'Toka',
  'Create Account': 'Fungua Akaunti',
  'Get Started': 'Anza Sasa',
  'Already have an account?': 'Tayari una akaunti?',
  'New to LUMO?': 'Ni mgeni LUMO?',
  'How it works': 'Jinsi inavyofanya kazi',
  'Go to Dashboard': 'Nenda kwenye Dashibodi',
  'Pricing & Subscriptions': 'Bei na Uanachama',
  'Tanzania\'s Performance Commerce Marketplace': 'Soko la biashara linalolipa kwa matokeo Tanzania',
  'Discover Opportunities.': 'Gundua Fursa.',
  'Perform. Earn.': 'Leta Matokeo. Lipwa.',
  'Connect with verified businesses, promote measurable commercial opportunities and earn from genuine results with unlimited deal access.': 'Ungana na biashara zilizothibitishwa, tangaza fursa zinazopimika, na ulipwe kwa matokeo halisi.',
  'Explore Opportunities': 'Tafuta Fursa',
  'Publish a Business Deal': 'Chapisha Dili la Biashara',
  'Partner Membership Plans': 'Mipango ya Mshirika wa Mauzo',
  'Live Opportunities': 'Fursa Zinazopatikana',
  'View all': 'Tazama zote',
  'Potential reward': 'Malipo unayoweza kupata',
  'Live Commercial Opportunities': 'Fursa za Biashara Zinazopatikana',
  'Verified business deals with measurable results across Tanzania and East Africa.': 'Dili za biashara zilizothibitishwa zenye matokeo yanayopimika Tanzania na Afrika Mashariki.',
  'Post an Opportunity': 'Chapisha Fursa',
  'POTENTIAL REWARD': 'MALIPO YANAYOWEZEKANA',
  'PARTNERS': 'WASHIRIKA WA MAUZO',
  'View Details': 'Tazama Maelezo',
  'View Full Deal': 'Tazama Dili Zima',
  'Join Deal': 'Jiunge na Dili',
  'Subscribe to Join': 'Jiunge Uanachama Kushiriki',
  'Save opportunity': 'Hifadhi fursa',
  'Unsave opportunity': 'Ondoa fursa iliyohifadhiwa',
  'Search opportunities': 'Tafuta fursa',
  'Search by title, business or keyword...': 'Tafuta kwa jina, biashara au neno...',
  'All Categories': 'Makundi Yote',
  'All Types': 'Aina Zote',
  'All Regions': 'Maeneo Yote',
  'Clear filters': 'Futa vichujio',
  'Create Your Account': 'Fungua Akaunti Yako',
  'Choose how you want to use LUMO': 'Chagua jinsi unavyotaka kutumia LUMO',
  'Join as Mshirika wa Mauzo / Partner': 'Jiunge kama Mshirika wa Mauzo / Partner',
  'Select Mshirika wa Mauzo / Partner': 'Chagua Mshirika wa Mauzo / Partner',
  'Create Mshirika wa Mauzo / Partner Account': 'Fungua Akaunti ya Mshirika wa Mauzo / Partner',
  'Create Business Account': 'Fungua Akaunti ya Biashara',
  'Join as Business': 'Jiunge kama Biashara',
  'Earn verified commissions on performance-driven commercial deals.': 'Pata kamisheni zilizothibitishwa kwa dili za biashara zinazolipa kwa matokeo.',
  'Publish measurable opportunities, fund rewards, and grow through trusted partners.': 'Chapisha fursa zinazopimika, weka fedha za malipo, na ukuze biashara kupitia Washirika wa Mauzo wanaoaminika.',
  'Full Name': 'Jina Kamili',
  'Email Address': 'Barua Pepe',
  'Password': 'Nenosiri',
  'Confirm password': 'Thibitisha nenosiri',
  'terms': 'masharti',
  'privacy policy': 'sera ya faragha',
  'Business': 'Biashara',
  'Continue': 'Endelea',
  'Back': 'Rudi',
  'Cancel': 'Ghairi',
  'Verify Phone Number': 'Thibitisha Namba ya Simu',
  'Verify phone number': 'Thibitisha namba ya simu',
  'Verify & Proceed': 'Thibitisha na Uendelee',
  'Verifying...': 'Inathibitisha...',
  'Didn\'t receive the SMS code?': 'Hukupokea namba ya SMS?',
  'We have sent a 6-digit verification code via': 'Tumetuma namba ya uthibitisho yenye tarakimu 6 kupitia',
  'Personal Information & Contact': 'Taarifa Binafsi na Mawasiliano',
  'Commercial Profile & Capabilities': 'Wasifu na Uwezo wa Kibiashara',
  'Identity & Business Verification (KYC/KYB)': 'Uthibitishaji wa Utambulisho na Biashara (KYC/KYB)',
  'Identity & Business Verification': 'Uthibitishaji wa Utambulisho na Biashara',
  'Live Face Verification': 'Uthibitishaji wa Uso wa Moja kwa Moja',
  'Camera consent and profile-photo lock': 'Ridhaa ya kamera na kufunga picha ya wasifu',
  'Start camera': 'Washa kamera',
  'Capture and verify': 'Piga picha na uthibitishe',
  'Continue to Face Verification': 'Endelea na Uthibitishaji wa Uso',
  'Continue to Security': 'Endelea na Usalama',
  'Security Setup & Activation': 'Usalama na Kuwasha Akaunti',
  'Activate Account & Enter Partner Portal': 'Washa Akaunti na Uingie Sehemu ya Mshirika wa Mauzo',
  'Phone Number (for Meseji OTP & Payouts)': 'Namba ya Simu (kwa namba ya siri ya SMS na malipo)',
  'Step 1 of 4': 'Hatua ya 1 kati ya 4',
  'Step 2 of 4': 'Hatua ya 2 kati ya 4',
  'Step 3 of 4': 'Hatua ya 3 kati ya 4',
  'Step 4 of 4': 'Hatua ya 4 kati ya 4',
  '1. Opportunity Definition & Category': '1. Maelezo na Aina ya Fursa',
  '2. Deliverables & Commercial Value': '2. Kazi Inayotakiwa na Thamani ya Biashara',
  '3. Compensation, Budget & Commission Engine': '3. Malipo, Bajeti na Kamisheni',
  '4. Review & Publish Deal': '4. Kagua na Chapisha Dili',
  'Deal Title': 'Jina la Dili',
  'Opportunity Model': 'Mfumo wa Fursa',
  'Industry Category': 'Aina ya Sekta',
  'Geographic Region Focus': 'Eneo Linalolengwa',
  'Marketplace Summary (Short Pitch)': 'Muhtasari wa Fursa',
  'Full Deliverable & Validation Conditions': 'Kazi Kamili na Masharti ya Uthibitisho',
  'Verification Terms & Fraud Reversal Policy': 'Masharti ya Uthibitisho na Sera ya Kurejesha Malipo kwa Udanganyifu',
  'Reward Model': 'Mfumo wa Malipo',
  'Commission Rate (%)': 'Kiwango cha Kamisheni (%)',
  'Fixed Reward Amount (TZS)': 'Kiasi Maalum cha Malipo (TZS)',
  'Total Campaign Budget (TZS)': 'Bajeti Yote ya Kampeni (TZS)',
  'Partner Seat Cap': 'Idadi ya Juu ya Washirika wa Mauzo',
  'Deal Preview': 'Muonekano wa Dili',
  'Ready for instant marketplace publishing': 'Tayari kuchapishwa sokoni',
  'Settlement & Economics Preview': 'Muhtasari wa Malipo na Makato',
  'Live breakdown of customer price, fees, taxes, and merchant net proceeds.': 'Mgawanyo wazi wa bei ya mteja, ada, kodi na kiasi halisi cha biashara.',
  'Customer Selling Price': 'Bei ya Kumuuzia Mteja',
  'Gross Partner Reward': 'Malipo Ghafi ya Mshirika wa Mauzo',
  'LUMO Platform Fee (5%)': 'Ada ya Mfumo wa LUMO (5%)',
  'Partner Estimated Net Payout (per conversion)': 'Kiasi Halisi kwa Mshirika wa Mauzo (kwa mauzo yaliyokamilika)',
  'Pre-Funded Escrow': 'Fedha Zimewekwa Mapema',
  'Deducted From Sale': 'Inakatwa Kwenye Mauzo',
  'CONFIDENTIAL REWARD TERMS': 'MASHARTI YA SIRI YA MALIPO',
  'Terms & Conditions': 'Vigezo na Masharti',
  'I accept the deal terms and conditions.': 'Ninakubali vigezo na masharti ya dili.',
  'I understand and accept these commercial terms': 'Nimeelewa na ninakubali masharti haya ya biashara',
  'Commercial Partner Enrollment': 'Kujiunga kama Mshirika wa Mauzo',
  'Accept & Get Link': 'Kubali na Upate Kiungo',
  'Generating Links...': 'Inatengeneza viungo...',
  'Join Deal & Generate Link': 'Jiunge na Dili na Utengeneze Kiungo',
  'Joining Deal...': 'Inakuunganisha na dili...',
  'You are now enrolled in this Deal!': 'Sasa umejiunga na Dili hili!',
  'Your Tracking Code': 'Namba Yako ya Ufuatiliaji',
  'Scan or Share': 'Skani au Tuma',
  'Primary Promotional Channel': 'Njia Kuu ya Kutangaza',
  'Custom Promo Code (Optional)': 'Namba Maalum ya Matangazo (Si Lazima)',
  'Brief Pitch / Target Audience Notes': 'Ujumbe Mfupi / Maelezo ya Wateja Unaowalenga',
  'Earnings, Commissions & Payouts': 'Mapato, Kamisheni na Malipo',
  'Request Payout': 'Omba Malipo',
  'Available Payable Earnings': 'Mapato Yanayoweza Kulipwa',
  'Approved & Ready to Withdraw': 'Yameidhinishwa na yako tayari kutolewa',
  'Pending Validation': 'Yanasubiri Uthibitisho',
  'Under 7-day cooling period': 'Yako kwenye muda wa ukaguzi wa siku 7',
  'Total Earnings Paid Out': 'Jumla ya Mapato Yaliyolipwa',
  'Disbursed to M-Pesa / Bank': 'Yametumwa M-Pesa / Benki',
  'TRA Withholding Tax (5%)': 'Kodi ya Zuio ya TRA (5%)',
  'Official tax certificates issued': 'Vyeti rasmi vya kodi vinatolewa',
  'Payout Requests & Disbursement Trail': 'Maombi ya Malipo na Historia ya Utumaji',
  'Request Earnings Withdrawal': 'Omba Kutoa Mapato',
  'Available Balance:': 'Salio Linalopatikana:',
  'Withdrawal Amount (TZS)': 'Kiasi cha Kutoa (TZS)',
  'Select Payout Account': 'Chagua Akaunti ya Malipo',
  'Confirm & Request Payout': 'Thibitisha na Uombe Malipo',
  'Monitor verified commissions, statutory TRA withholding tax deductions, and request mobile money or bank payouts.': 'Angalia kamisheni zilizothibitishwa, makato ya kodi ya TRA, na omba malipo kwa simu au benki.',
  'Itemized Verified Rewards Ledger': 'Orodha ya Malipo Yaliyothibitishwa',
  'Help Desk, Support & Dispute Center': 'Kituo cha Msaada, Malalamiko na Migogoro',
  'Submit inquiries, request conversion reviews, escalate deal disputes, and communicate with Partner Support.': 'Tuma swali au malalamiko, omba ukaguzi wa mauzo, wasilisha mgogoro wa dili, au zungumza na timu ya msaada.',
  'Open Support Ticket': 'Fungua Ombi la Msaada',
  'No Support Tickets Submitted': 'Hakuna Ombi la Msaada Lililotumwa',
  'Create New Support Request': 'Fungua Ombi Jipya la Msaada',
  'Category': 'Aina ya Tatizo',
  'Subject / Summary': 'Kichwa / Muhtasari',
  'Detailed Explanation & Evidence Links': 'Maelezo Kamili na Viungo vya Ushahidi',
  'Submit Request': 'Tuma Ombi',
  'Rewards & Earnings': 'Malipo na Mapato',
  'Deal Dispute / Contract Mediation': 'Mgogoro wa Dili / Usuluhishi wa Mkataba',
  'Tracking & Conversion Verification': 'Ufuatiliaji na Uthibitishaji wa Mauzo',
  'Account & KYC Verification': 'Akaunti na Uthibitishaji wa KYC',
  'Technical Platform Support': 'Msaada wa Kiufundi wa Mfumo',
  'Validation Error': 'Hitilafu ya Taarifa',
  'Ticket Submitted': 'Ombi Limetumwa',
  'No Notifications Yet': 'Hakuna Taarifa Bado',
  'Mark All as Read': 'Weka Zote kuwa Zimesomwa',
  'SMS notifications': 'Taarifa za SMS',
  'WhatsApp notifications': 'Taarifa za WhatsApp',
  'WhatsApp Status & Direct Client Messaging': 'WhatsApp Status na Ujumbe wa Moja kwa Moja',
  'Share on WhatsApp': 'Tuma kwa WhatsApp',
  'SMS Escrow Balance Warnings': 'Tahadhari za SMS kuhusu Salio la Malipo',
  'Notifications': 'Taarifa',
}

export function translateUiText(value: string, locale: LumoLocale): string {
  if (locale === 'en') return value
  return sw[value] ?? value
}

interface LanguageContextValue {
  locale: LumoLocale
  setLocale: (locale: LumoLocale) => void
  t: (english: string, kiswahili?: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LumoLocale>('sw')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'sw') setLocaleState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale: setLocaleState,
    t: (english, kiswahili) => locale === 'sw' ? (kiswahili ?? translateUiText(english, 'sw')) : english,
  }), [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
