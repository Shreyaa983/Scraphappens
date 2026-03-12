import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { requireBuyer } from "../middleware/roleMiddleware.js";
import {
  addComment,
  createCommunityPost,
  createResultForDiyPost,
  generateDiyPost,
  getDiyPost,
  getDiyPostResults,
  listComments,
  listCommunityPosts,
  listDiyPosts,
  listSavedDiyPosts,
  saveDiyPostForUser
} from "../controllers/diyController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });
const diyGenerateRateLimiter = createRateLimiter({
  windowMs: 15 * 1000,
  maxRequests: 1,
  keyGenerator: (req) => req.user?.sub || req.ip,
  message: "Please wait a few seconds before generating another DIY idea."
});

router.use(authenticate, requireBuyer);
router.get("/diy", listDiyPosts);
router.post("/diy/generate", diyGenerateRateLimiter, generateDiyPost);
router.get("/diy/:id", getDiyPost);
router.get("/diy/:id/results", getDiyPostResults);
router.post("/diy/:id/result", upload.single("image"), createResultForDiyPost);
router.post("/diy/:id/save", saveDiyPostForUser);
router.get("/diy/saved/me", listSavedDiyPosts);

router.post("/community/post", upload.single("image"), createCommunityPost);
router.get("/community", listCommunityPosts);

router.post("/results/:id/comment", addComment);
router.get("/results/:id/comments", listComments);

export default router;
