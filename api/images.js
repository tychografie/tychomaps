const fs = require('fs').promises;
const path = require('path');
module.exports = async (req, res) => {
    if(req.method === "GET"){
        const files = await fs.readdir(path.join(__dirname, "../places"));
        const jpegFiles = files.filter(file => path.extname(file).toLowerCase().includes('.jp'));
        res.status(200).json(jpegFiles)
    }
}