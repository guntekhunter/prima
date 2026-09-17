import axios from "axios";
export const getBranch = async () => {
  try {
    const res = await axios.get("/api/get/branches");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getPlatform = async () => {
  try {
    const res = await axios.get("/api/get/platform");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getStatus = async () => {
  try {
    const res = await axios.get("/api/get/status");
    return res;
  } catch (error) {
    console.log("Failed to fetch organisations", error);
  }
};

export const getLeads = async () => {
  try {
    const res = await axios.get("/api/get/leads");
    return res.data;
  } catch (error) {
    console.log("Failed to fetch leads", error);
  }
};

export const getRoles = async () => {
  try {
    const res = await axios.get("/api/get/roles");
    return res;
  } catch (error) {
    console.log("Failed to fetch roles", error);
  }
};

export const getExpenseCategories = async () => {
  try {
    const res = await axios.get("/api/get/expense_categories");
    return res;
  } catch (error) {
    console.log("Failed to fetch expense categories", error);
  }
};

export const getExpenses = async () => {
  try {
    const res = await axios.get("/api/get/expenses");
    return res.data;
  } catch (error) {
    console.log("Failed to fetch expenses", error);
  }
};

export const getInvoices = async () => {
  try {
    const res = await axios.get("/api/get/invoices");
    return res.data as {
      id: string;
      margin: number;
      total_prize: number;
      created_at: string;
      lead_id: string;
      leads: { branch_id: string } | null;
    }[];
  } catch (error) {
    console.log("Failed to fetch invoices", error);
    return [];
  }
};

export const getInvoiceCategories = async () => {
  try {
    const res = await axios.get("/api/get/invoice_categories");
    return res.data as {
      id: string;
      category_name: string;
      position: number;
    }[];
  } catch (error) {
    console.log("Failed to fetch invoice categories", error);
    return [];
  }
};

export const getUnits = async () => {
  try {
    const res = await axios.get("/api/get/units");
    return res.data as { id: string; name: string }[];
  } catch (error) {
    console.log("Failed to fetch units", error);
    return [];
  }
};
