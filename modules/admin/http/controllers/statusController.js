const { models } = require("../../../../database/models");
const { sendSuccessResponse, sendErrorResponse, sendValidationError } = require("../traits/responseHandler");
const { body, validationResult } = require("express-validator");

class StatusController {

    static async update(req, res) {
          try {
        const { model_name, row_id } = req.params;
        const { status } = req.body;

        // Dynamically pick model
        const Model = models[model_name];
        if (!Model) {
            return res.status(400).json({ message: "Invalid model name" });
        }

        const updated = await Model.update(
            { status },
            { where: { id: row_id } }
        );

        return res.json({
            message: "Status updated successfully",
            data: updated,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
}

module.exports = StatusController;
