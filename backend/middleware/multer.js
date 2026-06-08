import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg'
        cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`)
    },
})

const upload = multer({ storage })

export default upload