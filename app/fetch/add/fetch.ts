import axios from "axios";

export const createLead = async (payload: CreateLeadPayload) => {
  const res = await axios.post("/api/add/leads", payload);
  return res.data;
};

export const createExpense = async (payload: CreateExpensePayload) => {
  const res = await axios.post("/api/add/expanses", payload);
  return res.data;
};

