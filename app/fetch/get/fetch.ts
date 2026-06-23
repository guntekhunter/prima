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

