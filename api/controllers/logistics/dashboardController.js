const InventoryItem = require("../../models/logistics/InventoryItem");
const Vehicle = require("../../models/logistics/Vehicle");
const Requisition = require("../../models/logistics/Requisition");
const Supplier = require("../../models/logistics/Supplier");
const MaintenanceLog = require("../../models/logistics/MaintenanceLog");

exports.overview = async (req, res) => {
  try {
    const [
      inventoryByCategory,
      inventoryByStatus,
      vehiclesByStatus,
      requisitionsByStatus,
      lowStockItems,
      recentRequisitions,
      upcomingMaintenance,
      totalSuppliers,
    ] = await Promise.all([
      InventoryItem.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } },
      ]),
      InventoryItem.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Vehicle.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Requisition.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      InventoryItem.find({ status: { $in: ["low-stock", "out-of-stock"] } })
        .sort({ quantity: 1 })
        .limit(10),
      Requisition.find().sort({ createdAt: -1 }).limit(8),
      MaintenanceLog.find({ nextDueAt: { $gte: new Date() } })
        .sort({ nextDueAt: 1 })
        .limit(8),
      Supplier.countDocuments({ isActive: true }),
    ]);

    const inventoryTotal = inventoryByStatus.reduce((sum, row) => sum + row.count, 0);
    const vehicleTotal = vehiclesByStatus.reduce((sum, row) => sum + row.count, 0);
    const requisitionTotal = requisitionsByStatus.reduce((sum, row) => sum + row.count, 0);

    res.json({
      inventory: {
        total: inventoryTotal,
        byCategory: inventoryByCategory,
        byStatus: inventoryByStatus,
        lowStockCount: lowStockItems.length,
        lowStockItems,
      },
      vehicles: {
        total: vehicleTotal,
        byStatus: vehiclesByStatus,
      },
      requisitions: {
        total: requisitionTotal,
        byStatus: requisitionsByStatus,
        recent: recentRequisitions,
        pendingCount: requisitionsByStatus.find((r) => r._id === "pending")?.count || 0,
      },
      suppliers: { total: totalSuppliers },
      maintenance: { upcoming: upcomingMaintenance },
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to compute logistics overview." });
  }
};
