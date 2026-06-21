import axios from "axios";

export const createLead = async (payload: CreateLeadPayload) => {
  try {
    const res = await axios.post("/api/add/leads", payload);
    return res;
  } catch (error: any) {
    console.log("Failed to create lead:", error?.response?.data || error);
    throw error;
  }
};
