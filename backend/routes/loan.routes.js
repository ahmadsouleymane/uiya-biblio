import express from "express"
import { borrowBook, returnBook, returnByUserAndIsbn, getUserLoans, getAllLoans, renewLoan, getEmployeeDashboardStats } from "../controllers/loan.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

router.post("/borrow", protect(["employee", "admin"]), borrowBook)
router.put("/:loanId/return", protect(["employee", "admin"]), returnBook)
router.put("/:loanId/renew", protect(["employee", "admin"]), renewLoan)
router.post("/return-by-scan", protect(["employee", "admin"]), returnByUserAndIsbn)
router.get("/dashboard-stats", protect(["employee", "admin"]), getEmployeeDashboardStats)
router.get("/user/:userId", protect(), getUserLoans)
router.get("/", protect(["admin", "employee"]), getAllLoans)

export default router
