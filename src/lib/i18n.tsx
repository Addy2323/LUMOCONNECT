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
  'All Types': 'Aina Zote',
  'Clear filters': 'Futa vichujio',
  'Create Your Account': 'Fungua Akaunti Yako',
  'Commercial Partner': 'Mshirika wa Mauzo',
  'Commercial Partner Network': 'Mtandao wa Washirika wa Mauzo',
  'COMMERCIAL PARTNER NETWORK': 'MTANDAO WA WASHIRIKA WA MAUZO',
  'Join as Commercial Partner': 'Jiunge kama Mshirika wa Mauzo',
  'Select Commercial Partner': 'Chagua Mshirika wa Mauzo',
  'Create Commercial Partner Account': 'Fungua Akaunti ya Mshirika wa Mauzo',
  'Switch to Commercial Partner': 'Badili kwenda kwa Mshirika wa Mauzo',
  'Commercial Partner Overview': 'Muhtasari wa Mshirika wa Mauzo',
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
  'Phone Number (for SMS OTP & Payouts)': 'Namba ya Simu (kwa namba ya siri ya SMS na malipo)',
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
  'Pre-Funded Protection Pool': 'Fedha Zimewekwa Mapema',
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
  'Statutory Deductions / Allowance': 'Makato ya Kisheria na Malipo',
  'Direct merchant settlement confirmed': 'Malipo ya moja kwa moja kutoka kwa mfanyabiashara',
  'Payout Requests & Disbursement Trail': 'Maombi ya Malipo na Historia ya Utumaji',
  'Request Earnings Withdrawal': 'Omba Kutoa Mapato',
  'Available Balance:': 'Salio Linalopatikana:',
  'Withdrawal Amount (TZS)': 'Kiasi cha Kutoa (TZS)',
  'Select Payout Account': 'Chagua Akaunti ya Malipo',
  'Confirm & Request Payout': 'Thibitisha na Uombe Malipo',
  'Monitor verified commissions, referral rewards, and direct mobile money or bank settlements.': 'Angalia kamisheni zilizothibitishwa, malipo ya rufaa, na malipo ya moja kwa moja kwa simu au benki.',
  'Itemized Verified Rewards Ledger': 'Orodha ya Malipo Yaliyothibitishwa',
  'Help Desk, Support & Dispute Center': 'Kituo cha Msaada, Malalamiko na Migogoro',
  'Submit inquiries, request conversion reviews, escalate deal disputes, and communicate with Partner Support.': 'Tuma swali au malalamiko, omba ukaguzi wa mauzo, wasilisha mgogoro wa dili, au zungumza na timu ya msaada.',
  'Open Support Ticket': 'Fungua Ombi la Msaada',
  'No Support Tickets Submitted': 'Hakuna Ombi la Msaada Lililotumwa',
  'Create New Support Request': 'Fungua Ombi Jipya la Msaada',
  'Ticket Category': 'Aina ya Tatizo',
  'Category': 'Kundi',
  'Categories': 'Makundi',
  'All Categories': 'Makundi Yote',
  'Property': 'Mali Isiyohamishika',
  'Vehicles': 'Magari',
  'Products': 'Bidhaa',
  'Agriculture & Commodities': 'Kilimo na Mazao',
  'Business': 'Biashara',
  'Services': 'Huduma',
  'Region': 'Mkoa',
  'All Regions': 'Mikoa Yote',
  'Opportunity Type': 'Aina ya Fursa',
  'Opportunity type': 'Aina ya Fursa',
  'Minimum Reward': 'Kiwango cha Chini cha Zawadi',
  'Minimum reward': 'Kiwango cha Chini cha Zawadi',
  'Any Reward': 'Kiasi Chochote cha Zawadi',
  'Any reward': 'Kiasi Chochote cha Zawadi',
  'All Deals': 'Fursa Zote',
  'VIP Early Access': 'Ufikiaji wa Mapema kwa VIP',
  'Standard Partner Deals': 'Fursa za Washirika wa Kawaida',
  'Search Marketplace': 'Tafuta Fursa',
  'Search marketplace...': 'Tafuta Fursa...',
  'Recommended': 'Zilizopendekezwa',
  'Newest': 'Mpya Zaidi',
  'Highest reward': 'Zawadi ya Juu Zaidi',
  'Ending soon': 'Zinazoisha Hivi Karibuni',
  'Publisher': 'Mchapishaji',
  'Published by Lumo Dealers': 'Imechapishwa na Lumo Dealers',
  'Price': 'Bei',
  'Principal Price': 'Bei',
  'Principal price': 'Bei',
  'Partner Reward': 'Zawadi ya Mshirika',
  'Partner reward': 'Zawadi ya Mshirika',
  'Time Left': 'Muda Uliobaki',
  'Time left': 'Muda Uliobaki',
  'Location': 'Eneo',
  'Join & Promote': 'Jiunge na Utangaze',
  'Enrolled': 'Umejiunga',
  'Enrolled ✓': 'Umejiunga ✓',
  'Already Enrolled': 'Tayari Umejiunga',
  'View in My Deals': 'Tazama Dili Zangu',
  'I Have a Customer': 'Nina Mteja',
  'View Progress': 'Angalia Maendeleo',
  'Chat with Lumo': 'Wasiliana na Lumo',
  'Get Promotional Materials': 'Pata Nyenzo za Matangazo',
  'Golden VIP 24-Hour Exclusivity Window': 'Dirisha Maalum la Saa 24 la Golden VIP',
  '1 Month VIP Free with Annual': 'Mwezi 1 wa VIP Bure ukinunua Mpango wa Mwaka',
  'VIP & Annual subscribers get first-look early access during the first 24 hours of hot deals. Regular partners see deals unlock after 24 hours.': 'Wanachama wa VIP na wa Kila Mwaka wanapata fursa za mapema ndani ya saa 24 za mwanzo. Washirika wa kawaida wataziona fursa baada ya saa 24.',
  'Get Annual (1 Mo VIP Free) →': 'Pata Mpango wa Mwaka (Mwezi 1 Bure) →',
  'Golden VIP Priority Opportunities': 'Fursa Maalum za Golden VIP',
  'All Marketplace Opportunities': 'Fursa Zote za Soko',
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
  'SMS Protection Balance Warnings': 'Tahadhari za SMS kuhusu Salio la Malipo',
  'Notifications': 'Taarifa',
  'Enterprise AI & Custom API Inquiry': 'Ombi la Biashara la AI na API Maalum',
  'Organization / Company': 'Shirika au Kampuni',
  'Work Email': 'Barua Pepe ya Kazi',
  'Custom Requirements or Message': 'Mahitaji Maalum au Ujumbe',
  'Tell us about your team size, expected deal volume, or API integration requirements...': 'Tueleze kuhusu ukubwa wa timu yako, kiasi cha dili kinachotarajiwa, au mahitaji ya kuunganisha API...',
  'Send Enterprise Inquiry': 'Tuma Ombi la Biashara',
  'Inquiry Submitted!': 'Ombi Limetumwa!',
  'Our enterprise onboarding team will reach out to you within 2 business hours.': 'Timu yetu ya biashara itawasiliana nawe ndani ya saa 2 za kazi.',
  'Close': 'Funga',
  'Submit': 'Wasilisha',
  'Send': 'Tuma',
  'Low Data': 'Data Kidogo',
  'Memberships': 'Uanachama',
  'Deals': 'Dili',
  'Opportunities': 'Fursa',
  'Overview': 'Muhtasari',
  'Settings': 'Mipangilio',
  'Profile': 'Wasifu',
  'Help & Support': 'Msaada na Huduma',
  'Documentation': 'Nyaraka',
  'Enquiries and coordination handled by Lumo': 'Mawasiliano na uratibu unasimamiwa na Lumo',
  // Subcategories
  'House': 'Nyumba',
  'Apartment': 'Ghorofa / Fleti',
  'Land': 'Ardhi',
  'Commercial property': 'Mali ya Biashara',
  'Hotel / lodge': 'Hoteli / Loja',
  'Office': 'Ofisi',
  'Warehouse': 'Godown / Ghala',
  'Plot': 'Kiwanja',
  'Cars': 'Magari',
  'Motorcycles': 'Pikipiki',
  'Bajaji': 'Bajaji',
  'Trucks': 'Malori',
  'Spare parts': 'Vipuri',
  'Machinery': 'Mashine',
  'Electronics': 'Vifaa vya Umeme',
  'Phones': 'Simu',
  'Computers': 'Kompyuta',
  'Furniture': 'Samani',
  'Clothes': 'Nguo',
  'Building materials': 'Vifaa vya Ujenzi',
  'Agricultural products': 'Mazao ya Kilimo',
  'Wholesale products': 'Bidhaa za Jumla',
  'Businesses for sale': 'Biashara Zinazouzwa',
  'Suppliers': 'Wauzaji wa Jumla',
  'Distributors': 'Wasambazaji',
  'Franchise opportunities': 'Fursa za Franchise',
  'Partnerships': 'Ushirikiano wa Kibiashara',
  'Wholesale buyers': 'Wanunuzi wa Jumla',
  'Wholesale suppliers': 'Wasambazaji wa Jumla',
  'Construction': 'Ujenzi',
  'Transport': 'Usafirishaji',
  'Photography': 'Picha na Video',
  'IT': 'Teknolojia ya Habari',
  'Marketing': 'Masoko na Matangazo',
  'Legal': 'Sheria',
  'Accounting': 'Uhasibu',
  'Recruitment': 'Ajira na Uajiri',
  'Repair': 'Marekebisho',
  // PWA Translations
  'Install Lumo Dealers': 'Sakinisha Lumo Dealers',
  'Access opportunities and track your referrals directly from your home screen.': 'Fikia fursa na fuatilia rufaa zako moja kwa moja kutoka kwenye skrini ya mwanzo.',
  'Install App': 'Sakinisha Programu',
  'Not Now': 'Si Sasa',
  'Update Available': 'Sasisho Linapatikana',
  'A new version of Lumo Dealers is ready.': 'Toleo jipya la Lumo Dealers lipo tayari.',
  'Update Now': 'Sasisha Sasa',
  'Later': 'Baadaye',
  'Installing on iPhone & iPad': 'Kusakinisha kwenye iPhone na iPad',
  'Tap the Share button': 'Gonga kitufe cha Shiriki',
  "Select 'Add to Home Screen'": "Chagua 'Ongeza kwenye Skrini ya Mwanzo'",
  'Tap Add in the top right corner': 'Gonga Ongeza kwenye kona ya juu kulia',
  'Installing on Desktop': 'Kusakinisha kwenye Kompyuta',
  'Click the install icon in the address bar': 'Bofya aikoni ya kusakinisha kwenye upau wa anwani',
  "Click 'Install' to add Lumo to your computer": "Bofya 'Sakinisha' ili kuongeza Lumo kwenye kompyuta yako",
  'Browser Not Supported for Installation': 'Kivinjari Hakitumiki kwa Usakinishaji',
  'You can continue using Lumo Dealers directly in your browser without installation.': 'Unaweza kuendelea kutumia Lumo Dealers moja kwa moja kwenye kivinjari chako bila kusakinisha.',
  'Continue in Browser': 'Endelea kwenye Kivinjari',
  'App Installed': 'Programu Imesakinishwa',
  'Lumo Dealers is installed on your device.': 'Lumo Dealers imesakinishwa kwenye kifaa chako.',
}

