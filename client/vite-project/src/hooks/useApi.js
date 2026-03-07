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

    return instance;
};
