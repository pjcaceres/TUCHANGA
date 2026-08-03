export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  WorkersList: undefined;
  WorkerProfile: { workerId: string; nombre: string };
  Premium: undefined;
  DejarResena: { workerId: string; nombreTrabajador: string };
};
