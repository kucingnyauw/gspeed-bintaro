import { lazy } from "react";
import { RoleGuard, PrivateGuard } from "@routes/guard";
import { AppLoadable } from "@components";
import { Role } from "@shared/constant";
import MainLayout from "@layout/MainLayout.jsx";


const Dashboard = AppLoadable(
  lazy(() => import("@views/dashboard/pages/Dashboard.jsx"))
);

const POS = AppLoadable(lazy(() => import("@views/pos/pages/Pos.jsx")));

const Orders = AppLoadable(lazy(() => import("@views/orders/pages/Orders.jsx")));
const OrderHistory = AppLoadable(
  lazy(() => import("@views/orders/pages/OrderHistory.jsx"))
);

const Customers = AppLoadable(
  lazy(() => import("@views/customers/pages/Customers.jsx"))
);
const Vehicles = AppLoadable(
  lazy(() => import("@views/vehicles/pages/Vehicles.jsx"))
);

const Tasks = AppLoadable(lazy(() => import("@views/tasks/pages/Tasks.jsx")));
const MechanicTasks = AppLoadable(
  lazy(() => import("@views/tasks/pages/MechanicTasks.jsx"))
);
const UnassignedTasks = AppLoadable(
  lazy(() => import("@views/tasks/pages/UnassignedTasks.jsx"))
);
const AvailableMechanics = AppLoadable(
  lazy(() => import("@views/tasks/pages/AvailableMechanics.jsx"))
);

const TaskHistory = AppLoadable(
  lazy(() => import("@views/tasks/pages/TasksHistory.jsx"))
);

const Products = AppLoadable(
  lazy(() => import("@views/products/pages/Products.jsx"))
);
const StockMovements = AppLoadable(
  lazy(() => import("@views/stock/pages/StockMovements.jsx"))
);

const Payments = AppLoadable(
  lazy(() => import("@views/payments/pages/Payments.jsx"))
);
const Expenses = AppLoadable(
  lazy(() => import("@views/expenses/pages/Expenses.jsx"))
);

const ExpensesHistory = AppLoadable(
  lazy(() => import("@views/expenses/pages/ExpensesHistory.jsx"))
);

const Shifts = AppLoadable(lazy(() => import("@views/shifts/pages/Shifts.jsx")));
const AllShifts = AppLoadable(
  lazy(() => import("@views/shifts/pages/AllShifts.jsx"))
);

// Reports
const SalesReport = AppLoadable(
  lazy(() => import("@views/reports/pages/SalesReport.jsx"))
);
const ProfitLoss = AppLoadable(
  lazy(() => import("@views/reports/pages/ProfitLoss.jsx"))
);
const InventoryReport = AppLoadable(
  lazy(() => import("@views/reports/pages/InventoryReport.jsx"))
);
const TopProductsReport = AppLoadable(
  lazy(() => import("@views/reports/pages/TopProductsReport.jsx"))
);
const MechanicReport = AppLoadable(
  lazy(() => import("@views/reports/pages/MechanicReport.jsx"))
);
const ExpenseReport = AppLoadable(
  lazy(() => import("@views/reports/pages/ExpenseReport.jsx"))
);
const PaymentReport = AppLoadable(
  lazy(() => import("@views/reports/pages/PaymentReport.jsx"))
);
const CustomerReport = AppLoadable(
  lazy(() => import("@views/reports/pages/CustomerReport.jsx"))
);
const VehicleReport = AppLoadable(
  lazy(() => import("@views/reports/pages/VehicleReport.jsx"))
);

const Users = AppLoadable(lazy(() => import("@views/users/pages/Users.jsx")));
const Settings = AppLoadable(
  lazy(() => import("@views/settings/Settings.jsx"))
);

const TestView = AppLoadable(lazy(() => import("@views/test/Test.jsx")));

const MainRoutes = {
  path: "/",
  element: <MainLayout />,
  children: [
    {
      index: true,
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER, Role.MECHANIC]}>
            <Dashboard />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "dashboard",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER, Role.MECHANIC]}>
            <Dashboard />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "pos",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.CASHIER]}>
            <POS />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "orders",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.CASHIER]}>
            <Orders />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "orders/history",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <OrderHistory />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "customers",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.CASHIER]}>
            <Customers />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "vehicles",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.CASHIER]}>
            <Vehicles />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "tasks",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <Tasks />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "tasks/mechanic",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.MECHANIC]}>
            <MechanicTasks />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "tasks/history",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN, Role.MECHANIC]}>
            <TaskHistory />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "tasks/unassigned",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.CASHIER]}>
            <UnassignedTasks />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "tasks/mechanics/available",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.CASHIER]}>
            <AvailableMechanics />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "products",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <Products />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "stock/movements",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <StockMovements />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "payments",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Payments />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "expenses",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Expenses />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "expenses/history",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <ExpensesHistory />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "shifts",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
            <Shifts />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "shifts/all",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <AllShifts />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    // Reports
    {
      path: "reports/sales",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <SalesReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/profit-loss",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <ProfitLoss />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/inventory",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <InventoryReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/top-products",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <TopProductsReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/mechanics",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <MechanicReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/expenses",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <ExpenseReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/payments",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <PaymentReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/customers",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <CustomerReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "reports/vehicles",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <VehicleReport />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "users",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <Users />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "settings",
      element: (
        <PrivateGuard>
          <RoleGuard allowedRoles={[Role.ADMIN]}>
            <Settings />
          </RoleGuard>
        </PrivateGuard>
      ),
    },
    {
      path: "test",
      element: <TestView />,
    },
  ],
};

export default MainRoutes;