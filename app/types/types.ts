type CreateLeadPayload = {
  name: string;
  phone_number: string;
  branch_id: string;
  status_id: string;
  address: string;
  nominal: number;
  platform_id: string;
  user_id: string;
};
type Lead = {
  id: number;
  name: string;
  phone_number: string;
  address: string;
  nominal: number;

  branch_id: string;
  status_id: string;
  platform_id: string;

  branches?: { name: string } | null;
  status?: { name: string } | null;
  platform?: { name: string } | null;
};
