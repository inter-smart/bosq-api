const { models } = require("../../../../database/models/index.js");
const { sendSuccessResponse, sendErrorResponse } = require("../traits/responseHandler.js");


class DashboardController {
    static async getCounts(req, res) {
        try {
            const {
                ProductBase,
                ProductModels,
                Orders,
                Users,
                Blogs,
                News,
                Projects,
                ProductVariants
            } = models;

            const [
                baseProductCount,
                modelCount,
                variantCount,
                orderCount,
                userCount,
                blogCount,
                newsCount,
                projectCount
            ] = await Promise.all([
                ProductBase.count(),
                ProductModels.count(),
                ProductVariants.count(),
                Orders.count(),
                Users.count(),
                Blogs.count(),
                News.count(),
                Projects.count()
            ]);

            const counts = {
                totalBaseProducts: baseProductCount,
                totalModels: modelCount,
                totalVariants: variantCount,
                totalProducts: variantCount, // Backward compatibility
                totalOrders: orderCount,
                totalUsers: userCount,
                totalBlogs: blogCount,
                totalNews: newsCount,
                totalProjects: projectCount
            };

            sendSuccessResponse(res, counts, "Dashboard counts retrieved successfully");
        } catch (error) {
            console.error("Dashboard counts error:", error);
            sendErrorResponse(res, error);
        }
    }
}

module.exports = DashboardController;
