import axios from "axios";

export const updateLead = async (
    id: number,
    payload: Record<string, any>
) => {
    const res = await axios.patch(
        `/api/leads/${id}`,
        payload
    );

    return res.data;
};