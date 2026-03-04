const { models } = require("../../../../database/models/index.js");
const { sendSuccessResponse, sendErrorResponse } = require("../traits/responseHandler.js");


class DashboardController {
    static async getCounts(req, res) {
        try {
            const {
                ProductBase,
                Orders,
                Users,
                Blogs,
                News,
                Projects,
                ProductVariants
            } = models;

            const [
                productCount,
                orderCount,
                userCount,
                blogCount,
                newsCount,
                projectCount
            ] = await Promise.all([
                ProductVariants.count(),
                Orders.count(),
                Users.count(),
                Blogs.count(),
                News.count(),
                Projects.count()
            ]);

            const counts = {
                totalProducts: productCount,
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
