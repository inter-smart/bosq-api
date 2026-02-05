const { formatDate } = require("../mediaButtonHelper");

function buildCouponSections(data) {
  const now = Date.now();

  return {
    coupons: data.map((coupon) => {
      return {
        is_expired: coupon?.end_at,
        discount_value: coupon?.discount_type === "percentage"? `${coupon?.discount_value}%` : `${coupon?.discount_value} AED`,
        title: coupon?.title,
        title_ar: coupon?.title_ar,
        code: coupon?.code,
        is_expired: coupon?.end_at
        ? new Date(coupon?.end_at).getTime() < now
        : false,
        expired_on: formatDate(coupon?.end_at)
      };
    }),
  };
}



module.exports ={
    buildCouponSections
}