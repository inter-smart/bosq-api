const { Op, fn, col, literal } = require("sequelize");
const { models, sequelize } = require("../../../../database/models/index.js");
const { sendSuccessResponse, sendErrorResponse } = require("../traits/responseHandler.js");

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDateRange(year, month) {
  if (month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return { start, end };
  }
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  return { start, end };
}

class DashboardController {
  static async getCounts(req, res) {
    try {
      const { ProductBase, ProductModels, Orders, Users, Blogs, News, Projects, ProductVariants } = models;

      const [baseProductCount, modelCount, variantCount, orderCount, userCount, blogCount, newsCount, projectCount] = await Promise.all([
        ProductBase.count(),
        ProductModels.count(),
        ProductVariants.count(),
        Orders.count(),
        Users.count(),
        Blogs.count(),
        News.count(),
        Projects.count(),
      ]);

      const counts = {
        totalBaseProducts: baseProductCount,
        totalModels: modelCount,
        totalVariants: variantCount,
        totalProducts: variantCount,
        totalOrders: orderCount,
        totalUsers: userCount,
        totalBlogs: blogCount,
        totalNews: newsCount,
        totalProjects: projectCount,
      };

      sendSuccessResponse(res, counts, "Dashboard counts retrieved successfully");
    } catch (error) {
      console.error("Dashboard counts error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getOrderStats(req, res) {
    try {
      const { Orders } = models;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month) : null;

      const { start, end } = getDateRange(year, month);
      const dateWhere = { createdAt: { [Op.gte]: start, [Op.lt]: end } };

      const truncUnit = month ? "day" : "month";

      console.log("Order stats date range:", start, end);
      console.dir(dateWhere, { depth: null });

      // Period bucketed revenue + order counts
      const periodRows = await Orders.findAll({
        where: { ...dateWhere, status: { [Op.ne]: "cancelled" } },
        attributes: [
          [fn("DATE_TRUNC", truncUnit, col("Orders.createdAt")), "period"],
          [fn("COUNT", col("Orders.id")), "orders"],
          [fn("SUM", col("grand_total")), "revenue"],
        ],
        group: [fn("DATE_TRUNC", truncUnit, col("Orders.createdAt"))],
        order: [[fn("DATE_TRUNC", truncUnit, col("Orders.createdAt")), "ASC"]],
        raw: true,
      });

      // Build byPeriod array with proper labels
      const byPeriod = periodRows.map((r) => {
        const d = new Date(r.period);
        const label = month ? `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}` : MONTH_NAMES[d.getMonth()];
        return {
          label,
          orders: parseInt(r.orders),
          revenue: parseFloat(r.revenue) || 0,
        };
      });

      // Status breakdown
      const statusRows = await Orders.findAll({
        where: dateWhere,
        attributes: ["status", [fn("COUNT", col("Orders.id")), "count"]],
        group: ["status"],
        raw: true,
      });
      const byStatus = {};
      for (const r of statusRows) byStatus[r.status] = parseInt(r.count);

      // Payment status breakdown
      const paymentStatusRows = await Orders.findAll({
        where: dateWhere,
        attributes: ["payment_status", [fn("COUNT", col("Orders.id")), "count"]],
        group: ["payment_status"],
        raw: true,
      });
      const byPaymentStatus = {};
      for (const r of paymentStatusRows) byPaymentStatus[r.payment_status] = parseInt(r.count);

      // Payment type breakdown
      const paymentTypeRows = await Orders.findAll({
        where: dateWhere,
        attributes: ["payment_type", [fn("COUNT", col("Orders.id")), "count"]],
        group: ["payment_type"],
        raw: true,
      });
      const byPaymentType = {};
      for (const r of paymentTypeRows) byPaymentType[r.payment_type] = parseInt(r.count);

      // Totals (all orders, not just non-cancelled)
      const totalsRow = await Orders.findOne({
        where: dateWhere,
        attributes: [
          [fn("COUNT", col("Orders.id")), "totalOrders"],
          [fn("SUM", col("grand_total")), "totalRevenue"],
          [fn("AVG", col("grand_total")), "avgOrderValue"],
        ],
        raw: true,
      });

      sendSuccessResponse(res, {
        totalOrders: parseInt(totalsRow.totalOrders) || 0,
        totalRevenue: parseFloat(totalsRow.totalRevenue) || 0,
        avgOrderValue: parseFloat(totalsRow.avgOrderValue) || 0,
        byPeriod,
        byStatus,
        byPaymentStatus,
        byPaymentType,
      });
    } catch (error) {
      console.error("Order stats error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getProductStats(req, res) {
    try {
      const { ProductBase, ProductModels, ProductVariants, OrderItem } = models;
      const year = req.query.year ? parseInt(req.query.year) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;

      const [totalBase, totalModels, totalVariants, activeVariants] = await Promise.all([
        ProductBase.count(),
        ProductModels.count(),
        ProductVariants.count(),
        ProductVariants.count({ where: { status: true } }),
      ]);

      // Low stock variants (stock between 1 and 10)
      const lowStockRaw = await ProductVariants.findAll({
        where: { stock: { [Op.gt]: 0, [Op.lte]: 10 }, status: true },
        attributes: ["id", "title", "sku", "stock"],
        order: [["stock", "ASC"]],
        limit: 10,
        raw: true,
      });

      // Top sellers — join order_items, filter by date if provided
      let orderItemDateWhere = {};
      if (year) {
        const { start, end } = getDateRange(year, month);
        orderItemDateWhere = { createdAt: { [Op.gte]: start, [Op.lt]: end } };
      }

      const topSellerRows = await OrderItem.findAll({
        where: orderItemDateWhere,
        attributes: [
          "variant_id",
          [fn("SUM", col("quantity")), "totalQty"],
          [fn("SUM", literal('"OrderItem"."price" * "OrderItem"."quantity"')), "totalRevenue"],
        ],
        group: ["variant_id", "variant.id", "variant.title", "variant.sku"],
        order: [[fn("SUM", col("quantity")), "DESC"]],
        limit: 10,
        include: [
          {
            model: ProductVariants,
            as: "variant",
            attributes: ["id", "title", "sku"],
            required: true,
          },
        ],
      });

      const topSellers = topSellerRows.map((r) => {
        const json = r.toJSON();
        return {
          id: json.variant_id,
          title: json.variant?.title || "",
          sku: json.variant?.sku || "",
          quantity: parseInt(json.totalQty) || 0,
          revenue: parseFloat(json.totalRevenue) || 0,
        };
      });

      sendSuccessResponse(res, {
        totalBase,
        totalModels,
        totalVariants,
        activeVariants,
        lowStock: lowStockRaw,
        topSellers,
      });
    } catch (error) {
      console.error("Product stats error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getCouponAnalytics(req, res) {
    try {
      const { Coupons, CouponUsage } = models;
      const year = req.query.year ? parseInt(req.query.year) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;
      const now = new Date();

      const [totalCoupons, activeCoupons, expiredCoupons] = await Promise.all([
        Coupons.count(),
        Coupons.count({ where: { status: true, end_at: { [Op.gte]: now } } }),
        Coupons.count({ where: { end_at: { [Op.lt]: now } } }),
      ]);

      // Scope breakdown
      const scopeRows = await Coupons.findAll({
        attributes: ["scope_type", [fn("COUNT", col("id")), "count"]],
        group: ["scope_type"],
        raw: true,
      });
      const byScope = {};
      for (const r of scopeRows) byScope[r.scope_type] = parseInt(r.count);

      // Usage stats with optional date filter on used_at
      let usageDateWhere = {};
      if (year) {
        const { start, end } = getDateRange(year, month);
        usageDateWhere = { used_at: { [Op.gte]: start, [Op.lt]: end } };
      }

      const usageTotals = await CouponUsage.findOne({
        where: usageDateWhere,
        attributes: [
          [fn("COUNT", col("CouponUsage.id")), "totalUsages"],
          [fn("SUM", col("discount_amount")), "totalDiscountGiven"],
        ],
        raw: true,
      });

      // Top coupons by usage
      const topCouponRows = await CouponUsage.findAll({
        where: usageDateWhere,
        attributes: ["coupon_code", [fn("COUNT", col("CouponUsage.id")), "usageCount"], [fn("SUM", col("discount_amount")), "totalDiscount"]],
        group: ["coupon_code"],
        order: [[fn("COUNT", col("CouponUsage.id")), "DESC"]],
        limit: 10,
        raw: true,
      });

      const topCoupons = topCouponRows.map((r) => ({
        code: r.coupon_code,
        usageCount: parseInt(r.usageCount) || 0,
        totalDiscount: parseFloat(r.totalDiscount) || 0,
      }));

      // Period breakdown
      let byPeriod = [];
      if (year) {
        const truncUnit = month ? "day" : "month";
        const periodRows = await CouponUsage.findAll({
          where: usageDateWhere,
          attributes: [
            [fn("DATE_TRUNC", truncUnit, col("used_at")), "period"],
            [fn("COUNT", col("CouponUsage.id")), "usages"],
            [fn("SUM", col("discount_amount")), "discount"],
          ],
          group: [fn("DATE_TRUNC", truncUnit, col("used_at"))],
          order: [[fn("DATE_TRUNC", truncUnit, col("used_at")), "ASC"]],
          raw: true,
        });

        byPeriod = periodRows.map((r) => {
          const d = new Date(r.period);
          const label = month ? `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}` : MONTH_NAMES[d.getMonth()];
          return {
            label,
            usages: parseInt(r.usages) || 0,
            discount: parseFloat(r.discount) || 0,
          };
        });
      }

      sendSuccessResponse(res, {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalUsages: parseInt(usageTotals?.totalUsages) || 0,
        totalDiscountGiven: parseFloat(usageTotals?.totalDiscountGiven) || 0,
        byScope,
        topCoupons,
        byPeriod,
      });
    } catch (error) {
      console.error("Coupon analytics error:", error);
      sendErrorResponse(res, error);
    }
  }

  static async getUserStats(req, res) {
    try {
      const { Users, Orders } = models;
      const year = req.query.year ? parseInt(req.query.year) : null;
      const month = req.query.month ? parseInt(req.query.month) : null;

      const totalUsers = await Users.count();
      const verifiedUsers = await Users.count({ where: { email_verified: true } });

      // New users in period
      let newUsersThisPeriod = 0;
      let byPeriod = [];
      if (year) {
        const { start, end } = getDateRange(year, month);
        const dateWhere = { created_at: { [Op.gte]: start, [Op.lt]: end } };

        newUsersThisPeriod = await Users.count({ where: dateWhere });

        const truncUnit = month ? "day" : "month";
        const periodRows = await Users.findAll({
          where: dateWhere,
          attributes: [
            [fn("DATE_TRUNC", truncUnit, col("created_at")), "period"],
            [fn("COUNT", col("Users.id")), "newUsers"],
          ],
          group: [fn("DATE_TRUNC", truncUnit, col("created_at"))],
          order: [[fn("DATE_TRUNC", truncUnit, col("created_at")), "ASC"]],
          raw: true,
        });

        byPeriod = periodRows.map((r) => {
          const d = new Date(r.period);
          const label = month ? `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}` : MONTH_NAMES[d.getMonth()];
          return { label, newUsers: parseInt(r.newUsers) || 0 };
        });
      }

      // Top customers by spend
      const topCustomerRows = await Orders.findAll({
        attributes: ["user_id", [fn("COUNT", col("Orders.id")), "orderCount"], [fn("SUM", col("grand_total")), "totalSpent"]],
        where: { user_id: { [Op.ne]: null } },
        group: ["user_id", "user.id", "user.first_name", "user.last_name", "user.name", "user.email"],
        order: [[fn("SUM", col("grand_total")), "DESC"]],
        limit: 10,
        include: [
          {
            model: Users,
            as: "user",
            attributes: ["id", "first_name", "last_name", "name", "email"],
            required: true,
          },
        ],
      });

      const topCustomers = topCustomerRows.map((r) => {
        const json = r.toJSON();
        const u = json.user;
        return {
          id: json.user_id,
          name: u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
          email: u.email,
          orderCount: parseInt(json.orderCount) || 0,
          totalSpent: parseFloat(json.totalSpent) || 0,
        };
      });

      sendSuccessResponse(res, {
        totalUsers,
        verifiedUsers,
        newUsersThisPeriod,
        byPeriod,
        topCustomers,
      });
    } catch (error) {
      console.error("User stats error:", error);
      sendErrorResponse(res, error);
    }
  }
}

module.exports = DashboardController;
