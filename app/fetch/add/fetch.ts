import axios from "axios";

export const createLead = async (payload: CreateLeadPayload) => {
  const res = await axios.post("/api/add/leads", payload);
  return res.data;
};
