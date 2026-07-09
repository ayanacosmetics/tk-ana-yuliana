const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  try {

    const filePath = path.join(
      process.cwd(),
      "templates",
      "TEMPLATE_BARANG.xls"
    );

    const buffer = fs.readFileSync(filePath);

    res.setHeader(
      "Content-Type",
      "application/vnd.ms-excel"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=TEMPLATE_BARANG.xls"
    );

    return res.status(200).send(buffer);

  } catch (err) {

    return res.status(500).json({
      success:false,
      message:err.message
    });

  }
};