export const translations = {
  sw,
  en: {} as Record<string, string>,
}

export function translateUiText(value: string, locale: LumoLocale): string {
  if (locale === 'en') return value
  return sw[value] ?? value
}

export function getOpportunitiesCountLabel(count: number, locale: LumoLocale): string {
  if (locale === 'sw') {
    return count === 1 ? 'Inaonyeshwa fursa 1' : `Zinaonyeshwa fursa ${count}`
  }
  return `Showing ${count} ${count === 1 ? 'opportunity' : 'opportunities'}`
}

export function getDaysRemainingLabel(days: number | null, locale: LumoLocale): string {
  if (days === null) {
    return locale === 'sw' ? 'Bila tarehe ya mwisho' : 'No expiry date'
  }
  if (days <= 0) {
    return locale === 'sw' ? 'Muda umekwisha' : 'Expired'
  }
  if (locale === 'sw') {
    return days === 1 ? 'Imebaki siku 1' : `Zimebaki siku ${days}`
  }
  return days === 1 ? '1 day remaining' : `${days} days remaining`
}

export function parseLocaleCookie(cookieString: string): LumoLocale | null {
  if (!cookieString) return null
  const match = cookieString.match(/(?:^|; )lumo_locale=(en|sw)(?:;|$)/)
  return match ? (match[1] as LumoLocale) : null
}

export function getLocaleCookie(): LumoLocale | null {
  if (typeof document === 'undefined') return null
  return parseLocaleCookie(document.cookie)
}

export function setLocaleCookie(locale: LumoLocale) {
  if (typeof document === 'undefined') return
  const maxAge = 365 * 24 * 60 * 60
  document.cookie = `lumo_locale=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`
}

interface LanguageContextValue {
  locale: LumoLocale
  setLocale: (locale: LumoLocale) => void
  t: (english: string, kiswahili?: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LumoLocale>('en')

  useEffect(() => {
    const cookieLocale = getLocaleCookie()
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const effective = (cookieLocale === 'en' || cookieLocale === 'sw')
      ? cookieLocale
      : (saved === 'en' || saved === 'sw')
      ? saved
      : 'en'
    setLocaleState(effective as LumoLocale)
    document.documentElement.lang = effective
    setLocaleCookie(effective as LumoLocale)
  }, [])

  const setLocale = (newLocale: LumoLocale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, newLocale)
      setLocaleCookie(newLocale)
      document.documentElement.lang = newLocale
    }
  }

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale,
    t: (english, kiswahili) => locale === 'sw' ? (kiswahili ?? translateUiText(english, 'sw')) : english,
  }), [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
