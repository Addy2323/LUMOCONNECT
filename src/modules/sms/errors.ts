/**
 * Beem Africa SMS & OTP Error Mapping and Localization Engine
 *
 * Maps documented provider response codes to safe, localized user messages
 * (English and Kiswahili) while preserving sanitized technical details for admins.
 */

export interface BeemErrorInfo {
  code: number
  userMessageEn: string
  userMessageSw: string
  adminDescription: string
  isRetryable: boolean
}

export const BEEM_SMS_ERROR_MAP: Record<number, BeemErrorInfo> = {
  100: {
    code: 100,
    userMessageEn: 'Your message has been submitted for processing.',
    userMessageSw: 'Ujumbe wako umepokelewa na unachakatwa.',
    adminDescription: 'Submitted for processing; not proof of delivery or phone verification.',
    isRetryable: false,
  },
  101: {
    code: 101,
    userMessageEn: 'Invalid mobile number. Please check the recipient number.',
    userMessageSw: 'Namba ya simu si sahihi. Tafadhali hakiki namba ya mpokeaji.',
    adminDescription: 'Invalid phone number.',
    isRetryable: false,
  },
  102: {
    code: 102,
    userMessageEn: 'SMS service temporarily unavailable. Please try again later.',
    userMessageSw: 'Huduma ya SMS haipatikani kwa sasa. Tafadhali jaribu tena baadae.',
    adminDescription: 'Insufficient SMS balance on Beem vendor account.',
    isRetryable: false,
  },
  103: {
    code: 103,
    userMessageEn: 'Network timeout. Please wait a moment before trying again.',
    userMessageSw: 'Muda wa mtandao umekwisha. Tafadhali subiri kidogo kabla ya kujaribu tena.',
    adminDescription: 'Network timeout or provider internal server error.',
    isRetryable: true,
  },
  104: {
    code: 104,
    userMessageEn: 'Unable to send message due to missing details.',
    userMessageSw: 'Haikuweza kutuma ujumbe kutokana na taarifa pungufu.',
    adminDescription: 'Missing required parameters.',
    isRetryable: false,
  },
  109: {
    code: 109,
    userMessageEn: 'Message text cannot be empty.',
    userMessageSw: 'Ujumbe hauwezi kuwa mtupu.',
    adminDescription: 'Invalid or empty message text.',
    isRetryable: false,
  },
  110: {
    code: 110,
    userMessageEn: 'Message contains unsupported special characters.',
    userMessageSw: 'Ujumbe una herufi zisizokubalika.',
    adminDescription: 'Unsupported special characters.',
    isRetryable: false,
  },
  111: {
    code: 111,
    userMessageEn: 'Sender ID is currently inactive or unapproved.',
    userMessageSw: 'Jina la mtumaji (Sender ID) halijaidhinishwa au halitumiki kwa sasa.',
    adminDescription: 'Sender ID not registered or inactive on Beem platform.',
    isRetryable: false,
  },
  112: {
    code: 112,
    userMessageEn: 'Scheduled dispatch time must be in the future.',
    userMessageSw: 'Muda wa ratiba ya kutuma lazima uwe wa baadae.',
    adminDescription: 'Scheduled time is in the past.',
    isRetryable: false,
  },
  113: {
    code: 113,
    userMessageEn: 'Invalid request format.',
    userMessageSw: 'Muundo wa ombi si sahihi.',
    adminDescription: 'Invalid request format.',
    isRetryable: false,
  },
  114: {
    code: 114,
    userMessageEn: 'Too many recipients in a single batch (maximum 1,000).',
    userMessageSw: 'Wapokeaji wengi mno kwa mkupuo mmoja (kiwango cha juu ni 1,000).',
    adminDescription: 'More than 1000 recipients in batch send request.',
    isRetryable: false,
  },
  115: {
    code: 115,
    userMessageEn: 'Destination mobile address is missing.',
    userMessageSw: 'Namba ya mpokeaji haikuwekwa.',
    adminDescription: 'Missing destination address.',
    isRetryable: false,
  },
  116: {
    code: 116,
    userMessageEn: 'Invalid reference ID provided.',
    userMessageSw: 'Namba ya kumbukumbu si sahihi.',
    adminDescription: 'Missing or invalid reference ID.',
    isRetryable: false,
  },
  117: {
    code: 117,
    userMessageEn: 'Invalid schedule time format.',
    userMessageSw: 'Muundo wa muda wa ratiba si sahihi.',
    adminDescription: 'Invalid scheduled time format.',
    isRetryable: false,
  },
  118: {
    code: 118,
    userMessageEn: 'Missing message encoding type.',
    userMessageSw: 'Aina ya usimbaji wa ujumbe haikuwekwa.',
    adminDescription: 'Missing encoding type.',
    isRetryable: false,
  },
  119: {
    code: 119,
    userMessageEn: 'Recipient list cannot be empty.',
    userMessageSw: 'Orodha ya wapokeaji haipaswi kuwa tupu.',
    adminDescription: 'Missing recipients tag in request payload.',
    isRetryable: false,
  },
  120: {
    code: 120,
    userMessageEn: 'Provider authentication failed. Please contact administrator.',
    userMessageSw: 'Uthibitisho wa mfumo umeshindikana. Tafadhali wasiliana na msimamizi.',
    adminDescription: 'Invalid Beem authentication credentials.',
    isRetryable: false,
  },
  121: {
    code: 121,
    userMessageEn: 'Invalid Sender ID format (must be 1-11 alphanumeric characters).',
    userMessageSw: 'Muundo wa jina la mtumaji si sahihi (lazima uwe herufi/namba 1-11).',
    adminDescription: 'Invalid sender ID format.',
    isRetryable: false,
  },
  122: {
    code: 122,
    userMessageEn: 'Sender ID already registered.',
    userMessageSw: 'Jina la mtumaji tayari limeshasajiliwa.',
    adminDescription: 'Duplicate sender ID.',
    isRetryable: false,
  },
  123: {
    code: 123,
    userMessageEn: 'Message template does not exist.',
    userMessageSw: 'Kiolezo cha ujumbe hakipo.',
    adminDescription: 'Template does not exist.',
    isRetryable: false,
  },
}

