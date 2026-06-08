import type PocketBase from 'pocketbase';

export const MachinesApi = {
  getMachines: async (pb: PocketBase) => {
    const machines = await pb.collection('machines').getFullList();
    return machines;
  },
};
