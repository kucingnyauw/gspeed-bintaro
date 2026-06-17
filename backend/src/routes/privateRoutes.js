import express from "express";
import CustomerController from "#controller/customerController.js";
import ExpenseController from "#controller/expenseController.js";
import NotificationController from "#controller/notificationController.js";
import OrderController from "#controller/orderController.js";
import PaymentController from "#controller/paymentController.js";
import ProductController from "#controller/productController.js";
import AgentController from "#controller/agentController.js";
import ReportController from "#controller/reportController.js";
import SettingController from "#controller/settingController.js";
import ShiftController from "#controller/shiftController.js";
import StockController from "#controller/stockController.js";
import TaskController from "#controller/taskController.js";
import UserController from "#controller/userController.js";
import VehicleController from "#controller/vehicleController.js";
import authMiddleware from "#middleware/authMiddleware.js";
import roleMiddleware from "#middleware/roleMiddleware.js";
import timeoutMiddleware from "#middleware/timeoutMiddleware.js";
import rateLimiterMiddleware from "#middleware/rateLimiterMiddleware.js";

import {
  fileUploadSingle,
  fileUploadOptional,
} from "#middleware/fileMiddleware.js";

const privateRouter = express.Router();
const version = process.env.API_VERSION;
const prefix = `/api/${version}`;

privateRouter.use(authMiddleware);

const adminOnly = roleMiddleware({ allowedRoles: ["ADMIN"] });
const cashierOnly = roleMiddleware({ allowedRoles: ["CASHIER"] });
const mechanicOnly = roleMiddleware({ allowedRoles: ["MECHANIC"] });
const adminAndCashier = roleMiddleware({ allowedRoles: ["ADMIN", "CASHIER"] });
const adminAndMechanic = roleMiddleware({
  allowedRoles: ["ADMIN", "MECHANIC"],
});
const allRoles = roleMiddleware({
  allowedRoles: ["ADMIN", "CASHIER", "MECHANIC"],
});

const shortTimeout = timeoutMiddleware({ timeoutMs: 10000 });
const mediumTimeout = timeoutMiddleware({ timeoutMs: 20000 });
const longTimeout = timeoutMiddleware({ timeoutMs: 45000 });
const reportTimeout = timeoutMiddleware({ timeoutMs: 60000 });

const generalLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 100 });
const createLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 30 });
const reportLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 20 });
const authLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 10 });

/**
 * ============================================================================
 * 1. CUSTOMERS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/customers`,
  adminAndCashier,
  createLimiter,
  CustomerController.createCustomer
);

privateRouter.put(
  `${prefix}/customers/upsert`,
  adminAndCashier,
  createLimiter,
  CustomerController.upsertCustomer
);

privateRouter.get(
  `${prefix}/customers`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  CustomerController.getCustomers
);

privateRouter.get(
  `${prefix}/customers/phone/check`,
  adminAndCashier,
  generalLimiter,
  CustomerController.checkPhoneAvailability
);

privateRouter.get(
  `${prefix}/customers/phone/:phone`,
  adminAndCashier,
  generalLimiter,
  CustomerController.getCustomerByPhone
);

privateRouter.get(
  `${prefix}/customers/:id`,
  adminAndCashier,
  generalLimiter,
  CustomerController.getCustomerById
);

privateRouter.put(
  `${prefix}/customers/:id`,
  adminAndCashier,
  createLimiter,
  CustomerController.updateCustomer
);

privateRouter.delete(
  `${prefix}/customers/:id`,
  adminAndCashier,
  createLimiter,
  CustomerController.deleteCustomer
);

/**
 * @route DELETE /api/{version}/customers
 * @description Menghapus banyak pelanggan sekaligus
 * @access Admin, Kasir
 */
privateRouter.delete(
  `${prefix}/customers`,
  adminAndCashier,
  createLimiter,
  CustomerController.deleteCustomers
);