export const BEEM_OTP_REQUEST_ERROR_MAP: Record<number, BeemErrorInfo> = {
  100: {
    code: 100,
    userMessageEn: 'Verification code dispatched successfully.',
    userMessageSw: 'Namba ya uthibitisho imetumwa kikamilifu.',
    adminDescription: 'OTP message submitted to telco successfully.',
    isRetryable: false,
  },
  101: {
    code: 101,
    userMessageEn: 'Failed to send verification SMS. Please try again.',
    userMessageSw: 'Haikuweza kutuma SMS ya uthibitisho. Tafadhali jaribu tena.',
    adminDescription: 'Failed to send SMS — failed to send generated OTP PIN.',
    isRetryable: true,
  },
  102: {
    code: 102,
    userMessageEn: 'Invalid mobile number. Please enter a valid phone number.',
    userMessageSw: 'Namba ya simu si sahihi. Tafadhali weka namba sahihi.',
    adminDescription: 'Invalid phone number (invalid MSISDN).',
    isRetryable: false,
  },
  103: {
    code: 103,
    userMessageEn: 'Phone number is required.',
    userMessageSw: 'Namba ya simu inahitajika.',
    adminDescription: 'Phone number missing (MSISDN parameter missing).',
    isRetryable: false,
  },
  104: {
    code: 104,
    userMessageEn: 'OTP application configuration error. Contact administrator.',
    userMessageSw: 'Hitilafu ya usanidi wa OTP. Wasiliana na msimamizi.',
    adminDescription: 'Application ID missing.',
    isRetryable: false,
  },
  106: {
    code: 106,
    userMessageEn: 'OTP application not found. Contact administrator.',
    userMessageSw: 'Programu ya OTP haijapatikana. Wasiliana na msimamizi.',
    adminDescription: 'Application not found on Beem OTP platform.',
    isRetryable: false,
  },
  107: {
    code: 107,
    userMessageEn: 'OTP application is currently inactive. Contact administrator.',
    userMessageSw: 'Programu ya OTP imezimwa kwa sasa. Wasiliana na msimamizi.',
    adminDescription: 'Application status is inactive.',
    isRetryable: false,
  },
  108: {
    code: 108,
    userMessageEn: 'OTP delivery channel not configured. Contact administrator.',
    userMessageSw: 'Njia ya kutuma OTP haijawekwa. Wasiliana na msimamizi.',
    adminDescription: 'No channel found for the OTP application.',
    isRetryable: false,
  },
  109: {
    code: 109,
    userMessageEn: 'OTP template configuration error. Contact administrator.',
    userMessageSw: 'Hitilafu ya kiolezo cha OTP. Wasiliana na msimamizi.',
    adminDescription: 'Template definition does not contain a placeholder.',
    isRetryable: false,
  },
  110: {
    code: 110,
    userMessageEn: 'OTP credentials configuration error. Contact administrator.',
    userMessageSw: 'Hitilafu ya vitambulisho vya OTP. Wasiliana na msimamizi.',
    adminDescription: 'Username or Password missing for sending OTP SMS.',
    isRetryable: false,
  },
  120: {
    code: 120,
    userMessageEn: 'Authentication failed. Please contact administrator.',
    userMessageSw: 'Uthibitisho wa mfumo umeshindikana. Tafadhali wasiliana na msimamizi.',
    adminDescription: 'Invalid Authentication Parameters.',
    isRetryable: false,
  },
}

