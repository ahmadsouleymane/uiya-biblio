import express from "express"
import { addUser, login, logout, me, getUserById, getAllUsers, updateUserRole, updateMe, deleteUser, forgotPassword, resetPassword, addFavorite, removeFavorite, getFavorites, importUsersFromCsv, getUserStats } from "../controllers/user.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import { uploadCsv } from "../middleware/upload.middleware.js"

const router = express.Router()

router.post("/addUser", addUser)
router.post("/login", login)
router.post("/logout", logout)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)
router.get("/me", me)
router.put("/me", protect(), updateMe)
router.get("/favorites", protect(), getFavorites)
router.post("/favorites/:bookId", protect(), addFavorite)
router.delete("/favorites/:bookId", protect(), removeFavorite)
router.get("/by-id/:id", protect(), getUserById)
router.get("/stats/:userId", protect(), getUserStats)
router.get("/", protect(["admin"]), getAllUsers)
router.put("/:id/role", protect(["admin"]), updateUserRole)
router.delete("/:id", protect(["admin"]), deleteUser)
router.post("/import-csv", protect(["admin"]), uploadCsv.single("file"), importUsersFromCsv)

export default router
