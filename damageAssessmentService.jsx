import api from "./apiService";

const API_BASE_URL = "/damage-assessment/item-damage-request";

export const damageAssessmentService = {
  /**
   * 1️⃣ Get Damage Requests (Table View)
   * GET /list
   */
  getDamageRequests: async ({
    page = 0,
    size = 10,
    status,
    customerId,
  } = {}) => {
    const { data } = await api.get(`${API_BASE_URL}/list`, {
      params: {
        page,
        size,
        status,
        customerId,
      },
      meta: { includeDcid: true },
    });
    return data;
  },

  /**
   * 2️⃣ Get Damage Request Details (Sidebar View)
   * GET /{id}
   */
  getDamageRequestById: async (id) => {
    if (!id) throw new Error("Damage request ID is required");

    const { data } = await api.get(`${API_BASE_URL}/${id}`, {
      meta: { includeDcid: true },
    });
    return data;
  },

  /**
   * 3️⃣ Create Damage Request
   * POST /create
   */
  createDamageRequest: async (payload) => {
    const {
      customerId,
      productId,
      quantity,
      price,
      sourceId,
      sourceType,
      notes,
      images,
    } = payload;

    if (!customerId || !productId || !quantity || !sourceId || !sourceType) {
      throw new Error("Missing required fields for creating damage request");
    }

    const { data } = await api.post(
      `${API_BASE_URL}/create`,
      {
        customerId,
        productId,
        quantity,
        price,
        sourceId,
        sourceType,
        notes,
        images,
      },
      { meta: { includeDcid: true } }
    );

    return data;
  },

  /**
   * 4️⃣ Update Damage Request
   * PUT /{id}
   */
  updateDamageRequest: async (id, payload) => {
    if (!id) throw new Error("Damage request ID is required");

    const { data } = await api.put(
      `${API_BASE_URL}/${id}`,
      payload,
      { meta: { includeDcid: true } }
    );

    return data;
  },

  /**
   * 5️⃣ Approve Damage Request
   * POST /{id}/approve
   */
  approveDamageRequest: async (id) => {
    if (!id) throw new Error("Damage request ID is required");

    const { data } = await api.post(
      `${API_BASE_URL}/${id}/approve`,
      {},
      { meta: { includeDcid: true } }
    );

    return data;
  },

  /**
   * 6️⃣ Reject Damage Request
   * POST /{id}/reject
   */
  rejectDamageRequest: async (id) => {
    if (!id) throw new Error("Damage request ID is required");

    const { data } = await api.post(
      `${API_BASE_URL}/${id}/reject`,
      {},
      { meta: { includeDcid: true } }
    );

    return data;
  },

  /**
   * 7️⃣ Delete (Cancel) Damage Request
   * DELETE /{id}
   */
  deleteDamageRequest: async (id) => {
    if (!id) throw new Error("Damage request ID is required");

    await api.delete(`${API_BASE_URL}/${id}`, {
      meta: { includeDcid: true },
    });
  },
};