export const BEEM_OTP_VERIFY_ERROR_MAP: Record<number, BeemErrorInfo> = {
  111: {
    code: 111,
    userMessageEn: 'Verification code is required.',
    userMessageSw: 'Namba ya uthibitisho inahitajika.',
    adminDescription: 'PIN missing in verification request.',
    isRetryable: false,
  },
  112: {
    code: 112,
    userMessageEn: 'Challenge reference is missing. Please request a new code.',
    userMessageSw: 'Kumbukumbu ya uthibitisho haipo. Tafadhali omba namba mpya.',
    adminDescription: 'pinId missing in verification request.',
    isRetryable: false,
  },
  113: {
    code: 113,
    userMessageEn: 'Verification challenge has expired or is invalid. Request a new code.',
    userMessageSw: 'Muda wa uthibitisho umekwisha au si sahihi. Tafadhali omba namba mpya.',
    adminDescription: 'pinId not found, inactive, or incorrect.',
    isRetryable: false,
  },
  114: {
    code: 114,
    userMessageEn: 'Incorrect verification code. Please check and try again.',
    userMessageSw: 'Namba ya uthibitisho si sahihi. Tafadhali hakiki na ujaribu tena.',
    adminDescription: 'Incorrect PIN sent.',
    isRetryable: true,
  },
  115: {
    code: 115,
    userMessageEn: 'Verification code has expired. Please request a new code.',
    userMessageSw: 'Namba ya uthibitisho imeisha muda wake. Tafadhali omba namba mpya.',
    adminDescription: 'PIN timeout — PIN has expired.',
    isRetryable: false,
  },
  116: {
    code: 116,
    userMessageEn: 'Too many incorrect attempts. Please request a new code.',
    userMessageSw: 'Umezidi idadi ya majaribio yasiyo sahihi. Tafadhali omba namba mpya.',
    adminDescription: 'PIN verification attempts have exceeded the limit.',
    isRetryable: false,
  },
  117: {
    code: 117,
    userMessageEn: 'Verification successful.',
    userMessageSw: 'Uthibitisho umefanikiwa kikamilifu.',
    adminDescription: 'Valid PIN — verified successfully.',
    isRetryable: false,
  },
  118: {
    code: 118,
    userMessageEn: 'This verification code has already been used. Please request a new code.',
    userMessageSw: 'Namba hii ya uthibitisho tayari imeshatumika. Tafadhali omba namba mpya.',
    adminDescription: 'Duplicate PIN — PIN is used again.',
    isRetryable: false,
  },
}

/**
 * Resolves a user-facing safe message for an SMS error code
 */
export function getBeemSmsErrorMessage(code: number, lang: 'EN' | 'SW' = 'SW'): string {
  const item = BEEM_SMS_ERROR_MAP[code]
  if (!item) {
    return lang === 'SW'
      ? 'Hitilafu ya utumaji ujumbe imetokea. Tafadhali jaribu tena.'
      : 'An error occurred while sending the message. Please try again.'
  }
  return lang === 'SW' ? item.userMessageSw : item.userMessageEn
}

/**
 * Resolves a user-facing safe message for an OTP request error code
 */
export function getBeemOtpRequestErrorMessage(code: number, lang: 'EN' | 'SW' = 'SW'): string {
  const item = BEEM_OTP_REQUEST_ERROR_MAP[code]
  if (!item) {
    return lang === 'SW'
      ? 'Hatukuweza kutuma namba ya uthibitisho. Tafadhali jaribu tena.'
      : 'Failed to send verification code. Please try again.'
  }
  return lang === 'SW' ? item.userMessageSw : item.userMessageEn
}

/**
 * Resolves a user-facing safe message for an OTP verification error code
 */
export function getBeemOtpVerifyErrorMessage(code: number, lang: 'EN' | 'SW' = 'SW'): string {
  const item = BEEM_OTP_VERIFY_ERROR_MAP[code]
  if (!item) {
    return lang === 'SW'
      ? 'Uthibitisho umeshindikana. Tafadhali jaribu tena.'
      : 'Verification failed. Please try again.'
  }
  return lang === 'SW' ? item.userMessageSw : item.userMessageEn
}

export const getLocalizedSmsError = getBeemSmsErrorMessage
export const getLocalizedOtpRequestError = getBeemOtpRequestErrorMessage
export const getLocalizedOtpVerifyError = getBeemOtpVerifyErrorMessage