/**
 * ============================================================================
 * 2. EXPENSES ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/expenses`,
  cashierOnly,
  createLimiter,
  fileUploadOptional("receipt"),
  ExpenseController.createExpense
);

privateRouter.get(
  `${prefix}/expenses`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  ExpenseController.getExpenses
);

privateRouter.get(
  `${prefix}/expenses/cashier`,
  cashierOnly,
  generalLimiter,
  shortTimeout,
  ExpenseController.getExpensesByCashier
);

privateRouter.get(
  `${prefix}/expenses/shift/:shiftId`,
  adminAndCashier,
  generalLimiter,
  ExpenseController.getExpensesByShift
);

privateRouter.get(
  `${prefix}/expenses/:id`,
  adminAndCashier,
  generalLimiter,
  ExpenseController.getExpenseById
);

privateRouter.put(
  `${prefix}/expenses/:id`,
  cashierOnly,
  createLimiter,
  fileUploadOptional("receipt"),
  ExpenseController.updateExpense
);

privateRouter.delete(
  `${prefix}/expenses/:id`,
  cashierOnly,
  createLimiter,
  ExpenseController.deleteExpense
);

/**
 * @route DELETE /api/{version}/expenses
 * @description Menghapus banyak pengeluaran sekaligus
 * @access Kasir
 */
privateRouter.delete(
  `${prefix}/expenses`,
  cashierOnly,
  createLimiter,
  ExpenseController.deleteExpenses
);

/**
 * ============================================================================
 * 3. NOTIFICATIONS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/notifications`,
  adminOnly,
  createLimiter,
  NotificationController.createNotification
);

privateRouter.post(
  `${prefix}/notifications/bulk`,
  adminOnly,
  createLimiter,
  NotificationController.createBulkNotification
);

privateRouter.get(
  `${prefix}/notifications/me`,
  allRoles,
  generalLimiter,
  shortTimeout,
  NotificationController.getMyNotifications
);

privateRouter.get(
  `${prefix}/notifications/unread-count`,
  allRoles,
  NotificationController.getUnreadCount
);

privateRouter.get(
  `${prefix}/notifications/total-count`,
  allRoles,
  NotificationController.getTotalCount
);

privateRouter.get(
  `${prefix}/notifications/:id`,
  allRoles,
  generalLimiter,
  NotificationController.getNotificationById
);

privateRouter.patch(
  `${prefix}/notifications/read-all`,
  allRoles,
  createLimiter,
  NotificationController.markAllAsRead
);

privateRouter.patch(
  `${prefix}/notifications/:id/read`,
  allRoles,
  createLimiter,
  NotificationController.markAsRead
);

privateRouter.delete(
  `${prefix}/notifications`,
  allRoles,
  createLimiter,
  NotificationController.deleteAllNotifications
);

privateRouter.delete(
  `${prefix}/notifications/:id`,
  allRoles,
  createLimiter,
  NotificationController.deleteNotification
);

/**
 * ============================================================================
 * 4. ORDERS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/orders`,
  cashierOnly,
  createLimiter,
  longTimeout,
  OrderController.createOrder
);

privateRouter.post(
  `${prefix}/orders/calculate`,
  cashierOnly,
  createLimiter,
  mediumTimeout,
  OrderController.calculateTotal
);

privateRouter.get(
  `${prefix}/orders`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  OrderController.getOrders
);

privateRouter.get(
  `${prefix}/orders/active`,
  cashierOnly,
  generalLimiter,
  shortTimeout,
  OrderController.getActiveOrders
);

privateRouter.get(
  `${prefix}/orders/:identifier`,
  adminAndCashier,
  generalLimiter,
  OrderController.getOrder
);

privateRouter.patch(
  `${prefix}/orders/:id/status`,
  allRoles,
  createLimiter,
  longTimeout,
  OrderController.updateOrderStatus
);

privateRouter.patch(
  `${prefix}/orders/:id/close`,
  adminAndCashier,
  createLimiter,
  OrderController.closeOrder
);

/**
 * @route PATCH /api/{version}/orders/close
 * @description Menutup banyak pesanan sekaligus
 * @access Admin, Kasir
 */
privateRouter.patch(
  `${prefix}/orders/close`,
  adminAndCashier,
  createLimiter,
  OrderController.closeOrders
);

privateRouter.post(
  `${prefix}/orders/:id/cancel`,
  adminAndCashier,
  createLimiter,
  longTimeout,
  OrderController.cancelOrder
);

