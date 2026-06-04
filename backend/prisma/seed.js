import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { faker } from "@faker-js/faker/locale/id_ID";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "rifkyf589@gmail.com";

// ============================================================
// UTILITY: Code Generator (DIPERBAIKI - ANTI DUPLICATE)
// ============================================================
function generateOrderNumber(date, counter) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seq = String(counter).padStart(4, "0");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 karakter hex
  return `ORD-${yyyy}${mm}${dd}-${seq}-${rand}`;
}

function generateSku(type, index) {
  const prefix = type === "SPAREPART" ? "SP" : "SV";
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

// ============================================================
// DATA MASTER
// ============================================================
const sparepartNames = [
  "Kampas Rem Depan Vespa Sprint",
  "Kampas Rem Belakang Vespa Primavera",
  "Kampas Rem Depan Racing Malossi",
  "Oli Mesin Motul 2T",
  "Oli Mesin Motul 4T",
  "Oli Mesin Castrol Power 1",
  "Oli Gardan Vespa Matic",
  "Busi NGK Racing Vespa",
  "Busi Denso Iridium Racing",
  "Busi NGK Platinum Vespa",
  "Filter Udara Malossi Racing",
  "Filter Udara Standar Vespa",
  "Filter Oli Vespa Matic",
  "Filter Bensin Vespa",
  "Rantai Keteng Vespa PX",
  "Rantai Keteng Vespa Sprint",
  "Gear Set Rasio 4.0 Racing",
  "Gear Set Rasio 3.8 Standar",
  "Gear Set Rasio 4.2 Drag",
  "Ban Luar Pirelli Angel Scooter 110/70",
  "Ban Luar Michelin City Grip 120/70",
  "Ban Luar Metzeler Sportec 130/70",
  "Ban Dalam Vespa 10 Inch",
  "Ban Dalam Vespa 12 Inch",
  "Aki Kering MotoBatt 12V",
  "Aki Kering Yuasa YTZ7S",
  "Aki Kering GS Astra",
  "Lampu Depan LED Proyektor Vespa",
  "Lampu Belakang LED Vespa GTS",
  "Lampu Sein LED Sequential",
  "Kampas Kopling Malossi Fly Clutch",
  "Kampas Kopling Racing Polini",
  "Shockbreaker Depan Bitubo Vespa GTS",
  "Shockbreaker Belakang Ohlins Vespa",
  "Shockbreaker Depan YSS Racing",
  "Bearing Roda Depan SKF Premium",
  "Bearing Roda Belakang NTN Japan",
  "Bearing Steering Koyo",
  "Kabel Gas Domino Racing",
  "Kabel Rem Depan Vespa Original",
  "Kabel Kopling Vespa PX",
  "Piston Kit Polini 200cc Racing",
  "Piston Kit Malossi 175cc",
  "Piston Kit Standar 150cc",
  "Spion Oval Chrome Vespa",
  "Spion Lipat Racing CNC",
  "Spion Bar End MotoGadget",
  "Knalpot Racing Akrapovic Vespa",
  "Knalpot Racing Yoshimura Vespa",
  "Knalpot Racing Leo Vince",
  "CDI Racing BRT Powermax",
  "CDI Racing Rextor Adjustable",
  "CDI Standar Vespa Original",
  "Paking Mesin Set Vespa PX",
  "Paking Mesin Set Vespa Sprint",
  "Seal Mesin Vespa 2T Full Set",
  "Roller CVT Malossi 12gr",
  "Roller CVT Polini 10gr",
  "Roller CVT Dr Pulley 11gr",
  "Belt CVT Vespa Matic Racing",
];

const serviceNames = [
  "Service Ringan Vespa Matic",
  "Service Ringan Vespa 2-Tak",
  "Service Ringan Vespa 4-Tak",
  "Tune Up Mesin 2-Tak",
  "Tune Up Mesin 4-Tak",
  "Tune Up Racing Performance",
  "Ganti Oli Mesin & Gardan",
  "Ganti Oli Mesin Sintetik",
  "Ganti Oli Mesin Racing",
  "Cuci Motor Detailing Premium",
  "Cuci Motor Biasa",
  "Cuci Motor + Poles Body",
  "Balancing & Spooring Roda",
  "Overhaul Mesin 2-Tak Full",
  "Overhaul Mesin 4-Tak Full",
  "Overhaul Mesin Racing",
  "Tambal Ban Tubeless",
  "Tambal Ban Biasa",
  "Ganti Ban Baru + Balancing",
  "Service CVT & Pulley",
  "Service Karburator Vespa",
  "Service Injeksi Vespa Matic",
  "Ganti Kampas Rem Depan & Belakang",
  "Bore Up Mesin 175cc",
  "Bore Up Mesin 200cc Racing",
  "Setting Karburator Racing",
  "Setting ECU Racing Vespa",
  "Pemasangan Knalpot Racing",
  "Pemasangan CDI Racing",
  "Overhaul Suspensi Depan",
  "Ganti Seal Shockbreaker",
  "Setting Suspensi Racing",
  "Pengecatan Body Vespa",
  "Pemasangan Aksesoris Racing",
  "Modifikasi Custom Vespa",
];

const defaultSettings = [
  { key: "tax_rate", value: "11" },
  { key: "mechanic_max_tasks", value: "5" },
  { key: "shift_min_starting_cash", value: "1000000" },
  { key: "stock_low_threshold", value: "5" },
  { key: "shop_name", value: "Bengkel Vespa Jaya Motor" },
  { key: "shop_address", value: "Jl. Raya Vespa No. 123, Bandung" },
  { key: "shop_phone", value: "022-12345678" },
  { key: "opening_time", value: "08:00" },
  { key: "closing_time", value: "20:00" },
];

// 26 Users: 2 Admin, 5 Kasir, 19 Mekanik
const userData = [
  { email: ADMIN_EMAIL, fullName: "Admin Utama", phone: "081234500001", role: "ADMIN", isActive: true, isAuthenticated: true },
  { email: "admin2@bengkel.com", fullName: "Admin Kedua", phone: "081234500002", role: "ADMIN", isActive: true, isAuthenticated: true },
  { email: "kasir1@bengkel.com", fullName: "Budi Santoso", phone: "081234500003", role: "CASHIER", isActive: true },
  { email: "kasir2@bengkel.com", fullName: "Siti Rahayu", phone: "081234500004", role: "CASHIER", isActive: true },
  { email: "kasir3@bengkel.com", fullName: "Agus Wijaya", phone: "081234500005", role: "CASHIER", isActive: true },
  { email: "kasir4@bengkel.com", fullName: "Dewi Lestari", phone: "081234500006", role: "CASHIER", isActive: true },
  { email: "kasir5@bengkel.com", fullName: "Rina Marlina", phone: "081234500007", role: "CASHIER", isActive: true },
  { email: "mekanik1@bengkel.com", fullName: "Andi Pratama", phone: "081234500008", role: "MECHANIC", isActive: true },
  { email: "mekanik2@bengkel.com", fullName: "Rudi Hartono", phone: "081234500009", role: "MECHANIC", isActive: true },
  { email: "mekanik3@bengkel.com", fullName: "Dodi Permana", phone: "081234500010", role: "MECHANIC", isActive: true },
  { email: "mekanik4@bengkel.com", fullName: "Hendra Gunawan", phone: "081234500011", role: "MECHANIC", isActive: true },
  { email: "mekanik5@bengkel.com", fullName: "Yanto Supriadi", phone: "081234500012", role: "MECHANIC", isActive: true },
  { email: "mekanik6@bengkel.com", fullName: "Bambang Susilo", phone: "081234500013", role: "MECHANIC", isActive: true },
  { email: "mekanik7@bengkel.com", fullName: "Eko Prasetyo", phone: "081234500014", role: "MECHANIC", isActive: true },
  { email: "mekanik8@bengkel.com", fullName: "Asep Saepudin", phone: "081234500015", role: "MECHANIC", isActive: true },
  { email: "mekanik9@bengkel.com", fullName: "Jajang Mulyana", phone: "081234500016", role: "MECHANIC", isActive: true },
  { email: "mekanik10@bengkel.com", fullName: "Ujang Kurniawan", phone: "081234500017", role: "MECHANIC", isActive: true },
  { email: "mekanik11@bengkel.com", fullName: "Tatang Suherman", phone: "081234500018", role: "MECHANIC", isActive: true },
  { email: "mekanik12@bengkel.com", fullName: "Dadang Hermawan", phone: "081234500019", role: "MECHANIC", isActive: true },
  { email: "mekanik13@bengkel.com", fullName: "Ade Rahmat", phone: "081234500020", role: "MECHANIC", isActive: true },
  { email: "mekanik14@bengkel.com", fullName: "Iwan Setiawan", phone: "081234500021", role: "MECHANIC", isActive: true },
  { email: "mekanik15@bengkel.com", fullName: "Rudi Irawan", phone: "081234500022", role: "MECHANIC", isActive: true },
  { email: "mekanik16@bengkel.com", fullName: "Dedi Supardi", phone: "081234500023", role: "MECHANIC", isActive: true },
  { email: "mekanik17@bengkel.com", fullName: "Cecep Hermansyah", phone: "081234500024", role: "MECHANIC", isActive: true },
  { email: "mekanik18@bengkel.com", fullName: "Asep Sunandar", phone: "081234500025", role: "MECHANIC", isActive: true },
  { email: "mekanik19@bengkel.com", fullName: "Udin Sedunia", phone: "081234500026", role: "MECHANIC", isActive: true },
];

const vespaModels = [
  "Sprint 150",
  "Primavera 150",
  "GTS Super 300",
  "GTS Super Sport 300",
  "GTS Super Tech 300",
  "PX 150",
  "S 125",
  "LX 125",
  "Vespa 946",
  "Sprint S 150",
  "Primavera S 150",
  "Elettrica",
];

const expenseTitles = [
  "Beli ATK Kantor",
  "Beli Kopi & Snack Tim",
  "Bensin Test Ride Motor",
  "Biaya Kebersihan Bengkel",
  "Parkir Harian",
  "Peralatan Kebersihan",
  "Air Mineral Galon",
  "Sarung Tangan Mekanik",
  "Lap Microfiber",
  "Cairan Pembersih Rantai",
];

// ============================================================
// CLEAN DATABASE
// ============================================================
async function cleanDatabase() {
  console.log("🧹 Membersihkan database...\n");

  await prisma.notification.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.mechanicAssignment.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.productPriceHistory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Database berhasil dibersihkan\n");
}

// ============================================================
// SEEDING
// ============================================================
async function seed() {
  await cleanDatabase();
  console.log("🌱 Mulai seeding database (PRODUCTION VOLUME - MAX 7000 DATA)...\n");

  // ============================================================
  // STEP 1: Settings & Users (26 users)
  // ============================================================
  console.log("⚙️  [1/6] Membuat Settings & Users...");

  for (const setting of defaultSettings) {
    await prisma.setting.create({ data: setting });
  }

  const createdUsers = [];
  for (const user of userData) {
    createdUsers.push(await prisma.user.create({ data: user }));
  }

  const admins = createdUsers.filter((u) => u.role === "ADMIN");
  const cashiers = createdUsers.filter((u) => u.role === "CASHIER");
  const mechanics = createdUsers.filter((u) => u.role === "MECHANIC");

  console.log(`   ✅ ${createdUsers.length} users created (${admins.length} Admin, ${cashiers.length} Kasir, ${mechanics.length} Mekanik)\n`);

  // ============================================================
  // STEP 2: Customers & Vehicles (80 customers)
  // ============================================================
  console.log("👥 [2/6] Membuat 80 Customers & Vehicles...");

  const dbCustomers = [];
  for (let i = 0; i < 80; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        phone: faker.phone.number("08##########"),
      },
    });
    dbCustomers.push(customer);

    const vehicleCount = faker.number.int({ min: 1, max: 3 });
    for (let v = 0; v < vehicleCount; v++) {
      await prisma.vehicle.create({
        data: {
          plateNumber: `B ${faker.number.int({ min: 1000, max: 9999 })} ${faker.string.alpha({ length: 3, casing: "upper" })}`,
          brand: "Vespa",
          model: faker.helpers.arrayElement(vespaModels),
          customerId: customer.id,
        },
      });
    }
  }

  console.log(`   ✅ ${dbCustomers.length} customers created (~${Math.floor(dbCustomers.length * 2)} vehicles)\n`);

  // ============================================================
  // STEP 3: Products & Initial Stock
  // ============================================================
  console.log(`🏍️  [3/6] Membuat Products & Initial Stock (${sparepartNames.length + serviceNames.length} products)...`);

  const spareparts = [];
  const services = [];

  for (let i = 0; i < sparepartNames.length; i++) {
    const price = faker.number.int({ min: 15000, max: 1000000 });
    const cost = Math.floor(price * 0.6);
    const initialStock = faker.number.int({ min: 50, max: 150 });

    const p = await prisma.product.create({
      data: {
        name: sparepartNames[i],
        sku: generateSku("SPAREPART", i),
        type: "SPAREPART",
        price,
        cost,
        stock: initialStock,
        isActive: true,
      },
    });
    spareparts.push(p);

    await prisma.productPriceHistory.create({
      data: {
        productId: p.id,
        price: p.price,
        cost: p.cost,
        effectiveFrom: new Date("2026-01-01"),
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: "IN",
        sourceType: "PURCHASE",
        quantity: initialStock,
        recordedById: admins[0].id,
        note: "Stok awal",
        createdAt: new Date("2026-01-01"),
      },
    });
  }

  for (let i = 0; i < serviceNames.length; i++) {
    const price = faker.number.int({ min: 50000, max: 1000000 });
    const cost = Math.floor(price * 0.4);

    const p = await prisma.product.create({
      data: {
        name: serviceNames[i],
        sku: generateSku("SERVICE", i),
        type: "SERVICE",
        price,
        cost,
        stock: 0,
        isActive: true,
      },
    });
    services.push(p);

    await prisma.productPriceHistory.create({
      data: {
        productId: p.id,
        price: p.price,
        cost: p.cost,
        effectiveFrom: new Date("2026-01-01"),
      },
    });
  }

  console.log(`   ✅ ${spareparts.length} spareparts & ${services.length} services created\n`);

  // ============================================================
  // STEP 4: Shifts & Expenses (3 bulan: Jan-Mar 2026)
  // ============================================================
  console.log("🕐 [4/6] Membuat Shifts & Expenses (Jan - Mar 2026)...");

  const shifts = [];
  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-03-31");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue; // Minggu libur

    const cashier = faker.helpers.arrayElement(cashiers);

    const openedAt = new Date(d);
    openedAt.setHours(8, 0, 0, 0);

    const closedAt = new Date(d);
    closedAt.setHours(20, 0, 0, 0);

    const cashSales = faker.number.int({ min: 800000, max: 8000000 });
    const endingCash = 1000000 + cashSales;

    const shift = await prisma.shift.create({
      data: {
        cashierId: cashier.id,
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: endingCash,
        expectedCash: endingCash,
        cashSales: cashSales,
        cashIn: 0,
        cashOut: 0,
        discrepancy: 0,
        openedAt,
        closedAt: closedAt,
      },
    });
    shifts.push(shift);

    // 1-3 expenses per shift
    const numExpenses = faker.number.int({ min: 1, max: 3 });
    for (let e = 0; e < numExpenses; e++) {
      await prisma.expense.create({
        data: {
          title: faker.helpers.arrayElement(expenseTitles),
          amount: faker.number.int({ min: 15000, max: 300000 }),
          category: faker.helpers.arrayElement(["SUPPLIES", "MAINTENANCE", "UTILITIES", "RENT", "OTHER"]),
          shiftId: shift.id,
          recordedById: shift.cashierId,
          date: openedAt,
        },
      });
    }
  }

  console.log(`   ✅ ${shifts.length} shifts created (ALL CLOSED)\n`);

  // ============================================================
  // STEP 5: Orders (DENGAN COUNTER UNTUK ANTI DUPLICATE)
  // ============================================================
  console.log("📋 [5/6] Membuat Orders dengan STRICT BUSINESS LOGIC...\n");
  console.log("   ⚠️  1 ORDER = 1 MEKANIK (tidak campur) | Order Number anti-duplicate\n");

  let orderCount = 0;
  let globalOrderCounter = 0; // Counter global untuk unique order number

  const mechanicDailyTasks = {};
  mechanics.forEach((m) => {
    mechanicDailyTasks[m.id] = {};
  });

  const stockTracker = {};
  spareparts.forEach((sp) => {
    stockTracker[sp.id] = sp.stock;
  });

  for (const shift of shifts) {
    const shiftDay = shift.openedAt.toISOString().split("T")[0];

    mechanics.forEach((m) => {
      if (!mechanicDailyTasks[m.id][shiftDay]) {
        mechanicDailyTasks[m.id][shiftDay] = 0;
      }
    });

    // 8-15 orders per shift
    const totalOrders = faker.number.int({ min: 8, max: 15 });

    const draftCount = Math.max(0, Math.floor(totalOrders * 0.05));
    const queuedCount = Math.max(0, Math.floor(totalOrders * 0.10));
    const inProgressCount = Math.max(0, Math.floor(totalOrders * 0.15));
    const completedCount = Math.max(0, Math.floor(totalOrders * 0.20));
    const closedCount = Math.max(0, Math.floor(totalOrders * 0.45));
    const cancelledCount = Math.max(0, totalOrders - draftCount - queuedCount - inProgressCount - completedCount - closedCount);

    const orderStatuses = [
      ...Array(draftCount).fill("DRAFT"),
      ...Array(queuedCount).fill("QUEUED"),
      ...Array(inProgressCount).fill("IN_PROGRESS"),
      ...Array(completedCount).fill("COMPLETED"),
      ...Array(closedCount).fill("CLOSED"),
      ...Array(cancelledCount).fill("CANCELLED"),
    ];

    for (let i = orderStatuses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderStatuses[i], orderStatuses[j]] = [orderStatuses[j], orderStatuses[i]];
    }

    for (const status of orderStatuses) {
      globalOrderCounter++;
      
      const customer = faker.helpers.arrayElement(dbCustomers);
      const vehicles = await prisma.vehicle.findMany({
        where: { customerId: customer.id },
      });

      if (vehicles.length === 0) continue;

      const vehicle = faker.helpers.arrayElement(vehicles);

      // === 1 ORDER = 1 MEKANIK ===
      let assignedMechanicId = null;

      if (!["DRAFT", "CANCELLED"].includes(status)) {
        const availableMechanics = mechanics.filter(
          (m) => (mechanicDailyTasks[m.id][shiftDay] || 0) < 5
        );

        if (availableMechanics.length > 0) {
          assignedMechanicId = faker.helpers.arrayElement(availableMechanics).id;
          mechanicDailyTasks[assignedMechanicId][shiftDay] = (mechanicDailyTasks[assignedMechanicId][shiftDay] || 0) + 1;
        }
      }

      let subtotal = 0;
      const selectedItems = [];
      const numItems = faker.number.int({ min: 1, max: 5 });

      for (let j = 0; j < numItems; j++) {
        const isService = faker.datatype.boolean({ probability: 0.4 });
        const product = faker.helpers.arrayElement(isService ? services : spareparts);
        const qty = isService ? 1 : faker.number.int({ min: 1, max: 3 });
        const itemSubtotal = product.price * qty;
        subtotal += itemSubtotal;

        selectedItems.push({
          product,
          qty,
          subtotal: itemSubtotal,
          isService,
        });
      }

      const tax = Math.round(subtotal * 0.11);
      const total = subtotal + tax;

      const baseDate = new Date(shift.openedAt);
      baseDate.setMinutes(baseDate.getMinutes() + faker.number.int({ min: 10, max: 500 }));

      let diagnosedAt = null;
      let startedAt = null;
      let completedAt = null;
      let closedAt = null;
      let deletedAt = null;
      let paymentMethod = null;
      let paymentStatus = "PENDING";
      let amountPaid = 0;
      let changeAmount = 0;
      let paidAt = null;

      switch (status) {
        case "DRAFT":
          break;

        case "QUEUED":
          diagnosedAt = new Date(baseDate);
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          break;

        case "IN_PROGRESS":
          diagnosedAt = new Date(baseDate);
          startedAt = new Date(baseDate.getTime() + 15 * 60000);
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          break;

        case "COMPLETED":
          diagnosedAt = new Date(baseDate);
          startedAt = new Date(baseDate.getTime() + 15 * 60000);
          completedAt = new Date(baseDate.getTime() + faker.number.int({ min: 30, max: 150 }) * 60000);
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          paymentStatus = "PAID";
          paidAt = completedAt;
          amountPaid = paymentMethod === "CASH" ? total + faker.number.int({ min: 0, max: 200000 }) : total;
          changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
          break;

        case "CLOSED":
          diagnosedAt = new Date(baseDate);
          startedAt = new Date(baseDate.getTime() + 15 * 60000);
          completedAt = new Date(baseDate.getTime() + faker.number.int({ min: 30, max: 150 }) * 60000);
          closedAt = new Date(baseDate.getTime() + faker.number.int({ min: 60, max: 200 }) * 60000);
          paymentMethod = faker.helpers.arrayElement(["CASH", "QRIS"]);
          paymentStatus = "PAID";
          paidAt = closedAt;
          amountPaid = paymentMethod === "CASH" ? total + faker.number.int({ min: 0, max: 200000 }) : total;
          changeAmount = paymentMethod === "CASH" ? amountPaid - total : 0;
          break;

        case "CANCELLED":
          deletedAt = new Date(baseDate.getTime() + 10 * 60000);
          break;
      }

      // ORDER NUMBER DENGAN COUNTER UNIK
      const orderNumber = generateOrderNumber(baseDate, globalOrderCounter);

      const order = await prisma.order.create({
        data: {
          orderNumber,
          status: status,
          subtotal,
          tax,
          total,
          diagnosedAt,
          startedAt,
          completedAt,
          closedAt,
          deletedAt,
          cashierId: shift.cashierId,
          shiftId: shift.id,
          customerId: customer.id,
          vehicleId: vehicle.id,
          createdAt: baseDate,
          updatedAt: closedAt || completedAt || startedAt || diagnosedAt || baseDate,
        },
      });
      orderCount++;

      // Order items & mechanic assignments
      for (const item of selectedItems) {
        const orderItem = await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            productNameSnapshot: item.product.name,
            quantity: item.qty,
            unitPrice: item.product.price,
            unitCostSnapshot: item.product.cost,
            subtotal: item.subtotal,
          },
        });

        // Semua item service dalam 1 order di-assign ke MEKANIK YANG SAMA
        if (item.isService && assignedMechanicId && !["DRAFT", "CANCELLED"].includes(status)) {
          await prisma.mechanicAssignment.create({
            data: {
              orderItemId: orderItem.id,
              mechanicId: assignedMechanicId,
              startAt: ["QUEUED"].includes(status) ? null : startedAt,
              endAt: ["QUEUED", "IN_PROGRESS"].includes(status) ? null : completedAt,
            },
          });
        }

        // Stock movement untuk SPAREPART
        if (item.product.type === "SPAREPART" && ["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
          if (stockTracker[item.product.id] >= item.qty) {
            await prisma.stockMovement.create({
              data: {
                productId: item.product.id,
                type: "OUT",
                sourceType: "SALE",
                quantity: item.qty,
                orderItemId: orderItem.id,
                recordedById: shift.cashierId,
                createdAt: startedAt || diagnosedAt,
              },
            });

            await prisma.product.update({
              where: { id: item.product.id },
              data: { stock: { decrement: item.qty } },
            });
            stockTracker[item.product.id] -= item.qty;
          }
        }
      }

      // Payment
      if (!["DRAFT", "CANCELLED"].includes(status)) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: paymentMethod,
            amountPaid: amountPaid,
            change: changeAmount,
            status: paymentStatus,
            paidAt: paidAt,
          },
        });
      }

      // Order Status History
      const statusFlow = [];

      statusFlow.push({
        status: "DRAFT",
        note: "Pesanan dibuat",
        changedById: shift.cashierId,
        createdAt: baseDate,
      });

      if (["QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
        statusFlow.push({
          status: "QUEUED",
          note: "Masuk antrian pengerjaan",
          changedById: shift.cashierId,
          createdAt: diagnosedAt || new Date(baseDate.getTime() + 5 * 60000),
        });
      }

      if (["IN_PROGRESS", "COMPLETED", "CLOSED"].includes(status)) {
        statusFlow.push({
          status: "IN_PROGRESS",
          note: `Mekanik ${mechanics.find(m => m.id === assignedMechanicId)?.fullName || "Unknown"} mulai pengerjaan`,
          changedById: assignedMechanicId || shift.cashierId,
          createdAt: startedAt || new Date(baseDate.getTime() + 20 * 60000),
        });
      }

      if (["COMPLETED", "CLOSED"].includes(status)) {
        statusFlow.push({
          status: "COMPLETED",
          note: "Pengerjaan selesai, menunggu pembayaran",
          changedById: assignedMechanicId || shift.cashierId,
          createdAt: completedAt || new Date(baseDate.getTime() + 60 * 60000),
        });
      }

      if (status === "CLOSED") {
        statusFlow.push({
          status: "CLOSED",
          note: "Pembayaran lunas, motor diambil pelanggan",
          changedById: shift.cashierId,
          createdAt: closedAt || new Date(baseDate.getTime() + 90 * 60000),
        });
      }

      if (status === "CANCELLED") {
        statusFlow.push({
          status: "CANCELLED",
          note: "Pesanan dibatalkan",
          changedById: shift.cashierId,
          createdAt: deletedAt || new Date(baseDate.getTime() + 10 * 60000),
        });
      }

      for (const flow of statusFlow) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: flow.status,
            note: flow.note,
            changedById: flow.changedById,
            createdAt: flow.createdAt,
          },
        });
      }
    }
  }

  console.log(`   ✅ ${orderCount} orders created (1 order = 1 mekanik)\n`);

  // ============================================================
  // STEP 6: Notifications
  // ============================================================
  console.log("🔔 [6/6] Membuat Notifications...");

  await prisma.notification.create({
    data: {
      title: "Seeding Selesai",
      message: `Database berhasil di-seed.\n\nUsers: ${createdUsers.length}\nCustomers: ${dbCustomers.length}\nOrders: ${orderCount}\nShifts: ${shifts.length}\nProducts: ${spareparts.length + services.length}`,
      type: "SUCCESS",
      userId: admins[0].id,
    },
  });

  // Notif untuk semua user
  for (const user of createdUsers) {
    if (user.role === "ADMIN") continue;
    await prisma.notification.create({
      data: {
        title: "Selamat Bekerja",
        message: `Halo ${user.fullName}, sistem siap digunakan dengan data production.`,
        type: "INFO",
        userId: user.id,
      },
    });
  }

  console.log(`   ✅ ${createdUsers.length} notifications created\n`);

  // ============================================================
  // TOTAL ESTIMASI
  // ============================================================
  const totalEstimasi =
    defaultSettings.length +                              // settings (9)
    createdUsers.length +                                 // users (26)
    dbCustomers.length +                                  // customers (80)
    Math.floor(dbCustomers.length * 2) +                  // vehicles (~160)
    (spareparts.length + services.length) +               // products (95)
    (spareparts.length + services.length) +               // productPriceHistory (95)
    spareparts.length +                                   // stockMovement awal (60)
    shifts.length +                                       // shifts (~78)
    Math.floor(shifts.length * 2) +                       // expenses (~156)
    orderCount +                                          // orders (~900)
    Math.floor(orderCount * 3) +                          // orderItems (~2700)
    Math.floor(orderCount * 0.4) +                        // mechanicAssignments (~360)
    Math.floor(orderCount * 0.9) +                        // payments (~810)
    Math.floor(orderCount * 3.5) +                        // orderStatusHistory (~3150)
    createdUsers.length;                                  // notifications (26)

  console.log("==================================================");
  console.log("✅ SEEDING BERHASIL");
  console.log("==================================================");
  console.log(`👥 Users          : ${createdUsers.length} (${admins.length} Admin, ${cashiers.length} Kasir, ${mechanics.length} Mekanik)`);
  console.log(`👤 Customers      : ${dbCustomers.length}`);
  console.log(`🚗 Vehicles       : ~${Math.floor(dbCustomers.length * 2)}`);
  console.log(`🏍️  Products       : ${spareparts.length + services.length} (${spareparts.length} Spareparts, ${services.length} Services)`);
  console.log(`🕐 Shifts         : ${shifts.length} (ALL CLOSED)`);
  console.log(`💰 Expenses       : ~${Math.floor(shifts.length * 2)}`);
  console.log(`📋 Orders         : ${orderCount}`);
  console.log(`📦 OrderItems     : ~${Math.floor(orderCount * 3)}`);
  console.log(`🔧 Assignments    : ~${Math.floor(orderCount * 0.4)}`);
  console.log(`💳 Payments       : ~${Math.floor(orderCount * 0.9)}`);
  console.log(`📜 Status History : ~${Math.floor(orderCount * 3.5)}`);
  console.log(`🔔 Notifications  : ${createdUsers.length}`);
  console.log(`--------------------------------------------------`);
  console.log(`📊 TOTAL ESTIMASI : ~${totalEstimasi} data`);
  console.log(`🔧 Mekanik/Order  : 1 Mekanik per Order (tidak campur)`);
  console.log("==================================================");
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌ Seeding gagal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });