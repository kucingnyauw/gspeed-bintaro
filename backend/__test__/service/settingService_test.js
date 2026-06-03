import SettingService from "#service/settingService.js";
import SettingRepository from "#repository/settingRepository.js";

jest.mock("#repository/settingRepository.js");

describe("SettingService", () => {
  let service;
  let mockSettingRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    SettingRepository.mockClear();
    
    service = new SettingService();
    service.clearCache();
    
    mockSettingRepo = SettingRepository.mock.instances[0];
  });

  // ============================================================
  // get
  // ============================================================
  describe("get", () => {
    it("should return value from database when not cached", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      const result = await service.get("tax_rate");
      
      expect(result).toBe("11");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledWith("tax_rate");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);
    });

    it("should return default value when setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.get("unknown", "default");
      
      expect(result).toBe("default");
    });

    it("should use cache on subsequent calls", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      await service.get("tax_rate");
      await service.get("tax_rate");
      const result = await service.get("tax_rate");

      expect(result).toBe("11");
      // Should only call repository once because of cache
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);
    });

    it("should return null when no default provided and setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.get("missing");
      
      expect(result).toBeNull();
    });

    it("should return value directly from setting object", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ 
        key: "shop_name", 
        value: "Bengkel Jaya",
        updatedAt: new Date()
      });

      const result = await service.get("shop_name");
      
      expect(result).toBe("Bengkel Jaya");
    });

    it("should cache different keys separately", async () => {
      mockSettingRepo.findByKey
        .mockResolvedValueOnce({ key: "key1", value: "value1" })
        .mockResolvedValueOnce({ key: "key2", value: "value2" });

      const result1 = await service.get("key1");
      const result2 = await service.get("key2");

      expect(result1).toBe("value1");
      expect(result2).toBe("value2");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(2);
    });

    it("should return cached value even if repository changes", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      await service.get("tax_rate");
      
      // Change mock return value
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "20" });
      
      const result = await service.get("tax_rate");
      
      // Should still return cached value
      expect(result).toBe("11");
    });
  });

  // ============================================================
  // getNumber
  // ============================================================
  describe("getNumber", () => {
    it("should return number value from string", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      const result = await service.getNumber("tax_rate");
      
      expect(result).toBe(11);
      expect(typeof result).toBe("number");
    });

    it("should return number value from number", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "max", value: 100 });

      const result = await service.getNumber("max");
      
      expect(result).toBe(100);
    });

    it("should return default number when not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getNumber("unknown", 5);
      
      expect(result).toBe(5);
    });

    it("should return 0 as default when not specified", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getNumber("unknown");
      
      expect(result).toBe(0);
    });

    it("should return NaN for non-numeric string", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "name", value: "abc" });

      const result = await service.getNumber("name");
      
      expect(result).toBeNaN();
    });

    it("should use cache for number values", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });

      await service.getNumber("tax_rate");
      await service.getNumber("tax_rate");

      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // getBoolean
  // ============================================================
  describe("getBoolean", () => {
    it("should return true for string 'true'", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature", value: "true" });

      const result = await service.getBoolean("feature");
      
      expect(result).toBe(true);
    });

    it("should return false for string 'false'", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature", value: "false" });

      const result = await service.getBoolean("feature");
      
      expect(result).toBe(false);
    });

    it("should return true for boolean true", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature", value: true });

      const result = await service.getBoolean("feature");
      
      expect(result).toBe(true);
    });

    it("should return false for any other string", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature", value: "yes" });

      const result = await service.getBoolean("feature");
      
      expect(result).toBe(false);
    });

    it("should return false for number 0", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature", value: 0 });

      const result = await service.getBoolean("feature");
      
      expect(result).toBe(false);
    });

    it("should return default when not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getBoolean("unknown", true);
      
      expect(result).toBe(true);
    });

    it("should return false as default when not specified", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getBoolean("unknown");
      
      expect(result).toBe(false);
    });

    it("should use cache for boolean values", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "feature", value: "true" });

      await service.getBoolean("feature");
      await service.getBoolean("feature");

      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // getString
  // ============================================================
  describe("getString", () => {
    it("should convert number value to string", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "shop", value: 12345 });

      const result = await service.getString("shop");
      
      expect(result).toBe("12345");
      expect(typeof result).toBe("string");
    });

    it("should return string value as is", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "name", value: "Bengkel Jaya" });

      const result = await service.getString("name");
      
      expect(result).toBe("Bengkel Jaya");
    });

    it("should convert boolean to string", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "active", value: true });

      const result = await service.getString("active");
      
      expect(result).toBe("true");
    });

    it("should return empty string as default when not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getString("unknown");
      
      expect(result).toBe("");
    });

    it("should return custom default string", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.getString("unknown", "default_value");
      
      expect(result).toBe("default_value");
    });

    it("should use cache for string values", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "name", value: "Test" });

      await service.getString("name");
      await service.getString("name");

      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // set
  // ============================================================
  describe("set", () => {
    it("should upsert setting and convert value to string", async () => {
      mockSettingRepo.upsert.mockResolvedValue({ key: "tax_rate", value: "12" });

      const result = await service.set("tax_rate", 12);
      
      expect(result).toEqual({ key: "tax_rate", value: "12" });
      expect(mockSettingRepo.upsert).toHaveBeenCalledWith("tax_rate", "12");
    });

    it("should convert boolean to string", async () => {
      mockSettingRepo.upsert.mockResolvedValue({ key: "active", value: "true" });

      await service.set("active", true);
      
      expect(mockSettingRepo.upsert).toHaveBeenCalledWith("active", "true");
    });

    it("should convert object to string", async () => {
      mockSettingRepo.upsert.mockResolvedValue({ key: "config", value: "[object Object]" });

      await service.set("config", { foo: "bar" });
      
      expect(mockSettingRepo.upsert).toHaveBeenCalledWith("config", "[object Object]");
    });

    it("should invalidate cache after update", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });
      mockSettingRepo.upsert.mockResolvedValue({ key: "tax_rate", value: "12" });

      // Cache the old value
      await service.get("tax_rate");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(1);

      // Update the value
      await service.set("tax_rate", "12");
      
      // Get again - should fetch from repository because cache was invalidated
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "12" });
      const result = await service.get("tax_rate");

      expect(result).toBe("12");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(2);
    });

    it("should invalidate only the updated key", async () => {
      mockSettingRepo.findByKey
        .mockResolvedValueOnce({ key: "key1", value: "value1" })
        .mockResolvedValueOnce({ key: "key2", value: "value2" });
      mockSettingRepo.upsert.mockResolvedValue({ key: "key1", value: "new1" });

      await service.get("key1");
      await service.get("key2");

      // Update key1
      await service.set("key1", "new1");

      // key1 should fetch again, key2 should use cache
      mockSettingRepo.findByKey.mockResolvedValue({ key: "key1", value: "new1" });
      
      const result1 = await service.get("key1");
      const result2 = await service.get("key2");

      expect(result1).toBe("new1");
      expect(result2).toBe("value2");
      // key1 was fetched twice (initial + after cache invalidation)
      // key2 was fetched once (cached)
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================
  // delete
  // ============================================================
  describe("delete", () => {
    it("should delete setting and invalidate cache", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "11" });
      mockSettingRepo.delete.mockResolvedValue(undefined);

      // Cache the value
      await service.get("tax_rate");

      // Delete the setting
      await service.delete("tax_rate");

      expect(mockSettingRepo.delete).toHaveBeenCalledWith("tax_rate");

      // Get again - should fetch from repository
      mockSettingRepo.findByKey.mockResolvedValue(null);
      const result = await service.get("tax_rate", "default");

      expect(result).toBe("default");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // getAll
  // ============================================================
  describe("getAll", () => {
    it("should return all settings", async () => {
      const mockSettings = [
        { key: "tax_rate", value: "11" },
        { key: "max_tasks", value: "5" },
        { key: "shop_name", value: "Bengkel Jaya" },
      ];
      mockSettingRepo.findAll.mockResolvedValue(mockSettings);

      const result = await service.getAll();
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockSettings);
      expect(mockSettingRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no settings", async () => {
      mockSettingRepo.findAll.mockResolvedValue([]);

      const result = await service.getAll();
      
      expect(result).toEqual([]);
    });

    it("should not use cache for getAll", async () => {
      const mockSettings = [{ key: "tax_rate", value: "11" }];
      mockSettingRepo.findAll.mockResolvedValue(mockSettings);

      await service.getAll();
      await service.getAll();

      // Should call repository each time (no caching for getAll)
      expect(mockSettingRepo.findAll).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // clearCache
  // ============================================================
  describe("clearCache", () => {
    it("should clear all cached values", async () => {
      mockSettingRepo.findByKey
        .mockResolvedValueOnce({ key: "key1", value: "value1" })
        .mockResolvedValueOnce({ key: "key2", value: "value2" })
        .mockResolvedValueOnce({ key: "key1", value: "new1" })
        .mockResolvedValueOnce({ key: "key2", value: "new2" });

      // Cache both values
      await service.get("key1");
      await service.get("key2");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(2);

      // Clear all cache
      service.clearCache();

      // Both should fetch again
      const result1 = await service.get("key1");
      const result2 = await service.get("key2");

      expect(result1).toBe("new1");
      expect(result2).toBe("new2");
      expect(mockSettingRepo.findByKey).toHaveBeenCalledTimes(4);
    });

    it("should not affect repository after clear", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "key1", value: "value1" });

      await service.get("key1");
      service.clearCache();
      
      mockSettingRepo.findByKey.mockResolvedValue({ key: "key1", value: "updated" });
      const result = await service.get("key1");

      expect(result).toBe("updated");
    });
  });

  // ============================================================
  // Integration scenarios
  // ============================================================
  describe("integration scenarios", () => {
    it("should handle get -> set -> get flow correctly", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "10" });
      mockSettingRepo.upsert.mockResolvedValue({ key: "tax_rate", value: "15" });

      // Initial get
      const initial = await service.get("tax_rate");
      expect(initial).toBe("10");

      // Update
      await service.set("tax_rate", 15);

      // Get after update - should fetch new value
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "15" });
      const updated = await service.get("tax_rate");
      expect(updated).toBe("15");
    });

    it("should handle get -> delete -> get flow correctly", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "tax_rate", value: "10" });
      mockSettingRepo.delete.mockResolvedValue(undefined);

      // Initial get
      const initial = await service.get("tax_rate");
      expect(initial).toBe("10");

      // Delete
      await service.delete("tax_rate");

      // Get after delete - should return default
      mockSettingRepo.findByKey.mockResolvedValue(null);
      const result = await service.get("tax_rate", "default");
      expect(result).toBe("default");
    });

    it("should handle multiple types for the same key", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ key: "count", value: "42" });

      const asString = await service.getString("count");
      const asNumber = await service.getNumber("count");
      const asBoolean = await service.getBoolean("count");

      expect(asString).toBe("42");
      expect(asNumber).toBe(42);
      expect(asBoolean).toBe(false); // "42" is not "true"
    });
  });
});