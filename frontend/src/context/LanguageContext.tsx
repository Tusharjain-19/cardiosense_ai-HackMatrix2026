'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'gu' | 'mr' | 'bn' | 'kn'

export interface LanguageOption {
  code: Language
  label: string
  nativeName: string
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
]

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    brandName: 'Cardiosense AI',
    dashboard: 'Dashboard',
    newAnalysis: 'New Analysis',
    history: 'History',
    doctorPortal: 'Doctor Portal',
    adminPanel: 'Admin Panel',
    logout: 'Logout',
    welcomeBack: 'Welcome back',
    patientMode: 'Patient Mode',
    doctorMode: 'Doctor Mode',
    adminMode: 'Admin Mode',
    uploadNewSignal: 'Upload New Signal',
    historyTrends: 'History & Trends',
    screeningReports: 'Screening Reports',
    signalType: 'Select Signal Type',
    chooseFile: 'Choose Signal File',
    analyzeNow: 'Analyze Recording Now',
    signalQuality: 'Signal Quality Score',
    heartRate: 'Heart Rate Analysis',
    aiPrediction: 'AI Model Prediction',
    downloadPdf: 'Download PDF Report',
    dateAndTime: 'Date & Time',
    filterType: 'Filter Type',
    sortBy: 'Sort By',
    recentAnalyses: 'Recent Analysis Sessions',
  },
  hi: {
    brandName: 'कार्डियोसेंस एआई',
    dashboard: 'डैशबोर्ड',
    newAnalysis: 'नया विश्लेषण',
    history: 'इतिहास',
    doctorPortal: 'डॉक्टर पोर्टल',
    adminPanel: 'एडमिन पैनल',
    logout: 'लॉगआउट',
    welcomeBack: 'नमस्ते, स्वागत है',
    patientMode: 'मरीज़ मोड',
    doctorMode: 'डॉक्टर मोड',
    adminMode: 'एडमिन मोड',
    uploadNewSignal: 'नया सिग्नल अपलोड करें',
    historyTrends: 'इतिहास और रुझान',
    screeningReports: 'स्क्रीनिंग रिपोर्ट',
    signalType: 'सिग्नल प्रकार चुनें',
    chooseFile: 'सिग्नल फ़ाइल चुनें',
    analyzeNow: 'अब विश्लेषण करें',
    signalQuality: 'सिग्नल गुणवत्ता स्कोर',
    heartRate: 'हृदय गति विश्लेषण',
    aiPrediction: 'एआई मॉडल भविष्यवाणी',
    downloadPdf: 'पीडीएफ रिपोर्ट डाउनलोड करें',
    dateAndTime: 'दिनांक और समय',
    filterType: 'फ़िल्टर प्रकार',
    sortBy: 'क्रमबद्ध करें',
    recentAnalyses: 'हाल के विश्लेषण सत्र',
  },
  ta: {
    brandName: 'கார்டியோசென்ஸ் AI',
    dashboard: 'டாஷ்போர்டு',
    newAnalysis: 'புதிய பகுப்பாய்வு',
    history: 'வரலாறு',
    doctorPortal: 'மருத்துவர் தளம்',
    adminPanel: 'நிர்வாகக் குழு',
    logout: 'வெளியேறு',
    welcomeBack: 'நல்வரவு',
    patientMode: 'நோயாளி பயன்முறை',
    doctorMode: 'மருத்துவர் பயன்முறை',
    adminMode: 'நிர்வாகி பயன்முறை',
    uploadNewSignal: 'புதிய சமிக்ஞையைப் பதிவேற்று',
    historyTrends: 'வரலாறு மற்றும் போக்குகள்',
    screeningReports: 'பரிசோதனை அறிக்கைகள்',
    signalType: 'சமிக்ஞை வகையைத் தேர்ந்தெடு',
    chooseFile: 'கோப்பைத் தேர்ந்தெடு',
    analyzeNow: 'இப்போது பகுப்பாய்வு செய்',
    signalQuality: 'சமிக்ஞை தர மதிப்பீடு',
    heartRate: 'இதய துடிப்பு பகுப்பாய்வு',
    aiPrediction: 'AI கணிப்பு',
    downloadPdf: 'PDF அறிக்கையைப் பதிவிறக்கு',
    dateAndTime: 'தேதி மற்றும் நேரம்',
    filterType: 'வடிகட்டி வகை',
    sortBy: 'வரிசைப்படுத்து',
    recentAnalyses: 'சமீபத்திய பகுப்பாய்வுகள்',
  },
  te: {
    brandName: 'కార్డియోసెన్స్ AI',
    dashboard: 'డాష్‌బోర్డ్',
    newAnalysis: 'కొత్త విశ్లేషణ',
    history: 'చరిత్ర',
    doctorPortal: 'వైద్యుల పోర్టల్',
    adminPanel: 'అడ్మిన్ ప్యానెల్',
    logout: 'లాగ్‌అవుట్',
    welcomeBack: 'స్వాగతం',
    patientMode: 'పేషెంట్ మోడ్',
    doctorMode: 'డాక్టర్ మోడ్',
    adminMode: 'అడ్మిన్ మోడ్',
    uploadNewSignal: 'కొత్త సిగ్నల్ అప్‌లోడ్ చేయండి',
    historyTrends: 'చరిత్ర మరియు ట్రెండ్‌లు',
    screeningReports: 'స్క్రీనింగ్ రిపోర్టులు',
    signalType: 'సిగ్నల్ రకాన్ని ఎంచుకోండి',
    chooseFile: 'ఫైల్‌ను ఎంచుకోండి',
    analyzeNow: 'ఇప్పుడే విశ్లేషించండి',
    signalQuality: 'సిగ్నల్ క్వాలిటీ స్కోర్',
    heartRate: 'గుండె వేగం విశ్లేషణ',
    aiPrediction: 'AI అంచనా',
    downloadPdf: 'PDF నివేదికను డౌన్‌లోడ్ చేయండి',
    dateAndTime: 'తేదీ మరియు సమయం',
    filterType: 'ఫిల్టర్ రకం',
    sortBy: 'క్రమబద్ధీకరించు',
    recentAnalyses: 'ఇటీవలి విశ్లేషణలు',
  },
  gu: {
    brandName: 'કાર્ડિઓસેન્સ AI',
    dashboard: 'ડેશબોર્ડ',
    newAnalysis: 'નવું વિશ્લેષણ',
    history: 'ઇતિહાસ',
    doctorPortal: 'ડૉક્ટર પોર્ટલ',
    adminPanel: 'એડમિન પેનલ',
    logout: 'લૉગઆઉટ',
    welcomeBack: 'સ્વાગત છે',
    patientMode: 'દર્દી મોડ',
    doctorMode: 'ડૉક્ટર મોડ',
    adminMode: 'એડમિન મોડ',
    uploadNewSignal: 'નવો સિગ્નલ અપલોડ કરો',
    historyTrends: 'ઇતિહાસ અને પ્રવાહો',
    screeningReports: 'સ્ક્રીનીંગ રિપોર્ટ્સ',
    signalType: 'સિગ્નલ પ્રકાર પસંદ કરો',
    chooseFile: 'સિગ્નલ ફાઇલ પસંદ કરો',
    analyzeNow: 'હવે વિશ્લેષણ કરો',
    signalQuality: 'સિગ્નલ ગુણવત્તા સ્કોર',
    heartRate: 'હૃદયના ધબકારાનું વિશ્લેષણ',
    aiPrediction: 'AI મોડેલ આગાહી',
    downloadPdf: 'PDF રિપોર્ટ ડાઉનલોડ કરો',
    dateAndTime: 'તારીખ અને સમય',
    filterType: 'ફિલ્ટર પ્રકાર',
    sortBy: 'ક્રમમાં ગોઠવો',
    recentAnalyses: 'તાજેતરના વિશ્લેષણ',
  },
  mr: {
    brandName: 'कार्डिओसेन्स AI',
    dashboard: 'डॅशबोर्ड',
    newAnalysis: 'नवीन विश्लेषण',
    history: 'इतिहास',
    doctorPortal: 'डॉक्टर पोर्टल',
    adminPanel: 'ॲडमिन पॅनेल',
    logout: 'लॉगआउट',
    welcomeBack: 'सुस्वागतम',
    patientMode: 'रुग्ण मोड',
    doctorMode: 'डॉक्टर मोड',
    adminMode: 'ॲडमिन मोड',
    uploadNewSignal: 'नवीन सिग्नल अपलोड करा',
    historyTrends: 'इतिहास आणि ट्रेंड',
    screeningReports: 'स्क्रीनिंग अहवाल',
    signalType: 'सिग्नल प्रकार निवडा',
    chooseFile: 'सिग्नल फाइल निवडा',
    analyzeNow: 'आता विश्लेषण करा',
    signalQuality: 'सिग्नल गुणवत्ता स्कोर',
    heartRate: 'हृदयगती विश्लेषण',
    aiPrediction: 'AI मॉडेल भाकीत',
    downloadPdf: 'PDF अहवाल डाउनलोड करा',
    dateAndTime: 'दिनांक आणि वेळ',
    filterType: 'फिल्टर प्रकार',
    sortBy: 'क्रमवारी लावा',
    recentAnalyses: 'नुकतेच केलेले विश्लेषण',
  },
  bn: {
    brandName: 'কার্ডিওসেন্স AI',
    dashboard: 'ড্যাশবোর্ড',
    newAnalysis: 'নতুন বিশ্লেষণ',
    history: 'ইতিহাস',
    doctorPortal: 'ডাক্তার পোর্টাল',
    adminPanel: 'অ্যাডমিন প্যানেল',
    logout: 'লগআউট',
    welcomeBack: 'স্বাগতম',
    patientMode: 'রোগী মোড',
    doctorMode: 'ডাক্তার মোড',
    adminMode: 'অ্যাডমিন মোড',
    uploadNewSignal: 'নতুন সংকেত আপলোড করুন',
    historyTrends: 'ইতিহাস এবং প্রবণতা',
    screeningReports: 'স্ক্রিনিং রিপোর্ট',
    signalType: 'সংকেত প্রকার নির্বাচন করুন',
    chooseFile: 'সংকেত ফাইল নির্বাচন করুন',
    analyzeNow: 'এখন বিশ্লেষণ করুন',
    signalQuality: 'সংকেত গুণমান স্কোর',
    heartRate: 'হৃদস্পন্দন বিশ্লেষণ',
    aiPrediction: 'AI মডেল পূর্বাভাস',
    downloadPdf: 'পিডিএফ রিপোর্ট ডাউনলোড করুন',
    dateAndTime: 'তারিখ ও সময়',
    filterType: 'ফিল্টার প্রকার',
    sortBy: 'সাজান',
    recentAnalyses: 'সাম্প্রতিক বিশ্লেষণ',
  },
  kn: {
    brandName: 'ಕಾರ್ಡಿಯೋಸೆನ್ಸ್ AI',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    newAnalysis: 'ಹೊಸ ವಿಶ್ಲೇಷಣೆ',
    history: 'ಇತಿಹಾಸ',
    doctorPortal: 'ವೈದ್ಯರ ಪೋರ್ಟಲ್',
    adminPanel: 'ಅಡ್ಮಿನ್ ಪ್ಯಾನೆಲ್',
    logout: 'ಲಾಗ್‌ಔಟ್',
    welcomeBack: 'ಸ್ವಾಗತ',
    patientMode: 'ರೋಗಿ ಮೋಡ್',
    doctorMode: 'ವೈದ್ಯರ ಮೋಡ್',
    adminMode: 'ಅಡ್ಮಿನ್ ಮೋಡ್',
    uploadNewSignal: 'ಹೊಸ ಸಿಗ್ನಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    historyTrends: 'ಇತಿಹಾಸ ಮತ್ತು ಪ್ರವೃತ್ತಿಗಳು',
    screeningReports: 'ಸ್ಕ್ರೀನಿಂಗ್ ವರದಿಗಳು',
    signalType: 'ಸಿಗ್ನಲ್ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    chooseFile: 'ಸಿಗ್ನಲ್ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ',
    analyzeNow: 'ಈಗ ವಿಶ್ಲೇಷಿಸಿ',
    signalQuality: 'ಸಿಗ್ನಲ್ ಗುಣಮಟ್ಟದ ಸ್ಕೋರ್',
    heartRate: 'ಹೃದಯ ಬಡಿತ ವಿಶ್ಲೇಷಣೆ',
    aiPrediction: 'AI ಮಾಡೆಲ್ ಮುನ್ನೋಟ',
    downloadPdf: 'PDF ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    dateAndTime: 'ದಿನಾಂಕ ಮತ್ತು ಸಮಯ',
    filterType: 'ಫಿಲ್ಟರ್ ಪ್ರಕಾರ',
    sortBy: 'ವಿಂಗಡಿಸಿ',
    recentAnalyses: 'ಇತ್ತೀಚಿನ ವಿಶ್ಲೇಷಣೆಗಳು',
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('cardiosense_lang') as Language
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('cardiosense_lang', lang)
  }

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en
    return dict[key] || TRANSLATIONS.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
