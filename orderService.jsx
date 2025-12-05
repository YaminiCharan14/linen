import axios from 'axios';
import { BASE_URL } from '../config';
import { getApiHeaders } from '../utils/apiHeaders';

const API_BASE_URL = `${BASE_URL}/api/orders`; // Adjust the base URL as needed



export const orderService = {
    getAllOrders: async () => {
        try {
            const response = await axios.get(API_BASE_URL, {
                headers: getApiHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },
    searchOrders: async (filter) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/search`, filter, {
                headers: getApiHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error searching orders:', error);
            throw error;
        }
    },
    createOrder: async (orderData) => {
        try {
            const response = await axios.post(API_BASE_URL, orderData, {
                headers: getApiHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },
    getIncompleteOrders: async (customerId) => {
        const response = await axios.get(`${API_BASE_URL}/customers/${customerId}/incomplete`, {
            headers: getApiHeaders()
        });
        return response.data;
    },

    updateOrder: async (orderData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/${orderData.id}`, orderData, {
                headers: getApiHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }
    },

    deleteOrderById: async (orderId) => {
        try {
            await axios.delete(`${API_BASE_URL}/${orderId}`, {
                headers: getApiHeaders()
            });
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    },

    recordCompleteOrder: async (orderReferenceId, completedTime) => {
        try {
            const payload = {
                orderReferenceId,
                completedTime,
            };
            const response = await axios.post(`${API_BASE_URL}/record/complete`, payload, {
                headers: getApiHeaders()
            });
            return response.data;
        } catch (error) {
            console.error("Failed to complete order:", error);
            throw error;
        }
    },

//Rejection apis

createRejectionRequest: async (orderId, rejectionData) => {
    try {
        const url = `${API_BASE_URL}/leasing-orders/${orderId}/rejection-requests`;
        const response = await axios.post(url, rejectionData, {
            headers: getApiHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error creating rejection request:", error);
        throw error;
    }
},

deleteRejectionRequest: async (rejectionRequestId) => {
    try {
        const url = `${API_BASE_URL}/leasing-orders/rejection-requests/${rejectionRequestId}`;
        await axios.delete(url, {
            headers: getApiHeaders(),
        });
        return true; 
    } catch (error) {
        console.error("Error deleting rejection request:", error);
        throw error;
    }
},

updateRejectionRequestStatus: async (rejectionRequestId, newStatus) => {
    try {
        const url = `${API_BASE_URL}/leasing-orders/rejection-requests/${rejectionRequestId}/status`;
        const body = { status: newStatus };

        const response = await axios.patch(url, body, {
            headers: getApiHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error updating rejection request status:", error);
        throw error;
    }
},



    // Add more methods for other order-related API calls if needed
}; 