const { sequelize, models } = require("../../../../database/models");
const { sendSuccessResponse, sendErrorResponse, sendValidationError } = require("../traits/responseHandler");
const { body, validationResult } = require("express-validator");

class SortOrderController {

    static async update(req, res) {
        try {
        const { model_name, row_id } = req.params;
        const { sort_order } = req.body;

        const Model = models[model_name];
        if (!Model) {
            return res.status(400).json({ message: "Invalid model name" });
        }

        const updated = await Model.update(
            { sort_order },
            { where: { id: row_id } }
        );

        return res.json({
            message: "Sort order updated successfully",
            data: updated,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
}

module.exports = SortOrderController;
