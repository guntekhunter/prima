import axios from "axios";

export const deleteLead = async (id: number) => {
    const res = await axios.delete("/api/add/leads", {
        data: { id },
    });

    return res.data;
};