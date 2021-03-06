const multer = require("multer");
const storage = multer.diskStorage({
  filename(req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({
  limits: { fileSize: 2000000 },
  fileFilter(req, file, cb) {
    const regex = new RegExp(".(png|jpg|jpeg)");
    if (!regex.test(file.originalname)) {
      cb("Only png, jpg, jpeg files are accepted.", false);
    }
    cb(null, true);
  },
  storage
});

module.exports = upload;
