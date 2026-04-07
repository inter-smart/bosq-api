// ============================================
// Response Constants
// ============================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

const RESPONSE_MESSAGES = {
  SUCCESS: {
    DATA_RETRIEVED: {
      en: "Data retrieved successfully",
      ar: "تم جلب البيانات بنجاح",
    },
    DATA_CREATED: {
      en: "Data created successfully",
      ar: "تم إنشاء البيانات بنجاح",
    },
    DATA_UPDATED: {
      en: "Data updated successfully",
      ar: "تم تحديث البيانات بنجاح",
    },
    DATA_DELETED: {
      en: "Data deleted successfully",
      ar: "تم حذف البيانات بنجاح",
    },
    OPERATION_SUCCESSFUL: {
      en: "Operation completed successfully",
      ar: "تمت العملية بنجاح",
    },
    LOGIN_SUCCESSFUL: {
      en: "Login successful",
      ar: "تم تسجيل الدخول بنجاح",
    },
    LOGOUT_SUCCESSFUL: {
      en: "Logout successful",
      ar: "تم تسجيل الخروج بنجاح",
    },
    PROFILE_UPDATED: {
      en: "Profile updated successfully",
      ar: "تم تحديث الملف الشخصي بنجاح",
    },
    PASSWORD_CHANGED: {
      en: "Password changed successfully. Please login again.",
      ar: "تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.",
    },
    STATS_RETRIEVED: {
      en: "Statistics retrieved successfully",
      ar: "تم جلب الإحصائيات بنجاح",
    },
    FEATURED_RETRIEVED: {
      en: "Featured items retrieved successfully",
      ar: "تم جلب العناصر المميزة بنجاح",
    },
    SEARCH_COMPLETED: {
      en: "Search completed successfully",
      ar: "تم إكمال البحث بنجاح",
    },
    ENQUIRY_RECEIVED: {
      en: "Enquiry received successfully",
      ar: "تم استلام الاستفسار بنجاح",
    },
    SUBSCRIPTION_SUCCESSFUL: {
      en: "Newsletter subscription submitted successfully",
      ar: "تم إرسال طلب الاشتراك في النشرة الإخبارية بنجاح",
    },

    PROJECT_ENQUIRY_RECEIVED:    {
      en: "Project enquiry submitted successfully",
      ar: "تم إرسال استفسار المشروع بنجاح",
    },

    PRODUCT_ENQUIRY_RECEIVED: {
      en: "Product enquiry submitted successfully",
      ar: "تم إرسال استفسار المنتج بنجاح",
    },
    REGISTER_SUCCESS: {
      en: "Registration successful. Please verify your OTP.",
      ar: "تم التسجيل بنجاح. يرجى التحقق من رمز OTP.",
    },
    OTP_RESENT: {
      en: "OTP resent successfully",
      ar: "تمت إعادة إرسال رمز OTP بنجاح",
    },
    OTP_VERIFIED: {
      en: "OTP verified successfully",
      ar: "تم التحقق من رمز OTP بنجاح",
    },
    ACCOUNT_CREATED: {
      en: "Account created successfully",
      ar: "تم إنشاء الحساب بنجاح",
    },
    FORGOT_PASSWORD_OTP_SENT: {
      en: "OTP sent to your email",
      ar: "تم إرسال رمز OTP إلى بريدك الإلكتروني",
    },
    RESET_PASSWORD_OTP_VERIFIED: {
      en: "Reset password OTP verified successfully",
      ar: "تم التحقق من رمز OTP لإعادة تعيين كلمة المرور بنجاح",
    },
    PASSWORD_RESET_SUCCESS: {
      en: "Password reset successfully",
      ar: "تم إعادة تعيين كلمة المرور بنجاح",
    },
    GOOGLE_LOGIN_SUCCESSFUL: {
      en: "Google login successful",
      ar: "تم تسجيل الدخول عبر جوجل بنجاح",
    },
  },

  ERROR: {
    INTERNAL_SERVER: {
      en: "Internal server error occurred",
      ar: "حدث خطأ في الخادم الداخلي",
    },
    DATABASE_CONNECTION: {
      en: "Database connection failed",
      ar: "فشل الاتصال بقاعدة البيانات",
    },
    DATABASE_TIMEOUT: {
      en: "Database operation timed out",
      ar: "انتهت مهلة عملية قاعدة البيانات",
    },
    DATA_FETCH_FAILED: {
      en: "Failed to fetch data",
      ar: "فشل في جلب البيانات",
    },
    DATA_NOT_FOUND: {
      en: "Requested data not found",
      ar: "البيانات المطلوبة غير موجودة",
    },
    UNAUTHORIZED_ACCESS: {
      en: "Unauthorized access",
      ar: "وصول غير مصرح به",
    },
    FORBIDDEN_ACCESS: {
      en: "Access forbidden",
      ar: "تم رفض الوصول",
    },
    VALIDATION_FAILED: {
      en: "Validation failed",
      ar: "فشل التحقق من البيانات",
    },
    DUPLICATE_ENTRY: {
      en: "Duplicate entry found",
      ar: "تم العثور على إدخال مكرر",
    },
    INVALID_CREDENTIALS: {
      en: "Invalid credentials provided",
      ar: "بيانات تسجيل الدخول غير صحيحة",
    },
    TOKEN_EXPIRED: {
      en: "Authentication token expired",
      ar: "انتهت صلاحية رمز المصادقة",
    },
    TOKEN_INVALID: {
      en: "Invalid authentication token",
      ar: "رمز المصادقة غير صالح",
    },
    SEARCH_QUERY_TOO_SHORT: {
      en: "Search query must be at least 2 characters long",
      ar: "يجب أن يكون نص البحث مكونًا من حرفين على الأقل",
    },
    INVALID_PARAMETERS: {
      en: "Invalid parameters provided",
      ar: "تم تقديم معلمات غير صالحة",
    },
    RATE_LIMIT_EXCEEDED: {
      en: "Too many requests, please try again later",
      ar: "عدد الطلبات كبير جدًا، يرجى المحاولة لاحقًا",
    },
    SERVICE_UNAVAILABLE: {
      en: "Service temporarily unavailable",
      ar: "الخدمة غير متوفرة مؤقتًا",
    },
    PRODUCT_VARIANT_NOT_FOUND: {
      en: "Product variant not found",
      ar: "لم يتم العثور على متغير المنتج",
    },
    OUT_OF_STOCK: {
      en: "Out of stock limit",
      ar: "تجاوز الحد المتاح في المخزون",
    },
    CART_NOT_FOUND: {
      en: "Cart not found",
      ar: "لم يتم العثور على سلة التسوق",
    },
    CART_ITEM_NOT_FOUND: {
      en: "Cart item not found",
      ar: "لم يتم العثور على عنصر سلة التسوق",
    },
    CART_IS_EMPTY: {
      en: "Cart is empty",
      ar: "سلة التسوق فارغة",
    },
    ITEMS_OUT_OF_STOCK: {
      en: "Some items are out of stock, please update your cart",
      ar: "بعض العناصر غير متوفرة في المخزون، يرجى تحديث سلة التسوق",
    },
    COUPON_ALREADY_APPLIED: {
      en: "A coupon is already applied. Remove it first before applying a new one",
      ar: "تم تطبيق كوبون بالفعل. يرجى إزالته أولاً قبل تطبيق كوبون جديد",
    },
    INVALID_OR_EXPIRED_COUPON: {
      en: "Invalid or expired coupon code",
      ar: "رمز القسيمة غير صالح أو منتهي الصلاحية",
    },
    MINIMUM_ORDER_AMOUNT_REQUIRED: (amount) => ({
      en: `Minimum order amount of ${amount} AED is required for this coupon`,
      ar: `الحد الأدنى للطلب بقيمة ${amount} درهم مطلوب لاستخدام هذه القسيمة`,
    }),
    COUPON_USAGE_LIMIT_REACHED: {
      en: "This coupon has reached its maximum usage limit",
      ar: "لقد وصل هذا الكوبون إلى الحد الأقصى لعدد مرات الاستخدام",
    },
    COUPON_USER_LIMIT_REACHED: {
      en: "You have already used this coupon the maximum number of times",
      ar: "لقد استخدمت هذا الكوبون بالفعل الحد الأقصى من المرات",
    },
    COUPON_NOT_APPLICABLE: {
      en: "This coupon is not applicable to the items in your cart",
      ar: "هذا الكوبون غير قابل للتطبيق على العناصر الموجودة في سلة التسوق",
    },
    MINIMUM_ELIGIBLE_PRODUCTS_AMOUNT_REQUIRED: (amount) => ({
      en: `The total of eligible products must be at least ${amount} to use this coupon`,
      ar: `يجب أن يكون إجمالي المنتجات المؤهلة على الأقل ${amount} لاستخدام هذا الكوبون`,
    }),
    NO_COUPON_APPLIED: {
      en: "No coupon is applied to this cart",
      ar: "لا يوجد كوبون مطبق على سلة التسوق",
    },
    PRODUCT_VARIANT_OUT_OF_STOCK: {
      en: "Product variant out of stock",
      ar: "متغير المنتج غير متوفر في المخزون",
    },
    RECAPTCHA_MISSING: {
      en: "reCAPTCHA token missing",
      ar: "رمز reCAPTCHA مفقود",
    },
    RECAPTCHA_FAILED: {
      en: "reCAPTCHA verification failed. Please try again.",
      ar: "فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.",
    },
    ENQUIRY_ALREADY_EXISTS: {
      en: "You already have an enquiry with this email",
      ar: "لديك استفسار بالفعل بهذا البريد الإلكتروني",
    },
    INVALID_PROJECT: {
      en: "Invalid project",
      ar: "المشروع غير صالح",
    },
    INVALID_PRODUCT: {
      en: "Invalid product",
      ar: "المنتج غير صالح",
    },
    INVALID_CUSTOMIZATION_OPTION: {
      en: "Invalid customization option",
      ar: "خيار التخصيص غير صالح",
    },
    INVALID_STATE: {
      en: "Invalid state",
      ar: "الولاية غير صالحة",
    },
    USER_NOT_FOUND: {
      en: "User not found",
      ar: "لم يتم العثور على المستخدم",
    },
    EMAIL_ALREADY_IN_USE: {
      en: "Email already in use by another account",
      ar: "البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر",
    },
    USER_NO_PASSWORD: {
      en: "User does not have a password set",
      ar: "لم يتم تعيين كلمة مرور للمستخدم",
    },
    CURRENT_PASSWORD_INCORRECT: {
      en: "Current password is incorrect",
      ar: "كلمة المرور الحالية غير صحيحة",
    },
    PASSWORD_SAME_AS_OLD: {
      en: "New password must be different from old password",
      ar: "يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور القديمة",
    },

    EMAIL_ALREADY_EXISTS:{
      en: "This email is already subscribed to the newsletter",
      ar: "هذا البريد الإلكتروني مشترك بالفعل في النشرة الإخبارية",
    },
    INVALID_OTP: {
      en: "Invalid OTP",
      ar: "رمز OTP غير صالح",
    },
    OTP_EXPIRED: {
      en: "OTP has expired",
      ar: "انتهت صلاحية رمز OTP",
    },
    PASSWORD_ALREADY_SET: {
      en: "Password already created",
      ar: "كلمة المرور تم إنشاؤها بالفعل",
    },
    GOOGLE_TOKEN_REQUIRED: {
      en: "Google token is required",
      ar: "رمز Google مطلوب",
    },
    GOOGLE_TOKEN_INVALID: {
      en: "Invalid or expired Google token",
      ar: "رمز Google غير صالح أو منتهي الصلاحية",
    },
    OTP_RATE_LIMITED: {
      en: "Please wait before requesting another OTP",
      ar: "يرجى الانتظار قبل طلب رمز OTP آخر",
    },
    GOOGLE_EMAIL_MISSING: {
      en: "Google account does not have an email address",
      ar: "حساب Google لا يحتوي على عنوان بريد إلكتروني",
    },
    USER_ALREADY_EXISTS: {
      en: "User already exists",
      ar: "المستخدم موجود بالفعل",
    },
    ALL_FIELDS_REQUIRED: {
      en: "All fields are required",
      ar: "جميع الحقول مطلوبة",
    },
    OTP_EMAIL_FAILED: {
      en: "Failed to send OTP email. Please try again.",
      ar: "فشل إرسال بريد OTP. يرجى المحاولة مرة أخرى.",
    },
    PASSWORD_INCORRECT:{
      en: "Password is incorrect",
      ar: "كلمة المرور غير صحيحة",
    },
    GOOGLE_LOGIN_REQUIRED: {
      en: "This account was created with Google Sign-In. Please log in with Google.",
      ar: "تم إنشاء هذا الحساب باستخدام تسجيل الدخول من Google. يرجى تسجيل الدخول عبر Google.",
    },
    ACCOUNT_DEACTIVATED: {
      en: "Your account has been deactivated. Please contact the admin.",
      ar: "تم تعطيل حسابك. يرجى التواصل مع المسؤول.",
    },
  },
};

const ERROR_CODES = {
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DB_CONNECTION_ERROR: "DB_CONNECTION_ERROR",
  DB_TIMEOUT_ERROR: "DB_TIMEOUT_ERROR",
  DATA_FETCH_ERROR: "DATA_FETCH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  DUPLICATE_ERROR: "DUPLICATE_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
};

module.exports = { RESPONSE_MESSAGES, ERROR_CODES };

module.exports = {
  HTTP_STATUS,
  RESPONSE_MESSAGES,
  ERROR_CODES,
};
