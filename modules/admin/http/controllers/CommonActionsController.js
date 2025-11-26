const { models } = require("../../../../database/models");

class CommonActionsController {

        static async updateStatus(req, res) {
          try {
        const { model_name, row_id } = req.params;
        const { status } = req.body;


    

        // Dynamically pick model
        const Model = models[model_name];
        if (!Model) {
            return res.status(400).json({ message: "Invalid model name" });
        }


        const content = await Model.findByPk(row_id);
        if (!content) {
            return res.status(404).json({ message: "Content not found" });
        }
        
        const updated = await Model.update(
            { status },
            { where: { id: row_id } }
        );

        if(!updated) {
            return res.status(400).json({ message: "Failed to update status" });
        }

        return res.json({
            message: "Status updated successfully",
            data: updated,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
    static async updateSortOrder(req, res) {
        try {
        const { model_name, row_id } = req.params;
        const { sort_order } = req.body;

        const Model = models[model_name];
        if (!Model) {
            return res.status(400).json({ message: "Invalid model name" });
        }

        const content = await Model.findByPk(row_id);
        if (!content) {
            return res.status(404).json({ message: "Content not found" });
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

module.exports = CommonActionsController;
