"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medDocumentController_1 = require("../controllers/medDocumentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
router.post('/', medDocumentController_1.createMedDocument);
router.get('/', medDocumentController_1.getMedDocuments);
router.get('/:id', medDocumentController_1.getMedDocumentById);
router.put('/:id', medDocumentController_1.updateMedDocument); // For updating description and permissions
router.delete('/:id', medDocumentController_1.deleteMedDocument);
// Routes for patients to manage permissions for their documents
router.post('/grant-doctor-permission', medDocumentController_1.grantPermissionToDoctor);
router.post('/revoke-doctor-permission', medDocumentController_1.revokePermissionFromDoctor);
router.post('/grant-checkupcenter-permission', medDocumentController_1.grantPermissionToCheckupCenter);
router.post('/revoke-checkupcenter-permission', medDocumentController_1.revokePermissionFromCheckupCenter);
exports.default = router;
