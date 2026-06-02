const Employee = require("../../models/admin/Employee");
const HrisDocument = require("../../models/admin/HrisDocument");
const User = require("../../models/User");

const STATUS_OPTIONS = Employee.STATUS_OPTIONS;
const CATEGORY_OPTIONS = HrisDocument.CATEGORY_OPTIONS;
const CATEGORY_LABELS = HrisDocument.CATEGORY_LABELS;

function toEmployee(employee, documentCount) {
  return {
    id: employee._id,
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    middleName: employee.middleName,
    lastName: employee.lastName,
    suffix: employee.suffix,
    fullName: [employee.firstName, employee.middleName, employee.lastName, employee.suffix]
      .filter(Boolean)
      .join(" "),
    position: employee.position,
    department: employee.department,
    dateHired: employee.dateHired,
    status: employee.status,
    email: employee.email,
    contactNumber: employee.contactNumber,
    address: employee.address,
    birthDate: employee.birthDate,
    notes: employee.notes,
    profilePicture: employee.profilePicture || null,
    relatives: Array.isArray(employee.relatives) ? employee.relatives : [],
    documentCount: typeof documentCount === "number" ? documentCount : undefined,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

function pickFileRef(value) {
  if (!value || !value.id) return null;
  return {
    id: String(value.id),
    originalName: String(value.originalName || "").trim(),
    url: String(value.url || "").trim(),
    mimeType: String(value.mimeType || "").trim(),
    size: Number(value.size) || 0,
  };
}

function pickRelatives(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((r) => ({
      name: String(r?.name || "").trim(),
      relationship: String(r?.relationship || "").trim(),
      contactNumber: String(r?.contactNumber || "").trim(),
    }))
    .filter((r) => r.name || r.relationship || r.contactNumber);
}

function toDocument(doc) {
  return {
    id: doc._id,
    employeeId: doc.employee,
    category: doc.category,
    categoryLabel: CATEGORY_LABELS[doc.category] || doc.category,
    title: doc.title,
    documentDate: doc.documentDate,
    description: doc.description,
    attachedFile: doc.attachedFile,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function pickEmployeeFields(body = {}) {
  return {
    employeeId: String(body.employeeId || "").trim(),
    firstName: String(body.firstName || "").trim(),
    middleName: String(body.middleName || "").trim(),
    lastName: String(body.lastName || "").trim(),
    suffix: String(body.suffix || "").trim(),
    position: String(body.position || "").trim(),
    department: String(body.department || "").trim(),
    dateHired: body.dateHired ? new Date(body.dateHired) : null,
    status: STATUS_OPTIONS.includes(body.status) ? body.status : "Active",
    email: String(body.email || "").trim().toLowerCase(),
    contactNumber: String(body.contactNumber || "").trim(),
    address: String(body.address || "").trim(),
    birthDate: body.birthDate ? new Date(body.birthDate) : null,
    notes: String(body.notes || "").trim(),
    profilePicture: pickFileRef(body.profilePicture),
    relatives: pickRelatives(body.relatives),
  };
}

exports.getMeta = async (_req, res) => {
  return res.status(200).json({
    statusOptions: STATUS_OPTIONS,
    categoryOptions: CATEGORY_OPTIONS,
    categoryLabels: CATEGORY_LABELS,
  });
};

exports.listEmployees = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const filter = query
      ? {
          $or: [
            { employeeId: { $regex: query, $options: "i" } },
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { position: { $regex: query, $options: "i" } },
            { department: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const employees = await Employee.find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .limit(500);

    const counts = await HrisDocument.aggregate([
      { $match: { employee: { $in: employees.map((e) => e._id) } } },
      { $group: { _id: "$employee", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    return res.status(200).json({
      query,
      employees: employees.map((e) => toEmployee(e, countMap.get(String(e._id)) || 0)),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load employees.",
      error: error.message,
    });
  }
};

exports.listUnlinkedEmployees = async (_req, res) => {
  try {
    const linkedIds = await User.distinct("employee.employeeId", {
      "employee.employeeId": { $exists: true, $ne: "" },
    });
    const employees = await Employee.find({
      employeeId: { $nin: linkedIds.filter(Boolean) },
    })
      .sort({ lastName: 1, firstName: 1 })
      .limit(500);

    return res.status(200).json({
      employees: employees.map((e) => toEmployee(e, 0)),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load unlinked employees.",
      error: error.message,
    });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    const documents = await HrisDocument.find({ employee: employee._id }).sort({
      category: 1,
      documentDate: -1,
      createdAt: -1,
    });
    return res.status(200).json({
      employee: toEmployee(employee, documents.length),
      documents: documents.map(toDocument),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load employee.",
      error: error.message,
    });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const fields = pickEmployeeFields(req.body);

    if (!fields.employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }
    if (!fields.firstName || !fields.lastName) {
      return res.status(400).json({ message: "First name and last name are required." });
    }

    const existing = await Employee.findOne({ employeeId: fields.employeeId }).select("_id");
    if (existing) {
      return res.status(409).json({
        message: `Employee ID "${fields.employeeId}" already exists.`,
      });
    }

    const employee = await Employee.create(fields);
    return res.status(201).json({
      message: "Employee created successfully.",
      employee: toEmployee(employee, 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create employee.",
      error: error.message,
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const fields = pickEmployeeFields(req.body);

    if (!fields.employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }
    if (!fields.firstName || !fields.lastName) {
      return res.status(400).json({ message: "First name and last name are required." });
    }

    if (fields.employeeId !== employee.employeeId) {
      const clash = await Employee.findOne({
        employeeId: fields.employeeId,
        _id: { $ne: employee._id },
      }).select("_id");
      if (clash) {
        return res.status(409).json({
          message: `Employee ID "${fields.employeeId}" already exists.`,
        });
      }
    }

    Object.assign(employee, fields);
    await employee.save();

    return res.status(200).json({
      message: "Employee updated successfully.",
      employee: toEmployee(employee),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update employee.",
      error: error.message,
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Administrator access is required." });
    }
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    await HrisDocument.deleteMany({ employee: employee._id });
    return res.status(200).json({ message: "Employee and related documents deleted." });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete employee.",
      error: error.message,
    });
  }
};

function pickDocumentFields(body = {}) {
  const category = CATEGORY_OPTIONS.includes(body.category) ? body.category : null;
  return {
    category,
    title: String(body.title || "").trim(),
    documentDate: body.documentDate ? new Date(body.documentDate) : null,
    description: String(body.description || "").trim(),
    attachedFile: body.attachedFile && body.attachedFile.id
      ? {
          id: body.attachedFile.id,
          originalName: String(body.attachedFile.originalName || "").trim(),
          url: String(body.attachedFile.url || "").trim(),
          mimeType: String(body.attachedFile.mimeType || "").trim(),
          size: Number(body.attachedFile.size) || 0,
        }
      : null,
  };
}

exports.createDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const fields = pickDocumentFields(req.body);

    if (!fields.category) {
      return res.status(400).json({ message: "A valid document category is required." });
    }
    if (!fields.title) {
      return res.status(400).json({ message: "Document title is required." });
    }

    const doc = await HrisDocument.create({
      employee: employee._id,
      ...fields,
      attachedFile: fields.attachedFile || undefined,
    });

    return res.status(201).json({
      message: "Document added successfully.",
      document: toDocument(doc),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to add document.",
      error: error.message,
    });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const doc = await HrisDocument.findOne({
      _id: req.params.id,
      employee: req.params.employeeId,
    });
    if (!doc) {
      return res.status(404).json({ message: "Document not found." });
    }

    const fields = pickDocumentFields(req.body);

    if (!fields.category) {
      return res.status(400).json({ message: "A valid document category is required." });
    }
    if (!fields.title) {
      return res.status(400).json({ message: "Document title is required." });
    }

    doc.category = fields.category;
    doc.title = fields.title;
    doc.documentDate = fields.documentDate;
    doc.description = fields.description;
    if (fields.attachedFile) {
      doc.attachedFile = fields.attachedFile;
    } else if (req.body.attachedFile === null) {
      doc.attachedFile = undefined;
    }

    await doc.save();

    return res.status(200).json({
      message: "Document updated successfully.",
      document: toDocument(doc),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update document.",
      error: error.message,
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await HrisDocument.findOneAndDelete({
      _id: req.params.id,
      employee: req.params.employeeId,
    });
    if (!doc) {
      return res.status(404).json({ message: "Document not found." });
    }
    return res.status(200).json({ message: "Document deleted." });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete document.",
      error: error.message,
    });
  }
};
