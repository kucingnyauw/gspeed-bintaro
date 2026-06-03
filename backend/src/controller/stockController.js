import CatchAsync from "#shared/utils/response.js";
import StockService from "#service/stockService.js";

import {
  recordStockInSchema,
  recordStockOutSchema,
  recordStockAdjustmentSchema,
  getStockMovementsQuerySchema,
  productIdParamSchema,
  movementIdParamSchema,
  orderIdParamSchema,
} from "#validation/stockValidation.js";

import validate from "#validation/validation.js";

import {
  StockMovementDetailDto,
  StockMovementListDto,
} from "#dtos/stockDto.js";

/**
 * Controller untuk mengelola endpoint mutasi stok
 * @class StockController
 */
class StockController {
  constructor() {
    this.stockService = new StockService();
  }

  /**
   * [POST] Mencatat stok masuk
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  recordStockIn = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockInSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordStockIn(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.note,
      payload.sourceType
    );

    res.status(201).json({
      success: true,
      message: "Stok masuk berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat stok keluar
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  recordStockOut = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockOutSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordStockOut(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.orderItemId,
      payload.note,
      payload.sourceType
    );

    res.status(201).json({
      success: true,
      message: "Stok keluar berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat stok keluar untuk penjualan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  recordSaleOut = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockOutSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordSaleOut(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.orderItemId
    );

    res.status(201).json({
      success: true,
      message: "Stok keluar penjualan berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat stok masuk untuk retur
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  recordReturnIn = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockInSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordReturnIn(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.note
    );

    res.status(201).json({
      success: true,
      message: "Stok masuk retur berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [POST] Mencatat penyesuaian stok
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  recordAdjustment = CatchAsync.run(async (req, res) => {
    const payload = validate(recordStockAdjustmentSchema, req.body);
    const recordedById = req.user.id;

    const movement = await this.stockService.recordAdjustment(
      payload.productId,
      payload.quantity,
      recordedById,
      payload.note
    );

    res.status(201).json({
      success: true,
      message: "Penyesuaian stok berhasil dicatat",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [GET] Mendapatkan daftar mutasi stok dengan filter dan paginasi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getStockMovements = CatchAsync.run(async (req, res) => {
    const query = validate(getStockMovementsQuerySchema, req.query);

    const result = await this.stockService.getStockMovements(query);

    res.status(200).json({
      success: true,
      message: "Daftar mutasi stok berhasil diambil",
      data: result.data.map((movement) => new StockMovementListDto(movement)),
      metadata: result.metadata,
    });
  });

  /**
   * [GET] Mendapatkan detail mutasi stok berdasarkan ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getStockMovementById = CatchAsync.run(async (req, res) => {
    const { id } = validate(movementIdParamSchema, req.params);

    const movement = await this.stockService.getStockMovementById(id);

    res.status(200).json({
      success: true,
      message: "Detail mutasi stok berhasil diambil",
      data: new StockMovementDetailDto(movement),
    });
  });

  /**
   * [GET] Mendapatkan mutasi stok berdasarkan produk
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMovementsByProduct = CatchAsync.run(async (req, res) => {
    const { productId } = validate(productIdParamSchema, req.params);
    const query = validate(getStockMovementsQuerySchema, req.query);

    const result = await this.stockService.getMovementsByProduct(
      productId,
      query
    );

    res.status(200).json({
      success: true,
      message: "Riwayat mutasi stok produk berhasil diambil",
      data: result.data.map((movement) => new StockMovementListDto(movement)),
      metadata: result.metadata,
    });
  });

  /**
   * [GET] Mendapatkan mutasi stok berdasarkan order
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMovementsByOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);

    const movements = await this.stockService.getMovementsByOrder(orderId);

    res.status(200).json({
      success: true,
      message: "Mutasi stok berdasarkan order berhasil diambil",
      data: movements.map((movement) => new StockMovementListDto(movement)),
    });
  });

  /**
   * [DELETE] Menghapus record mutasi stok
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  deleteStockMovement = CatchAsync.run(async (req, res) => {
    const { id } = validate(movementIdParamSchema, req.params);

    await this.stockService.deleteStockMovement(id);

    res.status(200).json({
      success: true,
      message: "Record mutasi stok berhasil dihapus",
      data: null,
    });
  });

  /**
   * [DELETE] Menghapus banyak record mutasi stok sekaligus
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  deleteStockMovements = CatchAsync.run(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user.id;

    const result = await this.stockService.deleteStockMovements(ids, userId);

    res.status(200).json({
      success: true,
      message: `${result.summary.deleted} record mutasi stok berhasil dihapus`,
      data: result,
    });
  });
}

export default new StockController();