/**
 * @route POST /api/{version}/orders/cancel
 * @description Membatalkan banyak pesanan sekaligus
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/orders/cancel`,
  adminAndCashier,
  createLimiter,
  longTimeout,
  OrderController.cancelOrders
);

privateRouter.post(
  `${prefix}/orders/:id/restore`,
  adminOnly,
  authLimiter,
  OrderController.restoreOrder
);

privateRouter.delete(
  `${prefix}/orders/:id`,
  adminOnly,
  authLimiter,
  OrderController.softDeleteOrder
);

/**
 * ============================================================================
 * 5. PAYMENTS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/payments`,
  cashierOnly,
  createLimiter,
  longTimeout,
  PaymentController.createPayment
);

privateRouter.get(
  `${prefix}/payments`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  PaymentController.getPayments
);

privateRouter.get(
  `${prefix}/payments/order/:orderId`,
  adminAndCashier,
  generalLimiter,
  PaymentController.getPaymentByOrder
);

privateRouter.get(
  `${prefix}/payments/order/:orderId/status`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  PaymentController.getPaymentStatus
);

privateRouter.get(
  `${prefix}/payments/:id`,
  adminAndCashier,
  generalLimiter,
  PaymentController.getPaymentById
);

privateRouter.post(
  `${prefix}/payments/:id/refund`,
  adminAndCashier,
  authLimiter,
  longTimeout,
  PaymentController.refundPayment
);

/**
 * @route POST /api/{version}/payments/refund
 * @description Refund banyak pembayaran sekaligus
 * @access Admin, Kasir
 */
privateRouter.post(
  `${prefix}/payments/refund`,
  adminAndCashier,
  authLimiter,
  longTimeout,
  PaymentController.refundPayments
);

/**
 * ============================================================================
 * 6. PRODUCTS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/products`,
  adminOnly,
  createLimiter,
  fileUploadSingle("image"),
  ProductController.createProduct
);

privateRouter.get(
  `${prefix}/products`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  ProductController.getProducts
);

privateRouter.get(
  `${prefix}/products/services`,
  adminAndCashier,
  generalLimiter,
  ProductController.getServices
);

privateRouter.get(
  `${prefix}/products/spareparts`,
  adminAndCashier,
  generalLimiter,
  ProductController.getSpareparts
);

privateRouter.get(
  `${prefix}/products/low-stock`,
  adminOnly,
  generalLimiter,
  ProductController.getLowStockProducts
);

privateRouter.get(
  `${prefix}/products/check/sku`,
  adminOnly,
  generalLimiter,
  ProductController.checkSkuAvailability
);

privateRouter.get(
  `${prefix}/products/sku/:sku`,
  adminAndCashier,
  generalLimiter,
  ProductController.getProductBySku
);

privateRouter.get(
  `${prefix}/products/:id`,
  adminAndCashier,
  generalLimiter,
  ProductController.getProductById
);

privateRouter.put(
  `${prefix}/products/:id`,
  adminOnly,
  createLimiter,
  fileUploadOptional("image"),
  ProductController.updateProduct
);

privateRouter.patch(
  `${prefix}/products/:id/status`,
  adminOnly,
  createLimiter,
  ProductController.updateProductStatus
);

/**
 * @route PATCH /api/{version}/products/deactivate
 * @description Menonaktifkan banyak produk sekaligus
 * @access Admin
 */
privateRouter.patch(
  `${prefix}/products/deactivate`,
  adminOnly,
  createLimiter,
  ProductController.deactivateProducts
);

/**
 * @route PATCH /api/{version}/products/activate
 * @description Mengaktifkan banyak produk sekaligus
 * @access Admin
 */
privateRouter.patch(
  `${prefix}/products/activate`,
  adminOnly,
  createLimiter,
  ProductController.activateProducts
);

/**
 * ============================================================================
 * 7. REPORTS ROUTES
 * ============================================================================
 */

privateRouter.get(
  `${prefix}/reports/dashboard`,
  allRoles,
  reportLimiter,
  reportTimeout,
  ReportController.getDashboardSummary
);

privateRouter.get(
  `${prefix}/reports/sales`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getSalesSummary
);

privateRouter.get(
  `${prefix}/reports/profit-loss`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getProfitLossReport
);

privateRouter.get(
  `${prefix}/reports/inventory`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getInventoryReport
);

privateRouter.get(
  `${prefix}/reports/expenses`,
  adminOnly,
  reportLimiter,
  mediumTimeout,
  ReportController.getExpenseReport
);

privateRouter.get(
  `${prefix}/reports/payments`,
  adminOnly,
  reportLimiter,
  mediumTimeout,
  ReportController.getPaymentReport
);

privateRouter.get(
  `${prefix}/reports/products/top`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getTopProductsReport
);

privateRouter.get(
  `${prefix}/reports/mechanics/performance`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getMechanicPerformanceReport
);

privateRouter.get(
  `${prefix}/reports/mechanics/:mechanicId/tasks`,
  adminAndMechanic,
  generalLimiter,
  ReportController.getMechanicTaskStats
);

privateRouter.get(
  `${prefix}/reports/mechanics/:mechanicId/earnings`,
  adminAndMechanic,
  generalLimiter,
  mediumTimeout,
  ReportController.getMechanicEarnings
);

privateRouter.get(
  `${prefix}/reports/shift/:shiftId`,
  adminOnly,
  generalLimiter,
  mediumTimeout,
  ReportController.getShiftReport
);

privateRouter.get(
  `${prefix}/reports/stock/:productId/movements`,
  adminOnly,
  generalLimiter,
  mediumTimeout,
  ReportController.getStockMovementReport
);

privateRouter.get(
  `${prefix}/reports/orders/:orderId/tasks`,
  adminAndCashier,
  generalLimiter,
  ReportController.getTaskStatsByOrder
);

/**
 * ============================================================================
 * 7.1 CUSTOMER REPORTS
 * ============================================================================
 */

privateRouter.get(
  `${prefix}/reports/customers`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getCustomerSummary
);

privateRouter.get(
  `${prefix}/reports/customers/top`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getTopCustomers
);

privateRouter.get(
  `${prefix}/reports/customers/:customerId/transactions`,
  adminOnly,
  reportLimiter,
  mediumTimeout,
  ReportController.getCustomerTransactionHistory
);

privateRouter.get(
  `${prefix}/reports/customers/inactive`,
  adminOnly,
  reportLimiter,
  mediumTimeout,
  ReportController.getInactiveCustomers
);

privateRouter.get(
  `${prefix}/reports/customers/lifetime-value`,
  adminOnly,
  reportLimiter,
  reportTimeout,
  ReportController.getCustomerLifetimeValue
);

/**
 * ============================================================================
 * 7.2 VEHICLE REPORTS
 * ============================================================================
 */

privateRouter.get(
  `${prefix}/reports/vehicles`,
  adminOnly,
  reportLimiter,
  mediumTimeout,
  ReportController.getVehicleSummary
);

/**
 * ============================================================================
 * 8. SETTINGS ROUTES
 * ============================================================================
 */

privateRouter.put(
  `${prefix}/settings`,
  adminOnly,
  authLimiter,
  SettingController.bulkUpdate
);

privateRouter.get(
  `${prefix}/settings`,
  adminOnly,
  generalLimiter,
  SettingController.getAll
);

privateRouter.get(
  `${prefix}/settings/:key`,
  adminOnly,
  generalLimiter,
  SettingController.getByKey
);

privateRouter.put(
  `${prefix}/settings/:key`,
  adminOnly,
  authLimiter,
  SettingController.update
);

/**
 * ============================================================================
 * 9. SHIFTS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/shifts/open`,
  cashierOnly,
  createLimiter,
  ShiftController.openShift
);

privateRouter.get(
  `${prefix}/shifts`,
  adminOnly,
  generalLimiter,
  shortTimeout,
  ShiftController.getShifts
);

privateRouter.get(
  `${prefix}/shifts/active`,
  cashierOnly,
  generalLimiter,
  ShiftController.getActiveShift
);

privateRouter.get(
  `${prefix}/shifts/active/check`,
  cashierOnly,
  generalLimiter,
  ShiftController.checkActiveShift
);

privateRouter.get(
  `${prefix}/shifts/cashiers`,
  cashierOnly,
  generalLimiter,
  shortTimeout,
  ShiftController.getShiftListByCashierId
);

privateRouter.get(
  `${prefix}/shifts/starting-cash-suggestion`,
  cashierOnly,
  generalLimiter,
  ShiftController.getStartingCashSuggestion
);

privateRouter.get(
  `${prefix}/shifts/:id`,
  adminAndCashier,
  generalLimiter,
  ShiftController.getShiftById
);

privateRouter.get(
  `${prefix}/shifts/:id/expected-cash`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  ShiftController.getExpectedCash
);

privateRouter.post(
  `${prefix}/shifts/:id/close`,
  cashierOnly,
  createLimiter,
  longTimeout,
  ShiftController.closeShift
);

privateRouter.post(
  `${prefix}/shifts/:id/cash-in`,
  cashierOnly,
  createLimiter,
  ShiftController.recordCashIn
);

privateRouter.post(
  `${prefix}/shifts/:id/cash-out`,
  cashierOnly,
  createLimiter,
  ShiftController.recordCashOut
);

/**
 * ============================================================================
 * 10. STOCK ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/stock/in`,
  adminOnly,
  createLimiter,
  StockController.recordStockIn
);

privateRouter.post(
  `${prefix}/stock/out`,
  adminOnly,
  createLimiter,
  StockController.recordStockOut
);

privateRouter.post(
  `${prefix}/stock/sale`,
  adminAndCashier,
  createLimiter,
  StockController.recordSaleOut
);

privateRouter.post(
  `${prefix}/stock/return`,
  adminAndCashier,
  createLimiter,
  StockController.recordReturnIn
);

privateRouter.post(
  `${prefix}/stock/adjust`,
  adminOnly,
  createLimiter,
  StockController.recordAdjustment
);

privateRouter.get(
  `${prefix}/stock/movements`,
  adminOnly,
  generalLimiter,
  mediumTimeout,
  StockController.getStockMovements
);

privateRouter.get(
  `${prefix}/stock/movements/:id`,
  adminOnly,
  generalLimiter,
  StockController.getStockMovementById
);

privateRouter.get(
  `${prefix}/stock/products/:productId/movements`,
  adminOnly,
  generalLimiter,
  shortTimeout,
  StockController.getMovementsByProduct
);

privateRouter.get(
  `${prefix}/stock/orders/:orderId/movements`,
  adminOnly,
  generalLimiter,
  StockController.getMovementsByOrder
);

privateRouter.delete(
  `${prefix}/stock/movements/:id`,
  adminOnly,
  authLimiter,
  StockController.deleteStockMovement
);

/**
 * @route DELETE /api/{version}/stock/movements
 * @description Menghapus banyak record mutasi stok sekaligus
 * @access Admin
 */
