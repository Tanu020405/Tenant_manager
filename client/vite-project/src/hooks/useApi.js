import axios from "axios";
import { useAuth } from "./useAuth.js";

/**
 * useApi — returns an axios instance pre-configured with
 * Authorization header and x-tenant-id for the current user.
 */
export const useApi = () => {
    const { token, tenantId } = useAuth();

    const instance = axios.create({
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(tenantId && { "x-tenant-id": tenantId }),
        },
    });

    // Add automatic retry for Render cold starts (which look like Network/CORS errors)
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const config = error.config;
            if (!config || config._retryCount >= 3) {
                return Promise.reject(error);
            }
            
            // Render cold start often throws a generic Network Error or 502/503
            if (error.message === "Network Error" || (error.response && error.response.status >= 500)) {
                config._retryCount = (config._retryCount || 0) + 1;
                
                // Wait 2.5 seconds before retrying (gives Render time to wake up)
                await new Promise(resolve => setTimeout(resolve, 2500));
                
                return instance(config);
            }
            
            return Promise.reject(error);
        }
    );

    return instance;
};