privateRouter.delete(
  `${prefix}/stock/movements`,
  adminOnly,
  authLimiter,
  StockController.deleteStockMovements
);

/**
 * ============================================================================
 * 11. TASKS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/tasks/assign`,
  adminAndCashier,
  createLimiter,
  TaskController.assignMechanic
);

privateRouter.post(
  `${prefix}/tasks/bulk-assign`,
  adminAndCashier,
  createLimiter,
  TaskController.bulkAssignMechanics
);

/**
 * @route POST /api/{version}/tasks/bulk-start
 * @description Memulai banyak order sekaligus
 * @access Mekanik
 */
privateRouter.post(
  `${prefix}/tasks/bulk-start`,
  mechanicOnly,
  createLimiter,
  TaskController.bulkStartOrders
);

/**
 * @route POST /api/{version}/tasks/bulk-complete
 * @description Menyelesaikan banyak order sekaligus
 * @access Mekanik
 */
privateRouter.post(
  `${prefix}/tasks/bulk-complete`,
  mechanicOnly,
  createLimiter,
  TaskController.bulkCompleteOrders
);

privateRouter.get(
  `${prefix}/tasks`,
  allRoles,
  generalLimiter,
  mediumTimeout,
  TaskController.getTasks
);

privateRouter.get(
  `${prefix}/tasks/me`,
  mechanicOnly,
  generalLimiter,
  shortTimeout,
  TaskController.getMyTasks
);

privateRouter.get(
  `${prefix}/tasks/me/history`,
  mechanicOnly,
  generalLimiter,
  mediumTimeout,
  TaskController.getMyTaskHistory
);

privateRouter.get(
  `${prefix}/tasks/unassigned`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  TaskController.getUnassignedTasks
);

privateRouter.get(
  `${prefix}/tasks/mechanics/available`,
  adminAndCashier,
  generalLimiter,
  shortTimeout,
  TaskController.getAvailableMechanics
);

privateRouter.get(
  `${prefix}/tasks/mechanic/:mechanicId`,
  allRoles,
  generalLimiter,
  TaskController.getTasksByMechanic
);

privateRouter.get(
  `${prefix}/tasks/order/:orderId`,
  allRoles,
  generalLimiter,
  TaskController.getTasksByOrderId
);

privateRouter.get(
  `${prefix}/tasks/order-item/:orderItemId/check`,
  adminAndCashier,
  generalLimiter,
  TaskController.checkMechanicAssigned
);

privateRouter.get(
  `${prefix}/tasks/:id`,
  allRoles,
  generalLimiter,
  TaskController.getTaskById
);

privateRouter.post(
  `${prefix}/tasks/order/:orderId/unassign`,
  adminAndCashier,
  createLimiter,
  TaskController.unassignMechanicFromOrder
);

privateRouter.post(
  `${prefix}/tasks/order/:orderId/start`,
  mechanicOnly,
  createLimiter,
  TaskController.startOrder
);

privateRouter.post(
  `${prefix}/tasks/order/:orderId/complete`,
  mechanicOnly,
  createLimiter,
  TaskController.completeOrder
);

/**
 * ============================================================================
 * 12. USERS ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/users`,
  adminOnly,
  createLimiter,
  UserController.createUser
);

privateRouter.get(
  `${prefix}/users`,
  adminOnly,
  generalLimiter,
  shortTimeout,
  UserController.getUsers
);

privateRouter.get(
  `${prefix}/users/me`,
  allRoles,
  generalLimiter,
  UserController.getCurrentUser
);

privateRouter.get(
  `${prefix}/users/employees`,
  allRoles,
  generalLimiter,
  shortTimeout,
  UserController.getEmployees
);

privateRouter.get(
  `${prefix}/users/admins`,
  adminOnly,
  generalLimiter,
  UserController.getAdmins
);

privateRouter.get(
  `${prefix}/users/check/email`,
  adminOnly,
  generalLimiter,
  UserController.checkEmailExists
);

privateRouter.get(
  `${prefix}/users/check/phone`,
  adminOnly,
  generalLimiter,
  UserController.checkPhoneExists
);

privateRouter.get(
  `${prefix}/users/role/:role`,
  adminOnly,
  generalLimiter,
  UserController.getUsersByRole
);

privateRouter.get(
  `${prefix}/users/email/:email`,
  adminOnly,
  generalLimiter,
  UserController.getUserByEmail
);

privateRouter.get(
  `${prefix}/users/phone/:phone`,
  adminOnly,
  generalLimiter,
  UserController.getUserByPhone
);

privateRouter.get(
  `${prefix}/users/:id`,
  allRoles,
  generalLimiter,
  UserController.getUserById
);

privateRouter.put(
  `${prefix}/users/:id`,
  adminOnly,
  createLimiter,
  UserController.updateUser
);

/**
 * @route PATCH /api/{version}/users/deactivate
 * @description Menonaktifkan banyak user sekaligus
 * @access Admin
 */
privateRouter.patch(
  `${prefix}/users/deactivate`,
  adminOnly,
  createLimiter,
  UserController.deactivateUsers
);

/**
 * @route PATCH /api/{version}/users/activate
 * @description Mengaktifkan banyak user sekaligus
 * @access Admin
 */
privateRouter.patch(
  `${prefix}/users/activate`,
  adminOnly,
  createLimiter,
  UserController.activateUsers
);

privateRouter.delete(
  `${prefix}/users/:id`,
  adminOnly,
  authLimiter,
  UserController.deleteUser
);

privateRouter.post(
  `${prefix}/users/:id/resend-magic-link`,
  adminOnly,
  authLimiter,
  UserController.resendMagicLink
);

/**
 * ============================================================================
 * 13. VEHICLES ROUTES
 * ============================================================================
 */

privateRouter.post(
  `${prefix}/vehicles`,
  adminAndCashier,
  createLimiter,
  VehicleController.registerVehicle
);

privateRouter.get(
  `${prefix}/vehicles`,
  adminAndCashier,
  generalLimiter,
  mediumTimeout,
  VehicleController.getVehicles
);

privateRouter.get(
  `${prefix}/vehicles/check/plate`,
  adminAndCashier,
  generalLimiter,
  VehicleController.checkPlateNumberExists
);

privateRouter.get(
  `${prefix}/vehicles/search/plate`,
  adminAndCashier,
  generalLimiter,
  VehicleController.searchByPlateNumber
);

privateRouter.get(
  `${prefix}/vehicles/plate/:plateNumber`,
  adminAndCashier,
  generalLimiter,
  VehicleController.getVehicleByPlateNumber
);

privateRouter.get(
  `${prefix}/vehicles/customer/:customerId`,
  adminAndCashier,
  generalLimiter,
  VehicleController.getVehiclesByCustomer
);

privateRouter.get(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  generalLimiter,
  VehicleController.getVehicleById
);

privateRouter.put(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  createLimiter,
  VehicleController.updateVehicle
);

privateRouter.delete(
  `${prefix}/vehicles/:id`,
  adminAndCashier,
  authLimiter,
  VehicleController.deleteVehicle
);

privateRouter.post(
  `${prefix}/agent/chat`,
  allRoles,
  generalLimiter,
  mediumTimeout,
  AgentController.chat
);

export default privateRouter;
